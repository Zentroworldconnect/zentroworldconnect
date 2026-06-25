/* ==========================================
   Zentro World Connect - Dynamic CMS Script
   ========================================== */

// --- HYBRID PERSISTENCE (SUPABASE CONFIGURATION) ---
// If you want to connect to Supabase Cloud Database:
// 1. Set SUPABASE_URL and SUPABASE_ANON_KEY variables below.
// 2. Create tables using the schema provided in the walkthrough.
// If either is empty, the site automatically falls back to browser LocalStorage.
const SUPABASE_URL = "https://fvzqxddabdgybvozrlvs.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2enF4ZGRhYmRneWJ2b3pybHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTU5MzMsImV4cCI6MjA5NzgzMTkzM30.6_2PebBxhvppoIXwMIWhfYJDfKDz4a73kWNecHsFlec";

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client initialized in Frontend Client");
    } else {
        console.error("Supabase CDN script not loaded correctly.");
    }
}

document.addEventListener('DOMContentLoaded', () => {

    /* --- DATA STRUCTURES & INITIALIZATION --- */
    
    const defaultProducts = [
        {
            id: "1",
            name: "Madurai Jasmine (Malli)",
            category: "traditional",
            grade: "AAA Premium",
            budLife: "48 - 72 Hours",
            availability: "Year-round (Peak: Mar-Aug)",
            package: "Thermocol Cold-Packs",
            description: "Stunning white, closed buds with strong natural fragrance. Hand-picked at dawn, packaged immediately to seal in the scent.",
            image: "assets/jasmine_buds.png"
        },
        {
            id: "2",
            name: "Export Grade Roses",
            category: "cutflowers",
            grade: "AAA Premium Stems (40-60cm)",
            budLife: "7 - 10 Days",
            availability: "Year-round",
            package: "Sleeved bunch carton",
            description: "Long-stemmed, vibrant red, pink, and yellow roses. Carefully cleaned, defoliated, and packed in corrugated export cartons.",
            image: "assets/roses_export.png"
        },
        {
            id: "3",
            name: "Vibrant Marigolds",
            category: "traditional",
            grade: "Standard & Premium",
            budLife: "3 - 5 Days",
            availability: "Year-round",
            package: "Aerated plastic crates",
            description: "Vibrant orange and golden-yellow blooms. Shipped loose or as custom garlands, perfect for cultural decorations and festivals.",
            image: "assets/marigolds.png"
        }
    ];

    const defaultSettings = {
        officeName: "Zentro World Connect",
        officeEmail: "info.zentroworldconnect@gmail.com",
        officePhone: "+91 95972 09593",
        officeAddress: "Sivagangai, Tamilnadu, India - 630561",
        leadName: "Nachiappan KR",
        leadEmail: "nachiappankr5@gmail.com",
        leadPhone: "+91 78451 00342",
        primaryColor: "#a81a29",
        secondaryColor: "#c52536",
        accentColor: "#cca353",
        logo: 'assets/logo.jpg',
        heroTitle: 'Cultivating Pure Elegance, <br><span class="italic-serif">Exporting to the World</span>',
        heroDescription: 'Zentro World Connect delivers the finest hand-harvested fresh flowers with an unbroken cold chain. From the fertile soil of Southern India directly to global markets within 24 hours.',
        heroImage: 'assets/hero_flowers.png',
        aboutTitle: "Connecting Southern India's Finest Blooms to Global Markets",
        aboutDescription: '<p class="about-lead">Zentro World Connect is a premier flower export firm based in Sivagangai, Tamilnadu. We specialize in sourcing, quality-assuring, and packing local traditional flora alongside exotic varieties to meet stringent international standards.</p><p>Southern Tamilnadu is famous for its rich soil, warm sunlight, and generational farming expertise. This is particularly true for aromatic buds like Jasmine. We operate a highly localized collection model combined with modern refrigerated logistics to make sure that our flowers look, smell, and feel freshly picked when they arrive at international terminals.</p>',
        aboutImage: 'assets/export_process.png'
    };

    // Initialize LocalStorage if empty (so fallback works immediately)
    if (!localStorage.getItem('zentro_products')) {
        localStorage.setItem('zentro_products', JSON.stringify(defaultProducts));
    }
    if (!localStorage.getItem('zentro_settings')) {
        localStorage.setItem('zentro_settings', JSON.stringify(defaultSettings));
    }
    if (!localStorage.getItem('zentro_inquiries')) {
        localStorage.setItem('zentro_inquiries', JSON.stringify([]));
    }

    /* --- APPLY BRAND COLORS --- */
    const applyColors = (sets) => {
        if (!sets || !sets.primaryColor) return;
        const root = document.documentElement;
        root.style.setProperty('--primary', sets.primaryColor);
        root.style.setProperty('--primary-light', sets.secondaryColor);
        root.style.setProperty('--primary-dark', darkenColor(sets.primaryColor, 30));
        root.style.setProperty('--secondary', sets.primaryColor);
        root.style.setProperty('--secondary-hover', darkenColor(sets.primaryColor, 20));
        root.style.setProperty('--accent', sets.accentColor);
        
        const shadowRGB = hexToRgb(sets.primaryColor);
        if (shadowRGB) {
            root.style.setProperty('--shadow-md', `0 10px 15px -3px rgba(${shadowRGB.r}, ${shadowRGB.g}, ${shadowRGB.b}, 0.06), 0 4px 6px -2px rgba(${shadowRGB.r}, ${shadowRGB.g}, ${shadowRGB.b}, 0.02)`);
            root.style.setProperty('--shadow-lg', `0 20px 25px -5px rgba(${shadowRGB.r}, ${shadowRGB.g}, ${shadowRGB.b}, 0.1), 0 10px 10px -5px rgba(${shadowRGB.r}, ${shadowRGB.g}, ${shadowRGB.b}, 0.03)`);
        }
    };

    function darkenColor(hex, percent) {
        let num = parseInt(hex.replace("#",""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) - amt,
            G = (num >> 8 & 0x00FF) - amt,
            B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x100 + (B<0?0:B>255?255:B)).toString(16).slice(1);
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /* --- RENDER CONTACT INFO --- */
    const renderContactInfo = (sets) => {
        if (!sets) return;

        // Logo rendering
        const headerLogo = document.getElementById('headerLogo');
        const footerLogo = document.getElementById('footerLogo');
        if (headerLogo && sets.logo) headerLogo.src = sets.logo;
        if (footerLogo && sets.logo) footerLogo.src = sets.logo;
        
        // Top bar
        const topEmail = document.getElementById('topEmail');
        const topPhone = document.getElementById('topPhone');
        if (topEmail) { topEmail.href = `mailto:${sets.officeEmail}`; topEmail.innerText = sets.officeEmail; }
        if (topPhone) { topPhone.href = `tel:${cleanPhone(sets.officePhone)}`; topPhone.innerText = sets.officePhone; }

        // Hero quick card
        const heroLeadName = document.getElementById('heroLeadName');
        const heroLeadPhone = document.getElementById('heroLeadPhone');
        const heroLeadEmail = document.getElementById('heroLeadEmail');
        if (heroLeadName) heroLeadName.innerText = sets.leadName;
        if (heroLeadPhone) { heroLeadPhone.href = `tel:${cleanPhone(sets.leadPhone)}`; heroLeadPhone.innerText = sets.leadPhone; }
        if (heroLeadEmail) { heroLeadEmail.href = `mailto:${sets.leadEmail}`; heroLeadEmail.innerText = sets.leadEmail; }

        // About section signature
        const aboutLeadName = document.getElementById('aboutLeadName');
        if (aboutLeadName) aboutLeadName.innerText = sets.leadName;

        // Contact Section
        const contactOfficeName = document.getElementById('contactOfficeName');
        const contactOfficeAddress = document.getElementById('contactOfficeAddress');
        const contactOfficeEmail = document.getElementById('contactOfficeEmail');
        const contactOfficePhone = document.getElementById('contactOfficePhone');
        const contactLeadName = document.getElementById('contactLeadName');
        const contactLeadEmail = document.getElementById('contactLeadEmail');
        const contactLeadPhone = document.getElementById('contactLeadPhone');

        if (contactOfficeName) contactOfficeName.innerHTML = `<i class="fa-solid fa-building"></i> ${sets.officeName}`;
        if (contactOfficeAddress) contactOfficeAddress.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${sets.officeAddress}`;
        if (contactOfficeEmail) { contactOfficeEmail.href = `mailto:${sets.officeEmail}`; contactOfficeEmail.innerHTML = `<i class="fa-solid fa-envelope"></i> ${sets.officeEmail}`; }
        if (contactOfficePhone) { contactOfficePhone.href = `tel:${cleanPhone(sets.officePhone)}`; contactOfficePhone.innerHTML = `<i class="fa-solid fa-phone"></i> ${sets.officePhone} (Office)`; }
        if (contactLeadName) contactLeadName.innerHTML = `<i class="fa-solid fa-user-check"></i> ${sets.leadName}`;
        if (contactLeadEmail) { contactLeadEmail.href = `mailto:${sets.leadEmail}`; contactLeadEmail.innerHTML = `<i class="fa-solid fa-envelope"></i> ${sets.leadEmail}`; }
        if (contactLeadPhone) { contactLeadPhone.href = `tel:${cleanPhone(sets.leadPhone)}`; contactLeadPhone.innerHTML = `<i class="fa-solid fa-phone-flip"></i> ${sets.leadPhone} (Mobile)`; }

        // Footer Contact
        const footerOfficeAddress = document.getElementById('footerOfficeAddress');
        const footerOfficeEmail = document.getElementById('footerOfficeEmail');
        const footerOfficePhone = document.getElementById('footerOfficePhone');
        const footerLeadName = document.getElementById('footerLeadName');
        const footerLeadPhone = document.getElementById('footerLeadPhone');
        const footerLeadEmail = document.getElementById('footerLeadEmail');

        if (footerOfficeAddress) footerOfficeAddress.innerText = sets.officeAddress;
        if (footerOfficeEmail) { footerOfficeEmail.href = `mailto:${sets.officeEmail}`; footerOfficeEmail.innerText = sets.officeEmail; }
        if (footerOfficePhone) { footerOfficePhone.href = `tel:${cleanPhone(sets.officePhone)}`; footerOfficePhone.innerText = sets.officePhone; }
        if (footerLeadName) footerLeadName.innerHTML = `${sets.leadName}:`;
        if (footerLeadPhone) { footerLeadPhone.href = `tel:${cleanPhone(sets.leadPhone)}`; footerLeadPhone.innerText = sets.leadPhone; }
        if (footerLeadEmail) { footerLeadEmail.href = `mailto:${sets.leadEmail}`; footerLeadEmail.innerText = sets.leadEmail; }

        // Floating WhatsApp Button
        const whatsappFloatLink = document.getElementById('whatsappFloatLink');
        if (whatsappFloatLink) {
            const cleanNum = cleanPhone(sets.leadPhone).replace('+', '');
            whatsappFloatLink.href = `https://wa.me/${cleanNum}?text=Hello%20${encodeURIComponent(sets.leadName)},%20I%20am%20interested%20in%20importing%20flowers%20from%20${encodeURIComponent(sets.officeName)}.`;
        }

        // Render Hero Banner Customization
        const heroTitleEl = document.getElementById('heroTitle');
        const heroDescEl = document.getElementById('heroDescription');
        const heroSection = document.getElementById('home');
        
        if (heroTitleEl && sets.heroTitle) heroTitleEl.innerHTML = sets.heroTitle;
        if (heroDescEl && sets.heroDescription) heroDescEl.innerText = sets.heroDescription;
        if (heroSection && sets.heroImage) {
            const primaryRGB = hexToRgb(sets.primaryColor) || { r: 168, g: 26, b: 41 };
            heroSection.style.backgroundImage = `linear-gradient(rgba(${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}, 0.5), rgba(${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}, 0.8)), url('${sets.heroImage}')`;
        }

        // Render About Us Customization
        const aboutTitleEl = document.getElementById('aboutTitle');
        const aboutDescEl = document.getElementById('aboutDescription');
        const aboutImgEl = document.getElementById('aboutMainImg');
        
        if (aboutTitleEl && sets.aboutTitle) aboutTitleEl.innerText = sets.aboutTitle;
        if (aboutDescEl && sets.aboutDescription) aboutDescEl.innerHTML = sets.aboutDescription;
        if (aboutImgEl && sets.aboutImage) aboutImgEl.src = sets.aboutImage;
    };

    /* --- RENDER PRODUCTS GRID --- */
    const renderProducts = (prodList) => {
        const productsGrid = document.getElementById('productsGrid');
        const selectElement = document.getElementById('targetFlower');
        
        if (!productsGrid) return;
        
        productsGrid.innerHTML = '';
        
        if (selectElement) {
            selectElement.innerHTML = '<option value="" disabled selected>Select a variety</option>';
        }

        prodList.forEach(prod => {
            const badgeHTML = prod.category === 'traditional' ? '<span class="product-badge">Top Export</span>' : '';
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-category', prod.category);
            card.innerHTML = `
                <div class="product-img-wrapper">
                    <img src="${prod.image || 'assets/hero_flowers.png'}" alt="${prod.name}" class="product-img">
                    ${badgeHTML}
                </div>
                <div class="product-info">
                    <span class="product-cat">${prod.category === 'traditional' ? 'Traditional Scented' : 'Premium Cut Flowers'}</span>
                    <h3>${prod.name}</h3>
                    <p>${prod.description}</p>
                    <ul class="product-specs">
                        <li><strong>Export Grade:</strong> ${prod.grade}</li>
                        <li><strong>Vase / Bud Life:</strong> ${prod.budLife}</li>
                        <li><strong>Availability:</strong> ${prod.availability}</li>
                    </ul>
                    <div class="product-footer">
                        <span class="package-info"><i class="fa-solid fa-box"></i> ${prod.package}</span>
                        <a href="#contact" class="btn btn-text quote-product-btn" data-product-id="${prod.id}">Quote <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                </div>
            `;
            productsGrid.appendChild(card);

            // Populate options in contact form dropdown
            if (selectElement) {
                const opt = document.createElement('option');
                opt.value = prod.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                opt.innerText = prod.name;
                selectElement.appendChild(opt);
            }
        });
        
        if (selectElement) {
            const optOther = document.createElement('option');
            optOther.value = 'other';
            optOther.innerText = 'Other / Custom Sourcing';
            selectElement.appendChild(optOther);
        }

        // Quote card clicks pre-select dropdown options
        document.querySelectorAll('.quote-product-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pId = btn.getAttribute('data-product-id');
                const matched = prodList.find(p => p.id === pId);
                if (matched && selectElement) {
                    const optionVal = matched.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    selectElement.value = optionVal;
                }
            });
        });
    };

    // Main hybrid database loader
    const init = async () => {
        let settings = defaultSettings;
        let products = defaultProducts;

        if (supabaseClient) {
            try {
                // Fetch Settings
                const { data: dbSettings, error: errSettings } = await supabaseClient.from('settings').select('*').eq('id', 1).maybeSingle();
                if (!errSettings && dbSettings) {
                    settings = dbSettings;
                    localStorage.setItem('zentro_settings', JSON.stringify(dbSettings));
                } else {
                    settings = JSON.parse(localStorage.getItem('zentro_settings')) || defaultSettings;
                }

                // Fetch Products
                const { data: dbProducts, error: errProducts } = await supabaseClient.from('products').select('*').order('id');
                if (!errProducts && dbProducts) {
                    products = dbProducts;
                    localStorage.setItem('zentro_products', JSON.stringify(dbProducts));
                } else {
                    products = JSON.parse(localStorage.getItem('zentro_products')) || defaultProducts;
                }
            } catch (e) {
                console.error("Supabase dynamic retrieval error, falling back to LocalStorage:", e);
                settings = JSON.parse(localStorage.getItem('zentro_settings')) || defaultSettings;
                products = JSON.parse(localStorage.getItem('zentro_products')) || defaultProducts;
            }
        } else {
            // Standard LocalStorage Mode
            settings = JSON.parse(localStorage.getItem('zentro_settings')) || defaultSettings;
            products = JSON.parse(localStorage.getItem('zentro_products')) || defaultProducts;
        }

        applyColors(settings);
        renderContactInfo(settings);
        renderProducts(products);
    };

    init(); // Run initializer

    /* --- MOBILE MENU TOGGLE --- */
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    /* --- HEADER SCROLL EFFECT --- */
    const header = document.querySelector('.header');
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    /* --- DYNAMIC SECTION HIGHLIGHTING IN NAV --- */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const highlightNav = () => {
        const scrollY = window.pageYOffset;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120;
            const sectionId = current.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', highlightNav);

    /* --- PRODUCT FILTERING SYSTEM --- */
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            const productCards = document.querySelectorAll('.product-card');

            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');

                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(15px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    /* --- CONTACT FORM VALIDATION & SUBMISSION --- */
    const quoteForm = document.getElementById('quoteForm');
    const formSuccess = document.getElementById('formSuccess');
    const closeSuccess = document.getElementById('closeSuccess');

    const isValidEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email.toLowerCase());
    };

    const setFieldError = (element, hasError) => {
        const parent = element.closest('.form-group');
        if (parent) {
            if (hasError) {
                parent.classList.add('error');
            } else {
                parent.classList.remove('error');
            }
        }
    };

    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isFormValid = true;

            // 1. Validate Name
            const nameInput = document.getElementById('clientName');
            if (nameInput.value.trim() === '') {
                setFieldError(nameInput, true);
                isFormValid = false;
            } else {
                setFieldError(nameInput, false);
            }

            // 2. Validate Email
            const emailInput = document.getElementById('clientEmail');
            if (!isValidEmail(emailInput.value.trim())) {
                setFieldError(emailInput, true);
                isFormValid = false;
            } else {
                setFieldError(emailInput, false);
            }

            // 3. Validate Phone
            const phoneInput = document.getElementById('clientPhone');
            if (phoneInput.value.trim() === '') {
                setFieldError(phoneInput, true);
                isFormValid = false;
            } else {
                setFieldError(phoneInput, false);
            }

            // 4. Validate Flower Selection
            const flowerSelect = document.getElementById('targetFlower');
            if (flowerSelect.value === '') {
                setFieldError(flowerSelect, true);
                isFormValid = false;
            } else {
                setFieldError(flowerSelect, false);
            }

            // 5. Validate Volume
            const volumeInput = document.getElementById('cargoVolume');
            if (volumeInput.value.trim() === '') {
                setFieldError(volumeInput, true);
                isFormValid = false;
            } else {
                setFieldError(volumeInput, false);
            }

            // 6. Validate Destination
            const destInput = document.getElementById('destinationAirport');
            if (destInput.value.trim() === '') {
                setFieldError(destInput, true);
                isFormValid = false;
            } else {
                setFieldError(destInput, false);
            }

            // Submitting the Form
            if (isFormValid) {
                let flowerDisplayName = "Custom Sourcing";
                if (flowerSelect.value !== 'other') {
                    const selectedOption = flowerSelect.options[flowerSelect.selectedIndex];
                    flowerDisplayName = selectedOption ? selectedOption.text : flowerSelect.value;
                }

                // Compile Form Data
                const newInquiry = {
                    id: Date.now().toString(),
                    date: new Date().toLocaleString(),
                    name: nameInput.value.trim(),
                    company: document.getElementById('companyName').value.trim() || 'N/A',
                    email: emailInput.value.trim(),
                    phone: phoneInput.value.trim(),
                    flower: flowerDisplayName,
                    volume: volumeInput.value.trim(),
                    destination: destInput.value.trim(),
                    notes: document.getElementById('additionalNotes').value.trim() || 'No custom packaging noted.'
                };

                const saveSubmission = async () => {
                    if (supabaseClient) {
                        try {
                            const { error } = await supabaseClient.from('inquiries').insert([newInquiry]);
                            if (!error) {
                                console.log('Saved Quote Request to Supabase:', newInquiry);
                                return;
                            }
                            console.error("Supabase inquiry insert error:", error);
                        } catch (e) {
                            console.error("Supabase insert exception, writing to local storage:", e);
                        }
                    }

                    // Fallback to LocalStorage
                    const currentInquiries = JSON.parse(localStorage.getItem('zentro_inquiries')) || [];
                    currentInquiries.unshift(newInquiry);
                    localStorage.setItem('zentro_inquiries', JSON.stringify(currentInquiries));
                    console.log('Saved Quote Request to LocalStorage (fallback):', newInquiry);
                };

                saveSubmission().then(() => {
                    formSuccess.classList.add('active');
                    quoteForm.reset();
                    document.querySelectorAll('.form-group').forEach(group => group.classList.remove('error'));
                });
            }
        });
    }

    if (closeSuccess && formSuccess) {
        closeSuccess.addEventListener('click', () => {
            formSuccess.classList.remove('active');
        });
    }

    // Helper functions
    function cleanPhone(phone) {
        if (!phone) return "";
        return String(phone).replace(/[^+\d]/g, '');
    }

});
