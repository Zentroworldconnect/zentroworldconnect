/* ==========================================
   Zentro World Connect - Model Website Logic
   ========================================== */

const SUPABASE_URL = "https://fvzqxddabdgybvozrlvs.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2enF4ZGRhYmRneWJ2b3pybHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTU5MzMsImV4cCI6MjA5NzgzMTkzM30.6_2PebBxhvppoIXwMIWhfYJDfKDz4a73kWNecHsFlec";

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client initialized");
    }
}

document.addEventListener('DOMContentLoaded', async () => {

    /* --- DEFAULT CATALOG PRODUCTS DATA --- */
    const defaultCatalogProducts = [
        {
            id: "1",
            name: "Rose",
            category: "cutflowers",
            description: "Classic export-grade long-stem roses in red, pink, and yellow.",
            image: "assets/flower_rose.png"
        },
        {
            id: "2",
            name: "Tuberose",
            category: "cutflowers",
            description: "Intensely fragrant white blooms for high-end events and decor.",
            image: "assets/flower_tuberose.png"
        },
        {
            id: "3",
            name: "Pitchi",
            category: "traditional",
            description: "Traditional fragrant variety specifically cultivated for traditional garlands.",
            image: "assets/flower_jasmine.png"
        },
        {
            id: "4",
            name: "Mullai",
            category: "traditional",
            description: "Exceptional durability and scent, perfect for daily exports.",
            image: "assets/flower_lotus.png"
        },
        {
            id: "5",
            name: "Marigold",
            category: "traditional",
            description: "High-impact golden blooms for large-scale festival decorations.",
            image: "assets/flower_marigold.png"
        },
        {
            id: "6",
            name: "Lotus",
            category: "seasonal",
            description: "Pristine lotus blossoms handled with extreme care.",
            image: "assets/flower_purple.png"
        },
        {
            id: "7",
            name: "Jasmine",
            category: "traditional",
            description: "Our flagship export variety, known for its strong aroma and bud quality.",
            image: "assets/flower_jasmine.png"
        },
        {
            id: "8",
            name: "Garlands",
            category: "traditional",
            description: "Expertly crafted traditional garlands packed for airfreight.",
            image: "assets/flower_garland_full.png"
        }
    ];

    let currentProducts = defaultCatalogProducts;

    /* --- HYBRID DATABASE FETCH (SUPABASE / LOCALSTORAGE) --- */
    const loadProductsFromDB = async () => {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from('products').select('*').order('id');
                if (!error && data && data.length >= 4) {
                    currentProducts = data;
                    localStorage.setItem('zentro_products', JSON.stringify(data));
                    return;
                }
            } catch (e) {
                console.error("Supabase select products error:", e);
            }
        }
        const local = localStorage.getItem('zentro_products');
        if (local) {
            try {
                const parsed = JSON.parse(local);
                if (parsed && parsed.length >= 4) {
                    currentProducts = parsed;
                    return;
                }
            } catch (e) {}
        }
        currentProducts = defaultCatalogProducts;
    };

    const loadSettingsFromDB = async () => {
        let sets = null;
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from('settings').select('*').eq('id', 1).maybeSingle();
                if (!error && data) sets = data;
            } catch (e) {}
        }
        if (!sets) {
            const local = localStorage.getItem('zentro_settings');
            if (local) sets = JSON.parse(local);
        }

        if (sets) {
            // Apply Dynamic Brand Color
            if (sets.primaryColor) {
                document.documentElement.style.setProperty('--primary', sets.primaryColor);
            }
            // Apply Dynamic Contacts if provided
            if (sets.officeEmail) {
                document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
                    el.href = `mailto:${sets.officeEmail}`;
                    if (el.textContent.includes('@')) el.textContent = sets.officeEmail;
                });
            }
            if (sets.officePhone) {
                document.querySelectorAll('a[href^="tel:"]').forEach(el => {
                    el.href = `tel:${sets.officePhone.replace(/\s+/g, '')}`;
                    if (el.textContent.includes('+')) el.textContent = sets.officePhone;
                });
            }
        }
    };

    await loadProductsFromDB();
    await loadSettingsFromDB();

    /* --- SPA VIEW SWITCHER --- */
    const pageViews = document.querySelectorAll('.page-view');
    const navLinks = document.querySelectorAll('.nav-link, [data-view]');

    const showView = (viewName) => {
        pageViews.forEach(view => {
            view.classList.remove('active');
            if (view.id === `view-${viewName}`) {
                view.classList.add('active');
            }
        });

        navLinks.forEach(link => {
            if (link.getAttribute('data-view') === viewName) {
                link.classList.add('active');
            } else if (link.getAttribute('data-view')) {
                link.classList.remove('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetView = link.getAttribute('data-view');
            if (targetView) {
                e.preventDefault();
                showView(targetView);
            }
        });
    });

    document.querySelectorAll('.nav-to-catalog').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showView('catalog');
        });
    });

    /* --- RENDER CATALOG PRODUCT GRID --- */
    const catalogProductGrid = document.getElementById('catalogProductGrid');
    
    const renderCatalog = (products) => {
        if (!catalogProductGrid) return;
        catalogProductGrid.innerHTML = '';

        if (products.length === 0) {
            catalogProductGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No flowers found matching your search.</div>';
            return;
        }

        products.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'catalog-card';
            card.innerHTML = `
                <img src="${prod.image}" alt="${prod.name}" class="catalog-card-img">
                <div class="catalog-card-body">
                    <h3>${prod.name}</h3>
                    <p>${prod.description}</p>
                    <span class="view-link open-quote-modal" data-product="${prod.name}">View Products &rarr;</span>
                </div>
            `;
            catalogProductGrid.appendChild(card);
        });
    };

    renderCatalog(currentProducts);

    /* --- RENDER DYNAMIC SIGNATURE PRODUCTS GRID --- */
    const renderSignatureProducts = (products) => {
        const signatureGrid = document.getElementById('signatureProductsGrid');
        if (!signatureGrid) return;
        signatureGrid.innerHTML = '';

        // Filter products marked as isSignature, or fallback to top products
        let sigList = products.filter(p => p.isSignature === true || p.isSignature === 'true');
        if (sigList.length === 0) {
            sigList = products.slice(0, 6);
        }

        sigList.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'sig-card';
            const tagLabel = prod.category === 'traditional' ? 'TRADITIONAL' : (prod.category === 'cutflowers' ? 'ROSES & CUT FLOWERS' : 'SPECIALITY');
            card.innerHTML = `
                <img src="${prod.image}" alt="${prod.name}">
                <div class="sig-card-body">
                    <span class="tag-label">${tagLabel}</span>
                    <h3>${prod.name}</h3>
                    <p>${prod.description}</p>
                    <div class="sig-actions">
                        <button class="btn btn-sm btn-text open-quote-modal" data-product="${prod.name}">View Details</button>
                        <button class="btn btn-sm btn-primary open-quote-modal" data-product="${prod.name}">Enquire</button>
                    </div>
                </div>
            `;
            signatureGrid.appendChild(card);
        });
    };

    renderSignatureProducts(currentProducts);

    /* --- SEARCH & FILTER LOGIC --- */
    const catalogSearchInput = document.getElementById('catalogSearchInput');
    const filterPills = document.querySelectorAll('.pill-btn');
    let currentCategory = 'all';

    const filterProducts = () => {
        const query = catalogSearchInput ? catalogSearchInput.value.toLowerCase().trim() : '';
        const filtered = currentProducts.filter(p => {
            const matchesCat = (currentCategory === 'all') || (p.category === currentCategory);
            const matchesQuery = p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
            return matchesCat && matchesQuery;
        });
        renderCatalog(filtered);
    };

    if (catalogSearchInput) {
        catalogSearchInput.addEventListener('input', filterProducts);
    }

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.getAttribute('data-cat');
            filterProducts();
        });
    });

    /* --- UNIVERSAL QUOTE & CONTACT MODAL LOGIC --- */
    const quoteModal = document.getElementById('quoteModal');
    const closeQuoteModal = document.getElementById('closeQuoteModal');
    const modalQuoteForm = document.getElementById('modalQuoteForm');
    const mTargetFlower = document.getElementById('mTargetFlower');

    const openQuoteModal = (productName = null) => {
        if (productName && mTargetFlower) {
            for (let i = 0; i < mTargetFlower.options.length; i++) {
                if (mTargetFlower.options[i].text.toLowerCase().includes(productName.toLowerCase())) {
                    mTargetFlower.selectedIndex = i;
                    break;
                }
            }
        }
        if (quoteModal) {
            quoteModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    const closeQuoteModalFunc = () => {
        if (quoteModal) {
            quoteModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Global Event Delegation for Contact/Quote triggers
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.open-quote-modal, [href="#contact"], [data-view="contact"]');
        if (trigger) {
            e.preventDefault();
            const prodName = trigger.getAttribute('data-product');
            openQuoteModal(prodName);
            
            if (trigger.classList.contains('nav-link')) {
                document.querySelectorAll('.nav-link').forEach(nl => nl.classList.remove('active'));
                trigger.classList.add('active');
            }
        }
    });

    if (closeQuoteModal && quoteModal) {
        closeQuoteModal.addEventListener('click', closeQuoteModalFunc);

        quoteModal.addEventListener('click', (e) => {
            if (e.target === quoteModal) {
                closeQuoteModalFunc();
            }
        });
    }

    /* --- FORM SUBMISSION --- */
    if (modalQuoteForm) {
        modalQuoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let isValid = true;

            const nameInput = document.getElementById('mClientName');
            const emailInput = document.getElementById('mClientEmail');
            const phoneInput = document.getElementById('mClientPhone');
            const flowerSelect = document.getElementById('mTargetFlower');
            const volumeInput = document.getElementById('mCargoVolume');
            const destInput = document.getElementById('mDestinationAirport');

            const checkField = (input, condition) => {
                const grp = input.closest('.form-group');
                if (!condition) {
                    if (grp) grp.classList.add('error');
                    isValid = false;
                } else {
                    if (grp) grp.classList.remove('error');
                }
            };

            checkField(nameInput, nameInput.value.trim() !== '');
            checkField(emailInput, emailInput.value.trim() !== '' && emailInput.value.includes('@'));
            checkField(phoneInput, phoneInput.value.trim() !== '');
            checkField(flowerSelect, flowerSelect.value !== '');
            checkField(volumeInput, volumeInput.value.trim() !== '');
            checkField(destInput, destInput.value.trim() !== '');

            if (isValid) {
                const newInquiry = {
                    id: Date.now().toString(),
                    date: new Date().toLocaleString(),
                    name: nameInput.value.trim(),
                    company: document.getElementById('mCompanyName').value.trim() || 'N/A',
                    email: emailInput.value.trim(),
                    phone: phoneInput.value.trim(),
                    flower: flowerSelect.options[flowerSelect.selectedIndex].text,
                    volume: volumeInput.value.trim(),
                    destination: destInput.value.trim(),
                    notes: document.getElementById('mAdditionalNotes').value.trim() || 'No additional notes.'
                };

                // Save to Supabase
                if (supabaseClient) {
                    try {
                        await supabaseClient.from('inquiries').insert([newInquiry]);
                    } catch (err) {
                        console.error("Supabase insert error:", err);
                    }
                }

                // Fallback to LocalStorage
                const currentInquiries = JSON.parse(localStorage.getItem('zentro_inquiries')) || [];
                currentInquiries.unshift(newInquiry);
                localStorage.setItem('zentro_inquiries', JSON.stringify(currentInquiries));

                // Format WhatsApp Message & Redirect to WhatsApp
                const whatsappNumber = "919597209593";
                const waMessage = `Hello Zentro World Connect! 🌸

I would like to request an Export Quote:
👤 Name: ${newInquiry.name}
🏢 Company: ${newInquiry.company}
📧 Email: ${newInquiry.email}
📞 Phone: ${newInquiry.phone}
🌺 Flower Variety: ${newInquiry.flower}
📦 Expected Volume: ${newInquiry.volume}
✈️ Destination Airport: ${newInquiry.destination}
📝 Notes: ${newInquiry.notes}`;

                const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;

                modalQuoteForm.reset();
                closeQuoteModalFunc();

                // Open WhatsApp immediately
                window.open(waUrl, '_blank');
            }
        });
    }

    /* --- MOBILE MENU TOGGLE --- */
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
});
