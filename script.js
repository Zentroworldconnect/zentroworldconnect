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

    /* --- CATEGORY MASTER LIST (from catalog-data.js) --- */
    const catalog = window.ZENTRO_CATALOG || [];

    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));

    /* Old products saved with the earlier flower-only categories keep working */
    const LEGACY_CATEGORIES = {
        flowers:   { category: 'fresh-flowers-garlands', subcategory: 'fresh-cut-flowers' },
        garlands:  { category: 'fresh-flowers-garlands', subcategory: 'flower-garlands' },
        bouquets:  { category: 'fresh-flowers-garlands', subcategory: '' }
    };

    const normalizeProduct = (p) => {
        const legacy = LEGACY_CATEGORIES[p.category];
        return legacy
            ? { ...p, category: legacy.category, subcategory: p.subcategory || legacy.subcategory }
            : p;
    };

    const findCategory = (slug) => catalog.find(c => c.slug === slug);

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
            .select('id, name, item_code, category, subcategory, price_inr, price_usd, price_unit, grade, availability, isSignature, image, budLife, package, description')
            .order('id');

        if (error) {
            console.error("Supabase product loading failed:", error);
            currentProducts = [];
            return;
        }

        currentProducts = Array.isArray(data) ? data.map(normalizeProduct) : [];

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

            if (window.applyCategoryImages) window.applyCategoryImages(sets);

            /* --- Hero slideshow --- */
            if (window.applyHeroSettings && document.getElementById('heroSlides')) {
                window.applyHeroSettings(sets);
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

    /* --- QUOTE DROPDOWN: MAIN CATEGORIES ONLY --- */
    const loadQuoteProducts = () => {

        const productSelect = document.getElementById('mTargetFlower');

        if (!productSelect) return;

        productSelect.innerHTML =
            '<option value="" disabled selected>Select a product category</option>';

        catalog.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.slug;
            option.textContent = cat.name;
            productSelect.appendChild(option);
        });

        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other / Custom Sourcing';
        productSelect.appendChild(otherOption);
    };

    /* Fill the dropdown straight away so the quote form works on every page */
    loadQuoteProducts();

    let currentCategory = 'all';
    let currentSub = 'all';
    let currentSort = 'popular';

    const catalogSearchInput = document.getElementById('catalogSearchInput');
    const catalogSortSelect = document.getElementById('catalogSortSelect');
    const categoryFilterEl = document.getElementById('categoryFilter');
    const subcategoryFilterEl = document.getElementById('subcategoryFilter');

    const productCardHTML = (prod) => `
        <div class="catalog-card">
            <img src="${esc(prod.image)}" alt="${esc(prod.name)}" class="catalog-card-img">
            <div class="catalog-card-body">
                <h3>${esc(prod.name)}</h3>
                <p class="item-code">Item Code: ${esc(prod.item_code || '-')}</p>
                <p>${esc(prod.description || '')}</p>
                <p class="product-price">
                    ₹${Number(prod.price_inr || 0).toFixed(2)} / ${esc(prod.price_unit || '')}
                    &nbsp; | &nbsp;
                    $${Number(prod.price_usd || 0).toFixed(2)} / ${esc(prod.price_unit || '')}
                </p>
                <span class="view-link open-quote-modal"
                      data-product="${esc(prod.name)}"
                      data-category="${esc(prod.category || '')}">
                    Get a Quote &rarr;
                </span>
            </div>
        </div>`;

    /* Which subcategory does a product belong to? */
    const resolveSub = (prod, cat) => {
        if (cat.subcategories.some(s => s.slug === prod.subcategory)) return prod.subcategory;
        if (cat.subcategories.length === 1) return cat.subcategories[0].slug;
        return '__other';
    };

    const renderCatalog = (products) => {

        if (!catalogProductGrid) return;

        const query = catalogSearchInput ? catalogSearchInput.value.trim() : '';
        const searching = query !== '';
        let html = '';

        const knownSlugs = new Set(catalog.map(c => c.slug));

        catalog.forEach(cat => {

            if (currentCategory !== 'all' && currentCategory !== cat.slug) return;

            const inCat = products.filter(p => p.category === cat.slug);
            const totalVarieties = cat.subcategories.reduce((n, s) => n + s.products.length, 0);
            let catHtml = '';
            let subShown = 0;

            cat.subcategories.forEach(sub => {

                if (currentSub !== 'all' && currentSub !== sub.slug) return;

                const list = inCat.filter(p => resolveSub(p, cat) === sub.slug);

                /* while searching, hide sections with no match */
                if (searching && list.length === 0) return;

                subShown++;

                const chips = sub.products.map(name => `
                    <button type="button" class="range-chip open-quote-modal"
                            data-product="${esc(name)}" data-category="${esc(cat.slug)}">
                        ${esc(name)}
                    </button>`).join('');

                catHtml += `
                    <div class="catalog-sub" id="sub-${esc(sub.slug)}">
                        <div class="sub-head">
                            <h4>${esc(sub.name)}</h4>
                            <span class="sub-count">${sub.products.length} Products</span>
                        </div>
                        ${sub.note ? `<p class="sub-note">${esc(sub.note)}</p>` : ''}
                        ${list.length
                            ? `<div class="catalog-grid">${list.map(productCardHTML).join('')}</div>`
                            : `<p class="empty-note">Detailed listings for this range are being updated. Browse the varieties below and request a quote.</p>`}
                        ${searching ? '' : `
                        <details class="range-details">
                            <summary>View all ${sub.products.length} varieties</summary>
                            <div class="range-chips">${chips}</div>
                        </details>`}
                    </div>`;
            });

            /* products of this category whose subcategory is missing/unknown */
            if (currentSub === 'all') {
                const stray = inCat.filter(p => resolveSub(p, cat) === '__other');
                if (stray.length) {
                    subShown++;
                    catHtml += `
                        <div class="catalog-sub">
                            <div class="sub-head"><h4>Other ${esc(cat.name)}</h4></div>
                            <div class="catalog-grid">${stray.map(productCardHTML).join('')}</div>
                        </div>`;
                }
            }

            if (subShown === 0) return;

            html += `
                <section class="catalog-group" id="cat-${esc(cat.slug)}">
                    <div class="group-head">
                        <h3>${esc(cat.name)}</h3>
                        <p>${cat.subcategories.length} Subcategor${cat.subcategories.length === 1 ? 'y' : 'ies'} &bull; ${totalVarieties} Products</p>
                    </div>
                    ${catHtml}
                </section>`;
        });

        /* products whose category is not in the master list */
        if (currentCategory === 'all') {
            const unknown = products.filter(p => !knownSlugs.has(p.category));
            if (unknown.length) {
                html += `
                    <section class="catalog-group">
                        <div class="group-head"><h3>Other Products</h3></div>
                        <div class="catalog-sub"><div class="catalog-grid">${unknown.map(productCardHTML).join('')}</div></div>
                    </section>`;
            }
        }

        if (!html) {
            html = `
                <div class="empty-note" style="text-align:center; padding: 40px;">
                    No products found matching your search.
                </div>`;
        }

        catalogProductGrid.innerHTML = html;
    };


    /* =========================================================
       SIGNATURE PRODUCTS GRID
       ========================================================= */

    const renderSignatureProducts = (products) => {

        const signatureGrid = document.getElementById('signatureProductsGrid');

        if (!signatureGrid) return;

        /* Home page: moving carousel handled by home.js */
        if (window.homeSignature) {
            window.homeSignature(products.filter(p => p.isSignature === true || p.isSignature === 'true'));
            return;
        }

        signatureGrid.innerHTML = '';

        let sigList = products.filter(
            p => p.isSignature === true || p.isSignature === 'true'
        );

        if (sigList.length === 0) {
            sigList = products.slice(0, 6);
        }

        sigList.forEach(prod => {

            const card = document.createElement('div');
            card.className = 'sig-card';

            const tagLabel = (findCategory(prod.category)?.name || 'PRODUCTS').toUpperCase();

            card.innerHTML = `
                <img src="${esc(prod.image)}" alt="${esc(prod.name)}">
                <div class="sig-card-body">
                    <span class="tag-label">${esc(tagLabel)}</span>
                    <h3>${esc(prod.name)}</h3>
                    <p class="item-code">Item Code: ${esc(prod.item_code || '-')}</p>
                    <p>${esc(prod.description || '')}</p>
                    <div class="sig-actions">
                        <button class="btn btn-sm btn-primary open-quote-modal"
                                data-product="${esc(prod.name)}"
                                data-category="${esc(prod.category || '')}">
                            Enquire
                        </button>
                    </div>
                </div>`;

            signatureGrid.appendChild(card);
        });
    };


    /* =========================================================
       SEARCH, CATEGORY FILTERS & SORT
       ========================================================= */

    const filterProducts = () => {

        const query = catalogSearchInput
            ? catalogSearchInput.value.toLowerCase().trim()
            : '';

        let filtered = currentProducts.filter(p => {

            const cat = findCategory(p.category);
            const sub = cat?.subcategories.find(s => s.slug === p.subcategory);

            const haystack = [
                p.name, p.description, p.item_code,
                cat?.name, sub?.name
            ].join(' ').toLowerCase();

            return haystack.includes(query);
        });

        if (currentSort === 'name') {
            filtered = [...filtered].sort((a, b) =>
                (a.name || '').localeCompare(b.name || ''));
        }

        renderCatalog(filtered);
    };

    const renderSubcategoryPills = () => {

        if (!subcategoryFilterEl) return;

        const cat = findCategory(currentCategory);

        if (!cat || cat.subcategories.length < 2) {
            subcategoryFilterEl.innerHTML = '';
            return;
        }

        const pills = [{ slug: 'all', name: 'All ' + cat.name }, ...cat.subcategories];

        subcategoryFilterEl.innerHTML = pills.map(s => `
            <button type="button"
                    class="pill-btn pill-sm ${s.slug === currentSub ? 'active' : ''}"
                    data-sub="${esc(s.slug)}">${esc(s.name)}</button>`).join('');
    };

    const renderCategoryPills = () => {

        if (!categoryFilterEl) return;

        const pills = [{ slug: 'all', name: 'All Products' }, ...catalog];

        categoryFilterEl.innerHTML = pills.map(c => `
            <button type="button"
                    class="pill-btn ${c.slug === currentCategory ? 'active' : ''}"
                    data-cat="${esc(c.slug)}">${esc(c.name)}</button>`).join('');
    };

    if (categoryFilterEl) {

        categoryFilterEl.addEventListener('click', (e) => {

            const btn = e.target.closest('[data-cat]');
            if (!btn) return;

            currentCategory = btn.getAttribute('data-cat');
            currentSub = 'all';

            renderCategoryPills();
            renderSubcategoryPills();
            filterProducts();
        });
    }

    if (subcategoryFilterEl) {

        subcategoryFilterEl.addEventListener('click', (e) => {

            const btn = e.target.closest('[data-sub]');
            if (!btn) return;

            currentSub = btn.getAttribute('data-sub');

            renderSubcategoryPills();
            filterProducts();
        });
    }

    if (catalogSearchInput) {
        catalogSearchInput.addEventListener('input', filterProducts);
    }

    if (catalogSortSelect) {
        catalogSortSelect.addEventListener('change', () => {
            currentSort = catalogSortSelect.value;
            filterProducts();
        });
    }


    /* =========================================================
       CATEGORY FROM URL  (products.html?cat=rice&sub=basmati)
       ========================================================= */

    const urlParams = new URLSearchParams(window.location.search);
    const urlCat = urlParams.get('cat');
    const urlSub = urlParams.get('sub');

    if (urlCat) {
        const legacy = LEGACY_CATEGORIES[urlCat];
        currentCategory = legacy ? legacy.category : urlCat;
        currentSub = urlSub || (legacy ? legacy.subcategory : '') || 'all';

        if (!findCategory(currentCategory)) {
            currentCategory = 'all';
            currentSub = 'all';
        }
    }

    renderCategoryPills();
    renderSubcategoryPills();

    /* Show the full category structure immediately (before products arrive) */
    if (catalogProductGrid) {
        filterProducts();
    }


    /* =========================================================
       START DATABASE LOADING IN BACKGROUND
       ========================================================= */

    /* Settings first: they carry the slideshow */
    loadSettingsFromDB();

   loadProductsFromDB().then(() => {

    /* Re-apply the selected category after products load */
    filterProducts();

    /* Render signature products */
    renderSignatureProducts(currentProducts);

});



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


    let selectedProductName = '';

    const openQuoteModal = (productName = null, categorySlug = null) => {

        selectedProductName = productName || '';

        if (!categorySlug && productName) {
            categorySlug = currentProducts.find(p => p.name === productName)?.category;
        }

        if (categorySlug && mTargetFlower) {

            const wanted = LEGACY_CATEGORIES[categorySlug]?.category || categorySlug;

            for (let i = 0; i < mTargetFlower.options.length; i++) {
                if (mTargetFlower.options[i].value === wanted) {
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

    /* If the visitor picks a category by hand, forget the product they clicked earlier */
    if (mTargetFlower) {
        mTargetFlower.addEventListener('change', () => {
            selectedProductName = '';
        });
    }


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

            openQuoteModal(
                trigger.getAttribute('data-product'),
                trigger.getAttribute('data-category')
            );

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
                            selectedProductName
                                ? `${flowerSelect.options[flowerSelect.selectedIndex].text} – ${selectedProductName}`
                                : flowerSelect.options[flowerSelect.selectedIndex].text,

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
🌺 Product: ${newInquiry.product_name}
📦 Expected Volume: ${newInquiry.volume}
✈️ Destination Airport: ${newInquiry.destination}
📝 Notes: ${newInquiry.notes}`;


                    const waUrl =
                        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;


                    modalQuoteForm.reset();

                    selectedProductName = '';

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
