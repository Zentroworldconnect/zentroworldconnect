/* ==========================================
   Zentro World Connect - Admin Control JS
   ========================================== */

// --- HYBRID PERSISTENCE (SUPABASE CONFIGURATION) ---
// If you want to connect to Supabase Cloud Database:
// 1. Set SUPABASE_URL and SUPABASE_ANON_KEY variables below.
// 2. Create tables using the schema provided in the walkthrough.
// If either is empty, the dashboard automatically falls back to browser LocalStorage.
const SUPABASE_URL = "https://fvzqxddabdgybvozrlvs.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2enF4ZGRhYmRneWJ2b3pybHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTU5MzMsImV4cCI6MjA5NzgzMTkzM30.6_2PebBxhvppoIXwMIWhfYJDfKDz4a73kWNecHsFlec";

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client initialized in Admin Panel");
    } else {
        console.error("Supabase CDN script not loaded correctly.");
    }
}

document.addEventListener('DOMContentLoaded', () => {

    /* --- AUTHENTICATION SHIELD --- */
    const loginOverlay = document.getElementById('loginOverlay');
    const adminContainer = document.getElementById('adminContainer');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Initialize default password in LocalStorage if not present
    if (!localStorage.getItem('zentro_admin_password')) {
        localStorage.setItem('zentro_admin_password', 'zentro123');
    }

    // Sync credentials from Supabase settings on load if configured
    const syncCredentialsFromSupabase = async () => {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from('settings').select('adminPassword').eq('id', 1).maybeSingle();
                if (!error && data && data.adminPassword) {
                    localStorage.setItem('zentro_admin_password', data.adminPassword);
                }
            } catch (e) {
                console.error("Failed to sync credentials from Supabase:", e);
            }
        }
    };
    syncCredentialsFromSupabase();

    // Check if already authenticated in this session
    const checkAuth = () => {
        if (sessionStorage.getItem('zentro_auth') === 'true') {
            loginOverlay.style.display = 'none';
            adminContainer.style.display = 'grid';
            initializeAdminPanel();
        } else {
            loginOverlay.style.display = 'flex';
            adminContainer.style.display = 'none';
        }
    };

    // Authenticate submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            let isValid = true;

            if (usernameInput.value.trim() === '') {
                showFieldError(usernameInput, true);
                isValid = false;
            } else {
                showFieldError(usernameInput, false);
            }

            if (passwordInput.value.trim() === '') {
                showFieldError(passwordInput, true);
                isValid = false;
            } else {
                showFieldError(passwordInput, false);
            }

            if (isValid) {
                const savedPassword = localStorage.getItem('zentro_admin_password') || 'zentro123';
                if (usernameInput.value.trim() === 'admin' && passwordInput.value.trim() === savedPassword) {
                    sessionStorage.setItem('zentro_auth', 'true');
                    usernameInput.value = '';
                    passwordInput.value = '';
                    checkAuth();
                } else {
                    // Password validation styling error
                    const passGroup = document.getElementById('passGroup');
                    if (passGroup) passGroup.classList.add('error');
                }
            }
        });
    }

    function showFieldError(element, hasError) {
        const parent = element.closest('.form-group');
        if (parent) {
            if (hasError) parent.classList.add('error');
            else parent.classList.remove('error');
        }
    }

    // Log Out
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('zentro_auth');
            checkAuth();
        });
    }

    checkAuth(); // Run initial auth check

    /* ==========================================
         ADMIN CORE CONTROLLER ACTIONS
         ========================================== */
    function initializeAdminPanel() {
        
        // 1. Sidebar Tab Switcher
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const tabPanels = document.querySelectorAll('.tab-panel');
        const currentTabTitle = document.getElementById('currentTabTitle');
        const currentTabSub = document.getElementById('currentTabSub');

        const tabDetails = {
            overview: { title: "Dashboard Overview", sub: "Real-time statistics and quote requests." },
            products: { title: "Manage Products", sub: "Add, edit, or delete items from the exports catalog." },
            inquiries: { title: "Client Inquiries", sub: "Manage and export incoming customer quote requests." },
            settings: { title: "Site Settings", sub: "Configure branding colors, company information, and lead contacts." }
        };

        const switchTab = (tabId) => {
            sidebarLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-tab') === tabId) link.classList.add('active');
            });

            tabPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `panel-${tabId}`) panel.classList.add('active');
            });

            if (tabDetails[tabId]) {
                currentTabTitle.innerText = tabDetails[tabId].title;
                currentTabSub.innerText = tabDetails[tabId].sub;
            }

            // Custom Loaders based on tab
            if (tabId === 'overview') renderOverview();
            if (tabId === 'products') renderProductsTable();
            if (tabId === 'inquiries') renderInquiriesTable();
            if (tabId === 'settings') loadSettingsForm();
        };

        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

        // Overview Tab link shortcut
        document.querySelectorAll('.view-inquiries-shortcut').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target-tab');
                switchTab(target);
            });
        });

        // 2. Load Data Helpers (Hybrid Database routing)
        const getProducts = async () => {
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.from('products').select('*').order('id');
                    if (!error && data) return data;
                    console.error("Supabase select products error:", error);
                } catch (e) {
                    console.error("Supabase connection exception:", e);
                }
            }
            return JSON.parse(localStorage.getItem('zentro_products')) || [];
        };

        const getInquiries = async () => {
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.from('inquiries').select('*').order('date', { ascending: false });
                    if (!error && data) return data;
                    console.error("Supabase select inquiries error:", error);
                } catch (e) {
                    console.error("Supabase connection exception:", e);
                }
            }
            return JSON.parse(localStorage.getItem('zentro_inquiries')) || [];
        };

        const getSettings = async () => {
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.from('settings').select('*').eq('id', 1).maybeSingle();
                    if (!error && data) {
                        if (data.adminPassword) {
                            localStorage.setItem('zentro_admin_password', data.adminPassword);
                        }
                        return data;
                    }
                    console.error("Supabase select settings error:", error);
                } catch (e) {
                    console.error("Supabase connection exception:", e);
                }
            }
            return JSON.parse(localStorage.getItem('zentro_settings')) || {};
        };

        // 3. Dynamic Color Styling Previews
        const applyThemeColors = (sets) => {
            if (!sets || !sets.primaryColor) return;
            const root = document.documentElement;
            root.style.setProperty('--primary', sets.primaryColor);
            root.style.setProperty('--primary-light', sets.secondaryColor);
            root.style.setProperty('--primary-dark', darkenColor(sets.primaryColor, 30));
            root.style.setProperty('--secondary', sets.primaryColor);
            root.style.setProperty('--secondary-hover', darkenColor(sets.primaryColor, 20));
            root.style.setProperty('--accent', sets.accentColor);
        };

        function darkenColor(hex, percent) {
            let num = parseInt(hex.replace("#",""), 16),
                amt = Math.round(2.55 * percent),
                R = (num >> 16) - amt,
                G = (num >> 8 & 0x00FF) - amt,
                B = (num & 0x0000FF) - amt;
            return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x100 + (B<0?0:B>255?255:B)).toString(16).slice(1);
        }

        // Apply theme color on page load
        getSettings().then(applyThemeColors);

        // Update badge counts in sidebar on load
        const updateSidebarBadges = async () => {
            const inqs = await getInquiries();
            const count = inqs.length;
            const badge = document.getElementById('inquiryCountBadge');
            if (badge) {
                badge.innerText = count;
                badge.style.display = count > 0 ? 'inline-block' : 'none';
            }
        };
        updateSidebarBadges();

        /* --- DASHBOARD OVERVIEW RENDER --- */
        const renderOverview = async () => {
            const currentProds = await getProducts();
            const currentInqs = await getInquiries();
            const currentSets = await getSettings();

            // Set counters
            document.getElementById('statTotalInquiries').innerText = currentInqs.length;
            document.getElementById('statTotalProducts').innerText = currentProds.length;
            
            if (currentSets.leadName) document.getElementById('statLeadName').innerText = currentSets.leadName;
            if (currentSets.leadPhone) document.getElementById('statLeadPhone').innerText = currentSets.leadPhone;

            // Render recent 3 inquiries
            const recentInquiriesList = document.getElementById('recentInquiriesList');
            if (recentInquiriesList) {
                recentInquiriesList.innerHTML = '';
                const recents = currentInqs.slice(0, 3); // Get first 3

                if (recents.length === 0) {
                    recentInquiriesList.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center py-4 text-muted">No inquiries received yet. Submit a quote request on the main page.</td>
                        </tr>
                    `;
                    return;
                }

                recents.forEach(inq => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${inq.date ? inq.date.split(',')[0] : 'N/A'}</td>
                        <td><strong>${inq.name}</strong><br><span style="font-size:0.75rem;color:var(--text-muted);">${inq.company}</span></td>
                        <td>${inq.flower}</td>
                        <td>${inq.volume}</td>
                        <td>${inq.destination}</td>
                        <td><span class="inquiry-status-badge">New</span></td>
                    `;
                    recentInquiriesList.appendChild(row);
                });
            }
            updateSidebarBadges();
        };

        renderOverview(); // Render on initialization

        /* --- PRODUCTS MANAGEMENT (CRUD) --- */
        const productModal = document.getElementById('productModal');
        const addProductBtn = document.getElementById('addProductBtn');
        const closeProductModal = document.getElementById('closeProductModal');
        const cancelProductBtn = document.getElementById('cancelProductBtn');
        const productForm = document.getElementById('productForm');
        const productsTableBody = document.getElementById('productsTableBody');
        const productModalTitle = document.getElementById('productModalTitle');

        const prodImageFile = document.getElementById('prodImageFile');
        const prodImage = document.getElementById('prodImage');
        const prodImagePreview = document.getElementById('prodImagePreview');
        const imagePreviewBox = document.getElementById('imagePreviewBox');
        const prodImageSelect = document.getElementById('prodImageSelect');

        // Image Canvas Compression handler
        if (prodImageFile) {
            prodImageFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Reset preset dropdown selection
                if (prodImageSelect) prodImageSelect.value = '';

                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        // Target dimensions (max 400px width/height) to ensure size < 30KB
                        const maxDimension = 400;
                        if (width > maxDimension || height > maxDimension) {
                            if (width > height) {
                                height = Math.round((height * maxDimension) / width);
                                width = maxDimension;
                            } else {
                                width = Math.round((width * maxDimension) / height);
                                height = maxDimension;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress to JPEG with 70% quality
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                        prodImage.value = compressedBase64;
                        
                        if (prodImagePreview) prodImagePreview.src = compressedBase64;
                        if (imagePreviewBox) imagePreviewBox.style.display = 'block';

                        // Clear error status
                        const group = prodImageFile.closest('.form-group');
                        if (group) group.classList.remove('error');
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // Preset dropdown selection handler
        if (prodImageSelect) {
            prodImageSelect.addEventListener('change', () => {
                if (prodImageSelect.value) {
                    prodImage.value = prodImageSelect.value;
                    if (prodImagePreview) prodImagePreview.src = prodImageSelect.value;
                    if (imagePreviewBox) imagePreviewBox.style.display = 'block';
                    
                    // Reset file input
                    if (prodImageFile) prodImageFile.value = '';

                    // Clear error status
                    const group = prodImageSelect.closest('.form-group');
                    if (group) group.classList.remove('error');
                } else {
                    if (!prodImageFile.files.length) {
                        prodImage.value = '';
                        if (imagePreviewBox) imagePreviewBox.style.display = 'none';
                    }
                }
            });
        }

        const renderProductsTable = async () => {
            const currentProds = await getProducts();
            productsTableBody.innerHTML = '';

            if (currentProds.length === 0) {
                productsTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4 text-muted">No flowers currently listed. Add a variety.</td>
                    </tr>
                `;
                return;
            }

            currentProds.forEach(prod => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><img src="${prod.image}" alt="${prod.name}" class="product-table-img"></td>
                    <td><strong>${prod.name}</strong></td>
                    <td style="text-transform: capitalize;">${prod.category === 'traditional' ? 'Traditional Scented' : 'Cut Flowers'}</td>
                    <td>${prod.grade}</td>
                    <td>${prod.budLife}</td>
                    <td>${prod.availability}</td>
                    <td>
                        <div class="actions-cell">
                            <button class="btn-icon edit-btn" data-id="${prod.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="btn-icon delete-btn" data-id="${prod.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                `;
                productsTableBody.appendChild(tr);
            });

            // Bind Edit Action Buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pId = btn.getAttribute('data-id');
                    openProductEditModal(pId);
                });
            });

            // Bind Delete Action Buttons
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pId = btn.getAttribute('data-id');
                    deleteProductAction(pId);
                });
            });
        };

        // Open Modal for Create
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                productForm.reset();
                document.getElementById('editProductId').value = '';
                prodImage.value = '';
                if (prodImagePreview) prodImagePreview.src = '';
                if (imagePreviewBox) imagePreviewBox.style.display = 'none';
                productModalTitle.innerText = 'Add Sourced Flower Variety';
                document.querySelectorAll('.modal-card .form-group').forEach(grp => grp.classList.remove('error'));
                productModal.classList.add('active');
            });
        }

        // Open Modal for Edit
        const openProductEditModal = async (pId) => {
            const list = await getProducts();
            const matched = list.find(p => p.id === pId);
            if (!matched) return;

            productForm.reset();
            document.getElementById('editProductId').value = matched.id;
            document.getElementById('prodName').value = matched.name;
            document.getElementById('prodCategory').value = matched.category;
            document.getElementById('prodGrade').value = matched.grade;
            document.getElementById('prodBudLife').value = matched.budLife;
            document.getElementById('prodAvailability').value = matched.availability;
            document.getElementById('prodPackage').value = matched.package;
            document.getElementById('prodImage').value = matched.image;
            document.getElementById('prodDescription').value = matched.description;

            // Load Preview and preset selectors
            if (matched.image) {
                if (prodImagePreview) prodImagePreview.src = matched.image;
                if (imagePreviewBox) imagePreviewBox.style.display = 'block';
                if (prodImageSelect) {
                    if (matched.image.startsWith('assets/')) {
                        prodImageSelect.value = matched.image;
                    } else {
                        prodImageSelect.value = '';
                    }
                }
            } else {
                if (imagePreviewBox) imagePreviewBox.style.display = 'none';
                if (prodImageSelect) prodImageSelect.value = '';
            }

            productModalTitle.innerText = 'Edit Flower Variety';
            document.querySelectorAll('.modal-card .form-group').forEach(grp => grp.classList.remove('error'));
            productModal.classList.add('active');
        };

        // Close Modal
        const closeModal = () => {
            productModal.classList.remove('active');
        };

        if (closeProductModal) closeProductModal.addEventListener('click', closeModal);
        if (cancelProductBtn) cancelProductBtn.addEventListener('click', closeModal);

        // Delete Product Action
        const deleteProductAction = async (pId) => {
            const list = await getProducts();
            const matched = list.find(p => p.id === pId);
            if (!matched) return;

            if (confirm(`Are you sure you want to delete ${matched.name}? This will remove it from the homepage catalog.`)) {
                if (supabaseClient) {
                    try {
                        const { error } = await supabaseClient.from('products').delete().eq('id', pId);
                        if (!error) {
                            renderProductsTable();
                            return;
                        }
                        console.error("Supabase product deletion error:", error);
                        alert("Failed to delete product from Supabase: " + error.message);
                    } catch (e) {
                        console.error("Supabase exception:", e);
                    }
                }
                const updated = list.filter(p => p.id !== pId);
                localStorage.setItem('zentro_products', JSON.stringify(updated));
                renderProductsTable();
            }
        };

        // Save / Update Form Submission
        if (productForm) {
            productForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                let isFormValid = true;

                const fields = ['prodName', 'prodCategory', 'prodGrade', 'prodBudLife', 'prodAvailability', 'prodPackage', 'prodDescription'];
                fields.forEach(fId => {
                    const input = document.getElementById(fId);
                    if (input.value.trim() === '') {
                        showFieldError(input, true);
                        isFormValid = false;
                    } else {
                        showFieldError(input, false);
                    }
                });

                // Image validation
                const imageUploadGroup = document.getElementById('imageUploadGroup');
                if (prodImage.value.trim() === '') {
                    if (imageUploadGroup) imageUploadGroup.classList.add('error');
                    isFormValid = false;
                } else {
                    if (imageUploadGroup) imageUploadGroup.classList.remove('error');
                }

                if (isFormValid) {
                    const editId = document.getElementById('editProductId').value;
                    const list = await getProducts();
                    
                    const prodObj = {
                        name: document.getElementById('prodName').value.trim(),
                        category: document.getElementById('prodCategory').value,
                        grade: document.getElementById('prodGrade').value.trim(),
                        budLife: document.getElementById('prodBudLife').value.trim(),
                        availability: document.getElementById('prodAvailability').value.trim(),
                        package: document.getElementById('prodPackage').value.trim(),
                        image: prodImage.value,
                        description: document.getElementById('prodDescription').value.trim()
                    };

                    if (editId) {
                        prodObj.id = editId;
                        if (supabaseClient) {
                            try {
                                const { error } = await supabaseClient.from('products').update(prodObj).eq('id', editId);
                                if (!error) {
                                    closeModal();
                                    renderProductsTable();
                                    return;
                                }
                                console.error("Supabase product update error:", error);
                                alert("Failed to update in Supabase, using local storage. Error: " + error.message);
                            } catch (e) {
                                console.error("Supabase exception:", e);
                            }
                        }
                        const idx = list.findIndex(p => p.id === editId);
                        if (idx !== -1) {
                            list[idx] = prodObj;
                        }
                    } else {
                        prodObj.id = Date.now().toString();
                        if (supabaseClient) {
                            try {
                                const { error } = await supabaseClient.from('products').insert([prodObj]);
                                if (!error) {
                                    closeModal();
                                    renderProductsTable();
                                    return;
                                }
                                console.error("Supabase product insert error:", error);
                                alert("Failed to save to Supabase, using local storage. Error: " + error.message);
                            } catch (e) {
                                console.error("Supabase exception:", e);
                            }
                        }
                        list.push(prodObj);
                    }

                    localStorage.setItem('zentro_products', JSON.stringify(list));
                    closeModal();
                    renderProductsTable();
                }
            });
        }

        /* --- INQUIRIES MANAGEMENT --- */
        const inquiriesTableBody = document.getElementById('inquiriesTableBody');
        const inquiryModal = document.getElementById('inquiryModal');
        const closeInquiryModal = document.getElementById('closeInquiryModal');
        const inquiryDoneBtn = document.getElementById('inquiryDoneBtn');
        const inquiryModalBody = document.getElementById('inquiryModalBody');
        const exportCsvBtn = document.getElementById('exportCsvBtn');

        const renderInquiriesTable = async () => {
            const inquiries = await getInquiries();
            inquiriesTableBody.innerHTML = '';

            if (inquiries.length === 0) {
                inquiriesTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4 text-muted">No inquiries received yet. Submit a quote on the frontpage.</td>
                    </tr>
                `;
                return;
            }

            inquiries.forEach(inq => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${inq.date ? inq.date.split(',')[0] : 'N/A'}</td>
                    <td><strong>${inq.name}</strong><br><span style="font-size:0.75rem;color:var(--text-muted);">${inq.company}</span></td>
                    <td>${inq.flower}</td>
                    <td>${inq.volume}</td>
                    <td>${inq.destination}</td>
                    <td>
                        <div class="actions-cell">
                            <a href="tel:${cleanPhone(inq.phone)}" class="btn-icon view-btn" title="Call Client"><i class="fa-solid fa-phone"></i></a>
                            <a href="https://wa.me/${cleanPhone(inq.phone).replace('+','')}" target="_blank" class="btn-icon edit-btn" style="background-color:#25d366;border-color:#25d366;color:#fff;" title="WhatsApp Link"><i class="fa-brands fa-whatsapp"></i></a>
                        </div>
                    </td>
                    <td>
                        <div class="actions-cell">
                            <button class="btn-icon view-inq-btn" data-id="${inq.id}" title="View Details"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn-icon delete-inq-btn" data-id="${inq.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                `;
                inquiriesTableBody.appendChild(tr);
            });

            // Bind View inquiry Buttons
            document.querySelectorAll('.view-inq-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const inqId = btn.getAttribute('data-id');
                    openInquiryModal(inqId);
                });
            });

            // Bind Delete inquiry Buttons
            document.querySelectorAll('.delete-inq-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const inqId = btn.getAttribute('data-id');
                    deleteInquiryAction(inqId);
                });
            });
            updateSidebarBadges();
        };

        const openInquiryModal = async (inqId) => {
            const list = await getInquiries();
            const inq = list.find(i => i.id === inqId);
            if (!inq) return;

            inquiryModalBody.innerHTML = `
                <div class="inquiry-details-grid">
                    <div class="inquiry-detail-block">
                        <span class="label">Received Date</span>
                        <p class="val">${inq.date}</p>
                    </div>
                    <div class="inquiry-detail-block">
                        <span class="label">Customer Name</span>
                        <p class="val"><strong>${inq.name}</strong></p>
                    </div>
                    <div class="inquiry-detail-block">
                        <span class="label">Importer Firm</span>
                        <p class="val">${inq.company}</p>
                    </div>
                    <div class="inquiry-detail-block">
                        <span class="label">Target Flower Variety</span>
                        <p class="val"><strong>${inq.flower}</strong></p>
                    </div>
                    <div class="inquiry-detail-block">
                        <span class="label">Required Volume</span>
                        <p class="val">${inq.volume}</p>
                    </div>
                    <div class="inquiry-detail-block">
                        <span class="label">Destination Airport</span>
                        <p class="val">${inq.destination}</p>
                    </div>
                    <div class="inquiry-detail-block">
                        <span class="label">Email Address</span>
                        <p class="val"><a href="mailto:${inq.email}" style="color:var(--primary);text-decoration:underline;">${inq.email}</a></p>
                    </div>
                    <div class="inquiry-detail-block">
                        <span class="label">Phone / WhatsApp</span>
                        <p class="val"><a href="tel:${cleanPhone(inq.phone)}" style="color:var(--primary);text-decoration:underline;">${inq.phone}</a></p>
                    </div>
                    <div class="inquiry-detail-block full-width">
                        <span class="label">Additional Sourcing & Packaging Notes</span>
                        <p class="val notes-val">${inq.notes}</p>
                    </div>
                </div>
            `;

            inquiryModal.classList.add('active');
        };

        const closeInqModal = () => {
            inquiryModal.classList.remove('active');
        };

        if (closeInquiryModal) closeInquiryModal.addEventListener('click', closeInqModal);
        if (inquiryDoneBtn) inquiryDoneBtn.addEventListener('click', closeInqModal);

        const deleteInquiryAction = async (inqId) => {
            if (confirm("Are you sure you want to delete this quote request?")) {
                if (supabaseClient) {
                    try {
                        const { error } = await supabaseClient.from('inquiries').delete().eq('id', inqId);
                        if (!error) {
                            renderInquiriesTable();
                            return;
                        }
                        console.error("Supabase inquiry deletion error:", error);
                    } catch (e) {
                        console.error("Supabase exception:", e);
                    }
                }
                const list = await getInquiries();
                const updated = list.filter(i => i.id !== inqId);
                localStorage.setItem('zentro_inquiries', JSON.stringify(updated));
                renderInquiriesTable();
            }
        };

        // Export to CSV Functionality
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', async () => {
                const list = await getInquiries();
                if (list.length === 0) {
                    alert("No inquiries available to export.");
                    return;
                }

                // Headers
                let csvContent = "Date,Name,Company,Email,Phone,Variety,Volume,Destination,Notes\n";

                // Loop through inquiries
                list.forEach(inq => {
                    const row = [
                        `"${(inq.date || '').replace(/"/g, '""')}"`,
                        `"${(inq.name || '').replace(/"/g, '""')}"`,
                        `"${(inq.company || '').replace(/"/g, '""')}"`,
                        `"${(inq.email || '').replace(/"/g, '""')}"`,
                        `"${(inq.phone || '').replace(/"/g, '""')}"`,
                        `"${(inq.flower || '').replace(/"/g, '""')}"`,
                        `"${(inq.volume || '').replace(/"/g, '""')}"`,
                        `"${(inq.destination || '').replace(/"/g, '""')}"`,
                        `"${(inq.notes || '').replace(/"/g, '""')}"`
                    ].join(",");
                    csvContent += row + "\n";
                });

                // Trigger file download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `zentro_inquiries_export_${Date.now()}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }


        /* --- SETTINGS MANAGER --- */
        const settingsForm = document.getElementById('settingsForm');
        
        // Color input colorpicker and text input synchronization
        const setupColorSync = (colorInputId, hexInputId) => {
            const picker = document.getElementById(colorInputId);
            const text = document.getElementById(hexInputId);

            if (picker && text) {
                picker.addEventListener('input', () => {
                    text.value = picker.value.toUpperCase();
                });
                text.addEventListener('input', () => {
                    if (text.value.startsWith('#') && text.value.length === 7) {
                        picker.value = text.value;
                    }
                });
            }
        };

        setupColorSync('primaryColor', 'primaryColorHex');
        setupColorSync('secondaryColor', 'secondaryColorHex');
        setupColorSync('accentColor', 'accentColorHex');

        // Hero Image Canvas Compression & Preview
        const heroImageFile = document.getElementById('setHeroImageFile');
        const heroImage = document.getElementById('setHeroImage');
        const heroImagePreview = document.getElementById('heroImagePreview');
        const heroImagePreviewBox = document.getElementById('heroImagePreviewBox');
        const heroImageSelect = document.getElementById('setHeroImageSelect');

        if (heroImageFile) {
            heroImageFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (heroImageSelect) heroImageSelect.value = '';

                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        // Max dimension 800px for large hero background images
                        const maxDimension = 800;
                        if (width > maxDimension || height > maxDimension) {
                            if (width > height) {
                                height = Math.round((height * maxDimension) / width);
                                width = maxDimension;
                            } else {
                                width = Math.round((width * maxDimension) / height);
                                height = maxDimension;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress to JPEG with 60% quality
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                        heroImage.value = compressedBase64;
                        
                        if (heroImagePreview) heroImagePreview.src = compressedBase64;
                        if (heroImagePreviewBox) heroImagePreviewBox.style.display = 'block';

                        const group = heroImageFile.closest('.form-group');
                        if (group) group.classList.remove('error');
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        if (heroImageSelect) {
            heroImageSelect.addEventListener('change', () => {
                if (heroImageSelect.value) {
                    heroImage.value = heroImageSelect.value;
                    if (heroImagePreview) heroImagePreview.src = heroImageSelect.value;
                    if (heroImagePreviewBox) heroImagePreviewBox.style.display = 'block';
                    if (heroImageFile) heroImageFile.value = '';

                    const group = heroImageSelect.closest('.form-group');
                    if (group) group.classList.remove('error');
                } else {
                    if (!heroImageFile.files.length) {
                        heroImage.value = '';
                        if (heroImagePreviewBox) heroImagePreviewBox.style.display = 'none';
                    }
                }
            });
        }

        // About Us Image Canvas Compression & Preview
        const aboutImageFile = document.getElementById('setAboutImageFile');
        const aboutImage = document.getElementById('setAboutImage');
        const aboutImagePreview = document.getElementById('aboutImagePreview');
        const aboutImagePreviewBox = document.getElementById('aboutImagePreviewBox');
        const aboutImageSelect = document.getElementById('setAboutImageSelect');

        if (aboutImageFile) {
            aboutImageFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (aboutImageSelect) aboutImageSelect.value = '';

                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        // Max dimension 800px for About Us main section image
                        const maxDimension = 800;
                        if (width > maxDimension || height > maxDimension) {
                            if (width > height) {
                                height = Math.round((height * maxDimension) / width);
                                width = maxDimension;
                            } else {
                                width = Math.round((width * maxDimension) / height);
                                height = maxDimension;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress to JPEG with 60% quality
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                        aboutImage.value = compressedBase64;
                        
                        if (aboutImagePreview) aboutImagePreview.src = compressedBase64;
                        if (aboutImagePreviewBox) aboutImagePreviewBox.style.display = 'block';

                        const group = aboutImageFile.closest('.form-group');
                        if (group) group.classList.remove('error');
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        if (aboutImageSelect) {
            aboutImageSelect.addEventListener('change', () => {
                if (aboutImageSelect.value) {
                    aboutImage.value = aboutImageSelect.value;
                    if (aboutImagePreview) aboutImagePreview.src = aboutImageSelect.value;
                    if (aboutImagePreviewBox) aboutImagePreviewBox.style.display = 'block';
                    if (aboutImageFile) aboutImageFile.value = '';

                    const group = aboutImageSelect.closest('.form-group');
                    if (group) group.classList.remove('error');
                } else {
                    if (!aboutImageFile.files.length) {
                        aboutImage.value = '';
                        if (aboutImagePreviewBox) aboutImagePreviewBox.style.display = 'none';
                    }
                }
            });
        }

        const loadSettingsForm = async () => {
            const sets = await getSettings();
            
            // Branding colors
            if (sets.primaryColor) {
                document.getElementById('primaryColor').value = sets.primaryColor;
                document.getElementById('primaryColorHex').value = sets.primaryColor.toUpperCase();
            }
            if (sets.secondaryColor) {
                document.getElementById('secondaryColor').value = sets.secondaryColor;
                document.getElementById('secondaryColorHex').value = sets.secondaryColor.toUpperCase();
            }
            if (sets.accentColor) {
                document.getElementById('accentColor').value = sets.accentColor;
                document.getElementById('accentColorHex').value = sets.accentColor.toUpperCase();
            }

            // Company info
            if (sets.officeName) document.getElementById('setOfficeName').value = sets.officeName;
            if (sets.officeEmail) document.getElementById('setOfficeEmail').value = sets.officeEmail;
            if (sets.officePhone) document.getElementById('setOfficePhone').value = sets.officePhone;
            if (sets.officeAddress) document.getElementById('setOfficeAddress').value = sets.officeAddress;

            // Manager Info
            if (sets.leadName) document.getElementById('setLeadName').value = sets.leadName;
            if (sets.leadPhone) document.getElementById('setLeadPhone').value = sets.leadPhone;
            if (sets.leadEmail) document.getElementById('setLeadEmail').value = sets.leadEmail;

            // Hero Banner info
            if (sets.heroTitle) document.getElementById('setHeroTitle').value = sets.heroTitle;
            if (sets.heroDescription) document.getElementById('setHeroDescription').value = sets.heroDescription;
            if (sets.heroImage) {
                document.getElementById('setHeroImage').value = sets.heroImage;
                const preview = document.getElementById('heroImagePreview');
                const previewBox = document.getElementById('heroImagePreviewBox');
                if (preview) preview.src = sets.heroImage;
                if (previewBox) previewBox.style.display = 'block';
                if (document.getElementById('setHeroImageSelect')) {
                    if (sets.heroImage.startsWith('assets/')) {
                        document.getElementById('setHeroImageSelect').value = sets.heroImage;
                    } else {
                        document.getElementById('setHeroImageSelect').value = '';
                    }
                }
            }
            // About Us info
            if (sets.aboutTitle) document.getElementById('setAboutTitle').value = sets.aboutTitle;
            if (sets.aboutDescription) document.getElementById('setAboutDescription').value = sets.aboutDescription;
            if (sets.aboutImage) {
                document.getElementById('setAboutImage').value = sets.aboutImage;
                const preview = document.getElementById('aboutImagePreview');
                const previewBox = document.getElementById('aboutImagePreviewBox');
                if (preview) preview.src = sets.aboutImage;
                if (previewBox) previewBox.style.display = 'block';
                if (document.getElementById('setAboutImageSelect')) {
                    if (sets.aboutImage.startsWith('assets/')) {
                        document.getElementById('setAboutImageSelect').value = sets.aboutImage;
                    } else {
                        document.getElementById('setAboutImageSelect').value = '';
                    }
                }
            }
        };

        if (settingsForm) {
            settingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                let isFormValid = true;

                // Validate all fields
                const textFields = ['setOfficeName', 'setOfficeEmail', 'setOfficePhone', 'setOfficeAddress', 'setLeadName', 'setLeadPhone', 'setLeadEmail', 'setHeroTitle', 'setHeroDescription', 'setAboutTitle', 'setAboutDescription'];
                textFields.forEach(fId => {
                    const input = document.getElementById(fId);
                    if (input.value.trim() === '') {
                        showFieldError(input, true);
                        isFormValid = false;
                    } else {
                        showFieldError(input, false);
                    }
                });

                // Validate hero background image presence
                const heroImgVal = document.getElementById('setHeroImage').value.trim();
                const heroImgFileEl = document.getElementById('setHeroImageFile');
                if (heroImgVal === '') {
                    const group = heroImgFileEl.closest('.form-group');
                    if (group) group.classList.add('error');
                    isFormValid = false;
                } else {
                    const group = heroImgFileEl.closest('.form-group');
                    if (group) group.classList.remove('error');
                }

                // Validate About Section image presence
                const aboutImgVal = document.getElementById('setAboutImage').value.trim();
                const aboutImgFileEl = document.getElementById('setAboutImageFile');
                if (aboutImgVal === '') {
                    const group = aboutImgFileEl.closest('.form-group');
                    if (group) group.classList.add('error');
                    isFormValid = false;
                } else {
                    const group = aboutImgFileEl.closest('.form-group');
                    if (group) group.classList.remove('error');
                }

                // Validate Password Fields if filled
                const currentPassInput = document.getElementById('currentPassword');
                const newPassInput = document.getElementById('newPassword');
                const confPassInput = document.getElementById('confirmPassword');

                const hasPasswordInput = currentPassInput.value.trim() !== '' || newPassInput.value.trim() !== '' || confPassInput.value.trim() !== '';
                let newPassValue = null;

                if (hasPasswordInput) {
                    const savedPassword = localStorage.getItem('zentro_admin_password') || 'zentro123';
                    
                    if (currentPassInput.value.trim() !== savedPassword) {
                        showFieldError(currentPassInput, true);
                        isFormValid = false;
                    } else {
                        showFieldError(currentPassInput, false);
                    }

                    if (newPassInput.value.trim().length < 4) {
                        showFieldError(newPassInput, true);
                        isFormValid = false;
                    } else {
                        showFieldError(newPassInput, false);
                    }

                    if (newPassInput.value.trim() !== confPassInput.value.trim()) {
                        showFieldError(confPassInput, true);
                        isFormValid = false;
                    } else {
                        showFieldError(confPassInput, false);
                    }

                    if (isFormValid) {
                        newPassValue = newPassInput.value.trim();
                    }
                }

                if (isFormValid) {
                    const updatedSettings = {
                        primaryColor: document.getElementById('primaryColorHex').value.trim(),
                        secondaryColor: document.getElementById('secondaryColorHex').value.trim(),
                        accentColor: document.getElementById('accentColorHex').value.trim(),
                        
                        officeName: document.getElementById('setOfficeName').value.trim(),
                        officeEmail: document.getElementById('setOfficeEmail').value.trim(),
                        officePhone: document.getElementById('setOfficePhone').value.trim(),
                        officeAddress: document.getElementById('setOfficeAddress').value.trim(),
                        
                        leadName: document.getElementById('setLeadName').value.trim(),
                        leadPhone: document.getElementById('setLeadPhone').value.trim(),
                        leadEmail: document.getElementById('setLeadEmail').value.trim(),

                        heroTitle: document.getElementById('setHeroTitle').value.trim(),
                        heroDescription: document.getElementById('setHeroDescription').value.trim(),
                        heroImage: document.getElementById('setHeroImage').value,

                        aboutTitle: document.getElementById('setAboutTitle').value.trim(),
                        aboutDescription: document.getElementById('setAboutDescription').value.trim(),
                        aboutImage: document.getElementById('setAboutImage').value
                    };

                    // Update local storage password if validated successfully
                    if (newPassValue) {
                        localStorage.setItem('zentro_admin_password', newPassValue);
                        updatedSettings.adminPassword = newPassValue;
                        currentPassInput.value = '';
                        newPassInput.value = '';
                        confPassInput.value = '';
                        alert("Administrator access password updated successfully!");
                    } else {
                        updatedSettings.adminPassword = localStorage.getItem('zentro_admin_password') || 'zentro123';
                    }

                    if (supabaseClient) {
                        try {
                            const { error } = await supabaseClient.from('settings').upsert({ id: 1, ...updatedSettings });
                            if (!error) {
                                applyThemeColors(updatedSettings);
                                alert("Settings saved successfully to Supabase cloud! Main landing page details and branding colors have been updated.");
                                return;
                            }
                            console.error("Supabase settings upsert error:", error);
                            alert("Failed to save to Supabase cloud, saving locally as fallback. Error: " + error.message);
                        } catch (e) {
                            console.error("Supabase exception:", e);
                        }
                    }

                    localStorage.setItem('zentro_settings', JSON.stringify(updatedSettings));
                    
                    // Trigger live color updates on dashboard
                    applyThemeColors(updatedSettings);
                    
                    alert("Settings saved successfully! Main landing page details and branding colors have been updated.");
                }
            });
        }

    }

    // Helper functions
    function cleanPhone(phone) {
        if (!phone) return "";
        return String(phone).replace(/[^+\d]/g, '');
    }

});
