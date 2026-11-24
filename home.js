/* Home page: hero slideshow + category cards + featured section */
(function () {
    var DEFAULT_SLIDES = ['assets/slide-1.jpg', 'assets/slide-2.jpg', 'assets/slide-3.jpg', 'assets/slide-4.jpg'];
    var heroShown = false;
    var timer = null, idx = 0, count = 0;

    function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
    function cssUrl(u) { return "url('" + String(u).replace(/'/g, '%27').replace(/ /g, '%20') + "')"; }

    function show(i) {
        var slides = document.querySelectorAll('#heroSlides .hz-slide');
        var dots = document.querySelectorAll('#heroDots button');
        if (!slides.length) return;
        idx = (i + slides.length) % slides.length;
        slides.forEach(function (s, n) { s.classList.toggle('active', n === idx); });
        dots.forEach(function (d, n) { d.classList.toggle('active', n === idx); });
    }
    function play() {
        clearInterval(timer);
        if (count > 1) timer = setInterval(function () { show(idx + 1); }, 3500);
    }

    /* slides: array of image URLs / data URIs */
    var CACHE_KEY = 'zentro_home_cache_v1', slidesKey = '';
    function readCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch (e) { return {}; } }
    function writeCache(patch) {
        try { var c = readCache(); for (var k in patch) c[k] = patch[k]; localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) { /* quota or private mode: ignore */ }
    }

    window.renderHeroSlides = function (slides) {
        var wrap = document.getElementById('heroSlides');
        var dots = document.getElementById('heroDots');
        if (!wrap) return;
        slides = (slides && slides.length) ? slides : DEFAULT_SLIDES;
        var key = JSON.stringify(slides);
        if (heroShown && key === slidesKey) return; /* same slides already showing: no flicker */
        slidesKey = key;
        heroShown = true;
        count = slides.length;
        /* only the first image is requested immediately; the rest load once it is ready */
        wrap.innerHTML = slides.map(function () { return '<div class="hz-slide"></div>'; }).join('');
        var els = wrap.children;
        function setBg(i) { if (els[i]) els[i].style.backgroundImage = cssUrl(slides[i]); }
        var started = false;
        function start() {
            if (started || key !== slidesKey) return;
            started = true;
            show(0); play();
            for (var i = 1; i < slides.length; i++) setBg(i);
        }
        setBg(0);
        var probe = new Image();
        probe.onload = probe.onerror = start;
        probe.src = slides[0];
        setTimeout(start, 3000);
        dots.innerHTML = slides.map(function (_, n) { return '<button type="button" aria-label="Go to slide ' + (n + 1) + '"></button>'; }).join('');
        dots.style.display = count > 1 ? '' : 'none';
        document.getElementById('heroPrev').style.display = document.getElementById('heroNext').style.display = count > 1 ? '' : 'none';
    };

    /* Read slides from settings (array, JSON string, or single heroImage) */
    window.applyHeroSettings = function (sets) {
        var list = sets && sets.heroSlides;
        if (typeof list === 'string') { try { list = JSON.parse(list); } catch (e) { list = null; } }
        if (!Array.isArray(list) || !list.length) list = (sets && sets.heroImage) ? [sets.heroImage] : null;
        writeCache({ slides: list });
        window.renderHeroSlides(list);
    };

    var CAT_VISUALS = {
        'fresh-flowers-garlands': { img: 'assets/harvested-fresh.jpg', icon: 'fa-spa', blurb: 'Fresh cut flowers and hand-woven garlands.' },
        'rice': { icon: 'fa-bowl-rice', blurb: 'Basmati and non-basmati rice in export grades.' },
        'edible-oils': { icon: 'fa-droplet', blurb: 'Vegetable, coconut, palm and specialty oils.' },
        'spices-seasonings': { icon: 'fa-pepper-hot', blurb: 'Premium whole spices from India.' },
        'millets': { icon: 'fa-wheat-awn', blurb: 'Ragi, bajra, foxtail and other nutrient-rich millets.' },
        'other-grains-cereals': { icon: 'fa-seedling', blurb: 'Wheat, maize, barley, oats and more.' },
        'edible-seeds-oilseeds': { icon: 'fa-leaf', blurb: 'Sesame, groundnut, flaxseed and oilseeds.' }
    };

    var catImages = {};
    window.applyCategoryImages = function (sets) {
        var m = sets && sets.categoryImages;
        if (typeof m === 'string') { try { m = JSON.parse(m); } catch (e) { m = null; } }
        catImages = (m && typeof m === 'object') ? m : {};
        writeCache({ cats: catImages });
        renderCategories();
    };

    function renderCategories() {
        var grid = document.getElementById('homeCategoryGrid');
        var cat = window.ZENTRO_CATALOG || [];
        if (!grid) return;
        grid.innerHTML = cat.map(function (c) {
            var v = CAT_VISUALS[c.slug] || { icon: 'fa-box-open', blurb: '' };
            var total = c.subcategories.reduce(function (n, s) { return n + s.products.length; }, 0);
            var photo = catImages[c.slug] || v.img;
            var media = photo
                ? '<img src="' + esc(photo) + '" alt="' + esc(c.name) + '" loading="lazy">'
                : '<div class="hz-cat-icon"><i class="fa-solid ' + v.icon + '"></i></div>';
            var subs = c.subcategories.length > 1 ? c.subcategories.map(function (s) {
                return '<a href="/products?cat=' + esc(c.slug) + '&sub=' + esc(s.slug) + '">' + esc(s.name) + '</a>';
            }).join('') : '';
            return '<article class="hz-cat-card"><a href="/products?cat=' + esc(c.slug) + '" class="hz-cat-media">' + media + '</a>' +
                '<div class="hz-cat-body"><h3>' + esc(c.name) + '</h3><p>' + esc(v.blurb) + '</p>' +
                '<span class="hz-cat-count">' + total + ' products</span>' +
                (subs ? '<div class="hz-cat-subs">' + subs + '</div>' : '') +
                '<a href="/products?cat=' + esc(c.slug) + '" class="hz-cat-link">Explore ' + esc(c.name) + ' &rarr;</a></div></article>';
        }).join('');
    }

    var rzT = null, lastSig = null;
    var sigPos = 0, sigSet = 0, sigStep = 312, sigUser = false, sigHover = false, sigTween = null, sigRaf = null, sigUserT = null;

    function sigLoop() {
        var wrap = document.getElementById('sigMarquee');
        if (wrap && sigSet) {
            if (sigUser) {
                sigPos = wrap.scrollLeft;
            } else {
                if (sigTween) {
                    var t = Math.min(1, (performance.now() - sigTween.t0) / 450);
                    sigPos = sigTween.from + (sigTween.to - sigTween.from) * (1 - Math.pow(1 - t, 3));
                    if (t >= 1) sigTween = null;
                } else if (!sigHover) {
                    sigPos += 0.6;
                }
                wrap.scrollLeft = sigPos;
            }
            /* keep position inside the middle copy so it loops seamlessly */
            var shift = 0;
            if (sigPos >= 2 * sigSet) shift = -sigSet;
            else if (sigPos < sigSet) shift = sigSet;
            if (shift) {
                sigPos += shift;
                if (sigTween) { sigTween.from += shift; sigTween.to += shift; }
                wrap.scrollLeft = sigPos;
            }
        }
        sigRaf = requestAnimationFrame(sigLoop);
    }
    function sigMove(dir) {
        sigTween = { from: sigPos, to: sigPos + dir * sigStep, t0: performance.now() };
    }
    function sigTouch(on) {
        clearTimeout(sigUserT);
        if (on) { sigUser = true; sigTween = null; }
        else sigUserT = setTimeout(function () { sigUser = false; }, 1500);
    }

    var DEFAULT_SIG = [
        { name: 'Premium Roses – Hosur', image: 'assets/roses-export.jpg', category: 'fresh-flowers-garlands', tag: 'Fresh Flowers', description: 'Export-grade Hosur roses with strong stems and long vase life.' },
        { name: 'Madurai Jasmine (Malli)', image: 'assets/jasmine-buds.jpg', category: 'fresh-flowers-garlands', tag: 'Fresh Flowers', description: 'World-famous fragrant jasmine buds, packed fresh for export.' },
        { name: 'Marigold – Orange', image: 'assets/marigolds.jpg', category: 'fresh-flowers-garlands', tag: 'Fresh Flowers', description: 'Vibrant marigolds for festivals, events and decoration.' },
        { name: 'Madurai Jasmine Garland', image: 'assets/traditional-garlands.jpg', category: 'fresh-flowers-garlands', tag: 'Garlands', description: 'Hand-woven traditional garlands in humidity-controlled packs.' },
        { name: 'Fresh Cut Flowers', image: 'assets/harvested-fresh.jpg', category: 'fresh-flowers-garlands', tag: 'Fresh Flowers', description: 'Assorted premium cut flowers selected for colour and freshness.' }
    ];

    /* list = admin products marked as Signature; empty/null = default cards */
    window.homeSignature = function (list) {
        var track = document.getElementById('signatureProductsGrid');
        var wrap = document.getElementById('sigMarquee');
        if (!track || !wrap) return;
        lastSig = list;
        var items = (list && list.length) ? list : DEFAULT_SIG;
        var cat = window.ZENTRO_CATALOG || [];
        var set = items.map(function (p) {
            var c = cat.filter(function (x) { return x.slug === p.category; })[0];
            var tag = p.tag || (c ? c.name : 'Products');
            return '<div class="sig-card"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy"><div class="sig-card-body"><span class="tag-label">' + esc(String(tag).toUpperCase()) + '</span><h3>' + esc(p.name) + '</h3>' +
                (p.item_code ? '<p class="item-code">Item Code: ' + esc(p.item_code) + '</p>' : '') +
                '<p>' + esc(p.description || '') + '</p><div class="sig-actions"><button class="btn btn-sm btn-primary open-quote-modal" data-product="' + esc(p.name) + '" data-category="' + esc(p.category || '') + '">Enquire</button></div></div></div>';
        }).join('');
        track.innerHTML = set;
        var gap = parseFloat(getComputedStyle(track).columnGap) || 22;
        sigStep = (track.firstElementChild ? track.firstElementChild.offsetWidth : 290) + gap;
        sigSet = track.scrollWidth + gap; /* width of one full set */
        var copies = Math.ceil(wrap.clientWidth / sigSet) + 2;
        track.innerHTML = new Array(copies + 1).join(set);
        sigPos = sigSet; sigTween = null;
        wrap.scrollLeft = sigPos;
        if (!sigRaf) sigRaf = requestAnimationFrame(sigLoop);
    };

    function initReveal() {
        var sel = '.hz-head, .hz-strip-grid > div, .hz-cat-card, .hz-inline-cta, .section-header-flex, .heritage-visuals, .heritage-content, .section-title-centered, .standard-card, .section-header-dark, .process-card, .connectivity-content, .connectivity-map, .red-cta-box';
        var els = Array.prototype.slice.call(document.querySelectorAll(sel));
        if (!('IntersectionObserver' in window)) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                io.unobserve(el);
                el.classList.add('in');
                setTimeout(function () { el.classList.remove('hz-reveal', 'in'); el.style.removeProperty('--d'); }, 1000);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        els.forEach(function (el) {
            var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
            el.style.setProperty('--d', ((idx % 4) * 0.09) + 's');
            el.classList.add('hz-reveal');
            io.observe(el);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        /* wait briefly for saved slides (avoids a flash of default images); fall back to defaults */
        var cached = readCache();
        if (cached.cats && typeof cached.cats === 'object') { catImages = cached.cats; renderCategories(); }
        if (cached.slides && cached.slides.length) window.renderHeroSlides(cached.slides); /* instant on repeat visits */
        else setTimeout(function () { if (!heroShown) window.renderHeroSlides(null); }, 1500);
        renderCategories();
        initReveal();

        var hero = document.getElementById('heroSlider');
        document.getElementById('heroPrev').addEventListener('click', function () { show(idx - 1); play(); });
        document.getElementById('heroNext').addEventListener('click', function () { show(idx + 1); play(); });
        document.getElementById('heroDots').addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return;
            show(Array.prototype.indexOf.call(b.parentNode.children, b)); play();
        });
        
        var x0 = null;
        hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
        hero.addEventListener('touchend', function (e) {
            if (x0 === null) return;
            var dx = e.changedTouches[0].clientX - x0;
            if (Math.abs(dx) > 50) { show(idx + (dx < 0 ? 1 : -1)); play(); }
            x0 = null;
        });

        var sm = document.getElementById('sigMarquee');
        document.getElementById('sigPrev').addEventListener('click', function () { sigMove(-1); });
        document.getElementById('sigNext').addEventListener('click', function () { sigMove(1); });
        sm.addEventListener('mouseenter', function () { sigHover = true; });
        sm.addEventListener('mouseleave', function () { sigHover = false; });
        sm.addEventListener('touchstart', function () { sigTouch(true); }, { passive: true });
        sm.addEventListener('touchend', function () { sigTouch(false); });
        sm.addEventListener('touchcancel', function () { sigTouch(false); });
        window.homeSignature(null); /* defaults now; admin products replace them when loaded */
        window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { window.homeSignature(lastSig); }, 250); });
    });
})();
