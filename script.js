/* ==========================================
   Zentro World Connect - Model Website Logic
   ========================================== */

const SUPABASE_URL = "https://fvzqxddabdgybvozrlvs.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_iGDj_0kt5smIENeT6EqvJQ_vGxDZ8FD";

let supabaseClient = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );
        console.log("Supabase Client initialized");
    }
}

document.addEventListener('DOMContentLoaded', async () => {

    /* --- DEFAULT CATALOG PRODUCTS DATA --- */
    const defaultCatalogProducts = [];

    let currentProducts = defaultCatalogProducts;

    /* --- HYBRID DATABASE FETCH (SUPABASE / LOCALSTORAGE) --- */
    const loadProductsFromDB = async () => {
    if (!supabaseClient) {
        console.error("Supabase client is not available.");
        currentProducts = [];
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('id, name, item_code, category, price_inr, price_usd, price_unit, grade, availability, isSignature, image, budLife, package, description')
            .order('id');

        if (error) {
            console.error("Supabase product loading failed:", error);
            currentProducts = [];
            return;
        }

        currentProducts = Array.isArray(data) ? data : [];

    } catch (e) {
        console.error("Unexpected Supabase product error:", e);
        currentProducts = [];
    }
};


    /* --- LOAD SETTINGS FROM SUPABASE / LOCALSTORAGE --- */
    const loadSettingsFromDB = async () => {

        let sets = null;

        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('settings')
                    .select('*')
                    .eq('id', 1)
                    .maybeSingle();

                if (!error && data) {
                    sets = data;
                }

            } catch (e) {
                console.error("Supabase settings error:", e);
            }
        }

        if (!sets) {
            const local = localStorage.getItem('zentro_settings');

            if (local) {
                try {
                    sets = JSON.parse(local);
                } catch (e) {
                    console.error("Local settings parsing error:", e);
                }
            }
        }

        if (sets) {

            /* --- Dynamic Brand Color --- */
            if (sets.primaryColor) {
                document.documentElement.style.setProperty(
                    '--primary',
                    sets.primaryColor
                );
            }

            /* --- Dynamic Office Email --- */
            if (sets.officeEmail) {
                document.querySelectorAll('a[href^="mailto:"]').forEach(el => {

                    el.href = `mailto:${sets.officeEmail}`;

                    if (el.textContent.includes('@')) {
                        el.textContent = sets.officeEmail;
                    }

                });
            }

            /* --- Dynamic Office Phone --- */
            if (sets.officePhone) {
                document.querySelectorAll('a[href^="tel:"]').forEach(el => {

                    el.href = `tel:${sets.officePhone.replace(/\s+/g, '')}`;

                    if (el.textContent.includes('+')) {
                        el.textContent = sets.officePhone;
                    }

                });
            }

            /* --- Hero Title --- */
            if (sets.heroTitle) {

                const heroTitle = document.getElementById('heroTitle');

                if (heroTitle) {
                    heroTitle.innerHTML = sets.heroTitle;
                }
            }

            /* --- Hero Description --- */
            if (sets.heroDescription) {

                const heroDescription =
                    document.getElementById('heroDescription');

                if (heroDescription) {
                    heroDescription.innerHTML = sets.heroDescription;
                }
            }

            /* --- About Title --- */
            if (sets.aboutTitle) {

                const aboutTitle =
                    document.getElementById('aboutTitle');

                if (aboutTitle) {
                    aboutTitle.innerHTML = sets.aboutTitle;
                }
            }

            /* --- About Description --- */
            if (sets.aboutDescription) {

                const aboutDescription =
                    document.getElementById('aboutDescription');

                if (aboutDescription) {
                    aboutDescription.innerHTML = sets.aboutDescription;
                }
            }
        }
    };


    /* =========================================================
       CATALOG PRODUCT GRID
       ========================================================= */

    const catalogProductGrid =
        document.getElementById('catalogProductGrid');

   /* --- LOAD PRODUCTS INTO QUOTE DROPDOWN --- */
