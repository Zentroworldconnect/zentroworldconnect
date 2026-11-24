/* About page: category tiles, certifications, testimonials + scroll reveal */
(function () {
    /* ============ EDIT HERE ============
       Add only REAL certificates and reviews. Sections stay hidden while the lists are empty.
       Put certificate images in assets/certs/ and use that path in "image". */
    var CERTIFICATIONS = [
        // { name: 'ISO 22000:2018', note: 'Food safety management', image: 'assets/certs/iso-22000.jpg' },
        // { name: 'FSSAI Licence', note: 'Licence No. xxxxxxxx', image: '' }
    ];
    var TESTIMONIALS = [
        // { quote: 'Review text here.', name: 'Client Name', company: 'Company Ltd', country: 'Singapore' }
    ];
    var GOOGLE_REVIEWS_URL = ''; // e.g. your Google Business reviews link (optional)
    /* =================================== */

    var ICONS = { 'fresh-flowers-garlands': 'fa-spa', 'rice': 'fa-bowl-rice', 'edible-oils': 'fa-droplet', 'spices-seasonings': 'fa-pepper-hot', 'millets': 'fa-wheat-awn', 'other-grains-cereals': 'fa-seedling', 'edible-seeds-oilseeds': 'fa-leaf' };
    function catUrl(slug) { var m = window.ZENTRO_CATEGORY_PAGES || {}; return m[slug] || ('/products?cat=' + slug); }
    function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

    document.addEventListener('DOMContentLoaded', function () {
        var grid = document.getElementById('aboutCategories');
        var cat = window.ZENTRO_CATALOG || [];
        if (grid) grid.innerHTML = cat.map(function (c) {
            var n = c.subcategories.reduce(function (t, s) { return t + s.products.length; }, 0);
            return '<a class="ab-cat" href="' + catUrl(c.slug) + '"><i class="fa-solid ' + (ICONS[c.slug] || 'fa-box-open') + '"></i><strong>' + esc(c.name) + '</strong><span>' + n + ' products</span></a>';
        }).join('');


        var cg = document.getElementById('certGrid');
        if (cg && CERTIFICATIONS.length) {
            cg.innerHTML = CERTIFICATIONS.map(function (c) {
                var media = c.image
                    ? '<a href="' + esc(c.image) + '" target="_blank" rel="noopener noreferrer" class="ab-cert-img"><img src="' + esc(c.image) + '" alt="' + esc(c.name) + ' certificate" loading="lazy"></a>'
                    : '<div class="ab-cert-img ab-cert-badge"><i class="fa-solid fa-certificate"></i></div>';
                return '<div class="ab-cert">' + media + '<h4>' + esc(c.name) + '</h4>' + (c.note ? '<p>' + esc(c.note) + '</p>' : '') + '</div>';
            }).join('');
            document.getElementById('certSection').hidden = false;
        }

        var rg = document.getElementById('reviewGrid');
        if (rg && TESTIMONIALS.length) {
            rg.innerHTML = TESTIMONIALS.map(function (t) {
                var who = [t.company, t.country].filter(Boolean).join(', ');
                return '<figure class="ab-review"><i class="fa-solid fa-quote-left"></i><blockquote>' + esc(t.quote) + '</blockquote><figcaption><strong>' + esc(t.name) + '</strong>' + (who ? '<span>' + esc(who) + '</span>' : '') + '</figcaption></figure>';
            }).join('');
            document.getElementById('reviewSection').hidden = false;
            if (GOOGLE_REVIEWS_URL) {
                document.getElementById('reviewLink').href = GOOGLE_REVIEWS_URL;
                document.getElementById('reviewLinkWrap').hidden = false;
            }
        }

        if (!('IntersectionObserver' in window)) return;
        var sel = '.about-hero-grid, .ab-story > *, .ab-stats > div, .ab-mv-card, .hz-head, .ab-cat, .hz-inline-cta, .principles-section, .why-dark-section, .process-card, .section-header-dark, .ab-doc, .ab-cert, .ab-review, .ab-faq details, .red-contact-container, .ab-map';
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target; io.unobserve(el); el.classList.add('in');
                setTimeout(function () { el.classList.remove('hz-reveal', 'in'); el.style.removeProperty('--d'); }, 1000);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
            var i = Array.prototype.indexOf.call(el.parentNode.children, el);
            el.style.setProperty('--d', ((i % 4) * 0.09) + 's');
            el.classList.add('hz-reveal'); io.observe(el);
        });
    });
})();