const loadQuoteProducts = () => {

    const productSelect =
        document.getElementById('mTargetFlower');

    if (!productSelect) return;

    productSelect.innerHTML =
        '<option value="" disabled selected>Select a product</option>';

    currentProducts.forEach(prod => {

        const option = document.createElement('option');

        option.value = prod.name;
        option.textContent = prod.name;

        productSelect.appendChild(option);
    });

    const otherOption = document.createElement('option');

    otherOption.value = 'other';
    otherOption.textContent = 'Other / Custom Sourcing';

    productSelect.appendChild(otherOption);
};

    const renderCatalog = (products) => {

        if (!catalogProductGrid) return;

        catalogProductGrid.innerHTML = '';

        if (!products || products.length === 0) {

            catalogProductGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    No flowers found matching your search.
                </div>
            `;

            return;
        }

        products.forEach(prod => {

            const card = document.createElement('div');

            card.className = 'catalog-card';

            card.innerHTML = `
                <img 
                    src="${prod.image}" 
                    alt="${prod.name}" 
                    class="catalog-card-img"
                >

                <div class="catalog-card-body">

                    <h3>${prod.name}</h3>

                    <p class="item-code">
                        Item Code: ${prod.item_code || '-'}
                    </p>

                    <p>${prod.description || ''}</p>

                    <p class="product-price">
                        ₹${Number(prod.price_inr || 0).toFixed(2)} / ${prod.price_unit || ''}
                        &nbsp; | &nbsp;
                        $${Number(prod.price_usd || 0).toFixed(2)} / ${prod.price_unit || ''}
                    </p>

                    <span 
                        class="view-link open-quote-modal" 
                        data-product="${prod.name}"
                    >
                        Get a Quote &rarr;
                    </span>

                </div>
            `;

            catalogProductGrid.appendChild(card);
        });
    };


    /* =========================================================
       SIGNATURE PRODUCTS GRID
       ========================================================= */

    const renderSignatureProducts = (products) => {

        const signatureGrid =
            document.getElementById('signatureProductsGrid');

        if (!signatureGrid) return;

        signatureGrid.innerHTML = '';

        /* Filter products marked as signature */
        let sigList = products.filter(
            p =>
                p.isSignature === true ||
                p.isSignature === 'true'
        );

        /* Fallback to first 6 products */
        if (sigList.length === 0) {
            sigList = products.slice(0, 6);
        }

        sigList.forEach(prod => {

            const card = document.createElement('div');

            card.className = 'sig-card';

            const tagLabel =
                prod.category === 'garlands'
                    ? 'GARLANDS'
                    : (
                        prod.category === 'bouquets'
                            ? 'BOUQUETS'
                            : 'FLOWERS'
                    );

            card.innerHTML = `
                <img 
                    src="${prod.image}" 
                    alt="${prod.name}"
                >

                <div class="sig-card-body">

                    <span class="tag-label">
                        ${tagLabel}
                    </span>

                    <h3>${prod.name}</h3>

                    <p class="item-code">
                        Item Code: ${prod.item_code || '-'}
                    </p>

                    <p>${prod.description || ''}</p>

                    <div class="sig-actions">

                        <button 
                            class="btn btn-sm btn-primary open-quote-modal" 
                            data-product="${prod.name}"
                        >
                            Enquire
                        </button>

                    </div>

                </div>
            `;

            signatureGrid.appendChild(card);
        });
    };


    /* =========================================================
       SEARCH & FILTER LOGIC
       ========================================================= */

    const catalogSearchInput =
        document.getElementById('catalogSearchInput');

    const filterPills =
        document.querySelectorAll('.pill-btn');

    let currentCategory = 'all';


    const filterProducts = () => {

        const query =
            catalogSearchInput
                ? catalogSearchInput.value.toLowerCase().trim()
                : '';

        const filtered = currentProducts.filter(p => {

            const matchesCat =
                (currentCategory === 'all') ||
                (p.category === currentCategory);

            const productName =
                (p.name || '').toLowerCase();

            const productDescription =
                (p.description || '').toLowerCase();

            const matchesQuery =
                productName.includes(query) ||
                productDescription.includes(query);

            return matchesCat && matchesQuery;
        });

        renderCatalog(filtered);
    };


    if (catalogSearchInput) {

        catalogSearchInput.addEventListener(
            'input',
            filterProducts
        );
    }


    filterPills.forEach(pill => {

        pill.addEventListener('click', () => {

            filterPills.forEach(p => {
                p.classList.remove('active');
            });

            pill.classList.add('active');

            currentCategory =
                pill.getAttribute('data-cat');

            filterProducts();
        });
    });


    /* =========================================================
       CATEGORY FROM URL  (products.html?cat=flowers)
       ========================================================= */

    const urlCategory = new URLSearchParams(window.location.search).get('cat');

    if (urlCategory && filterPills.length) {

        currentCategory = urlCategory;

        filterPills.forEach(pill => {
            pill.classList.toggle(
                'active',
                pill.getAttribute('data-cat') === urlCategory
            );
        });
    }


    /* =========================================================
       START DATABASE LOADING IN BACKGROUND
       ========================================================= */

   loadProductsFromDB().then(() => {

    /* Re-apply the selected category after products load */
    filterProducts();

    /* Render signature products */
    renderSignatureProducts(currentProducts);

    /* Load products into Get a Quote dropdown */
    loadQuoteProducts();

});

    /* Load settings without blocking navigation */
    loadSettingsFromDB();


    /* =========================================================
       UNIVERSAL QUOTE & CONTACT MODAL LOGIC
       ========================================================= */

    const quoteModal =
        document.getElementById('quoteModal');

    const closeQuoteModal =
        document.getElementById('closeQuoteModal');

    const modalQuoteForm =
        document.getElementById('modalQuoteForm');

    const mTargetFlower =
        document.getElementById('mTargetFlower');


    const openQuoteModal = (productName = null) => {

        if (productName && mTargetFlower) {

            for (
                let i = 0;
                i < mTargetFlower.options.length;
                i++
            ) {

                if (
                    mTargetFlower.options[i].text
                        .toLowerCase()
                        .includes(productName.toLowerCase())
                ) {

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


    /* --- GLOBAL EVENT DELEGATION --- */
    document.addEventListener('click', (e) => {

        const trigger =
            e.target.closest('.open-quote-modal');

        if (trigger) {

            e.preventDefault();

            const prodName =
                trigger.getAttribute('data-product');

            openQuoteModal(prodName);

        }
    });


    /* --- CLOSE QUOTE MODAL --- */
    if (closeQuoteModal && quoteModal) {

        closeQuoteModal.addEventListener(
            'click',
            closeQuoteModalFunc
        );

        quoteModal.addEventListener('click', (e) => {

            if (e.target === quoteModal) {
                closeQuoteModalFunc();
            }
        });
    }


    /* =========================================================
       FORM SUBMISSION
       ========================================================= */

    if (modalQuoteForm) {

        modalQuoteForm.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();

                let isValid = true;

                const nameInput =
                    document.getElementById('mClientName');

                const emailInput =
                    document.getElementById('mClientEmail');

                const phoneInput =
                    document.getElementById('mClientPhone');

                const flowerSelect =
                    document.getElementById('mTargetFlower');

                const volumeInput =
                    document.getElementById('mCargoVolume');

                const destInput =
                    document.getElementById('mDestinationAirport');


                const checkField = (
                    input,
                    condition
                ) => {

                    const grp =
                        input.closest('.form-group');

                    if (!condition) {

                        if (grp) {
                            grp.classList.add('error');
                        }

                        isValid = false;

                    } else {

                        if (grp) {
                            grp.classList.remove('error');
                        }
                    }
                };


                checkField(
                    nameInput,
                    nameInput.value.trim() !== ''
                );

                checkField(
                    emailInput,
                    emailInput.value.trim() !== '' &&
                    emailInput.value.includes('@')
                );

                checkField(
                    phoneInput,
                    phoneInput.value.trim() !== ''
                );

                checkField(
                    flowerSelect,
                    flowerSelect.value !== ''
                );

                checkField(
                    volumeInput,
                    volumeInput.value.trim() !== ''
                );

                checkField(
                    destInput,
                    destInput.value.trim() !== ''
                );


                if (isValid) {

                    const newInquiry = {

                        id: Date.now().toString(),

                        date:
                            new Date().toLocaleString(),

                        name:
                            nameInput.value.trim(),

                        company:
                            document
                                .getElementById('mCompanyName')
                                .value.trim() ||
                            'N/A',

                        email:
                            emailInput.value.trim(),

                        phone:
                            phoneInput.value.trim(),

                        product_name:
                            flowerSelect
                                .options[
                                    flowerSelect.selectedIndex
                                ]
                                .text,

                        volume:
                            volumeInput.value.trim(),

                        destination:
                            destInput.value.trim(),

                        notes:
                            document
                                .getElementById('mAdditionalNotes')
                                .value.trim() ||
                            'No additional notes.'
                    };


                    /* --- SAVE TO SUPABASE --- */
                    if (supabaseClient) {

                        try {

                            await supabaseClient
                                .from('inquiries')
                                .insert([newInquiry]);

                        } catch (err) {

                            console.error(
                                "Supabase insert error:",
                                err
                            );
                        }
                    }


                    /* --- FALLBACK / LOCAL COPY --- */
                    const currentInquiries =
                        JSON.parse(
                            localStorage.getItem(
                                'zentro_inquiries'
                            )
                        ) || [];

                    currentInquiries.unshift(
                        newInquiry
                    );

                    localStorage.setItem(
                        'zentro_inquiries',
                        JSON.stringify(currentInquiries)
                    );


                    /* --- WHATSAPP MESSAGE --- */
                    const whatsappNumber =
                        "919597209593";

                    const waMessage =
`Hello Zentro World Connect! 🌸

I would like to request an Export Quote:
👤 Name: ${newInquiry.name}
🏢 Company: ${newInquiry.company}
📧 Email: ${newInquiry.email}
📞 Phone: ${newInquiry.phone}
🌺 Product Name: ${newInquiry.product_name}
📦 Expected Volume: ${newInquiry.volume}
✈️ Destination Airport: ${newInquiry.destination}
📝 Notes: ${newInquiry.notes}`;


                    const waUrl =
                        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;


                    modalQuoteForm.reset();

                    closeQuoteModalFunc();


                    /* --- OPEN WHATSAPP --- */
                    window.open(
                        waUrl,
                        '_blank'
                    );
                }
            }
        );
    }


    /* =========================================================
       MOBILE MENU TOGGLE
       ========================================================= */

    const navToggle =
        document.getElementById('navToggle');

    const navMenu =
        document.getElementById('navMenu');


    if (navToggle && navMenu) {

        navToggle.addEventListener('click', () => {

            navMenu.classList.toggle('active');

        });
    }


    /* =========================================================
       CONTACT LINK: highlight + smooth scroll on about.html#contact
       ========================================================= */

    const highlightContact = () => {

        const onContact = window.location.hash === '#contact';

        document.querySelectorAll('.nav-link').forEach(l => {

            const href = l.getAttribute('href') || '';

            if (href === 'about.html') {
                l.classList.toggle('active', !onContact);
            }

            if (href === 'about.html#contact') {
                l.classList.toggle('active', onContact);
            }
        });

        if (onContact) {
            setTimeout(() => {
                document.getElementById('contact')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    if (document.body.contains(document.getElementById('contact'))) {
        highlightContact();
        window.addEventListener('hashchange', highlightContact);
    }

});
