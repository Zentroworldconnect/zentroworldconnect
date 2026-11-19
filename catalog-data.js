/* ==========================================
   Zentro World Connect - Category Master List
   Used by: the website (products page + quote form) and the admin panel.
   To add/rename a category, subcategory or standard product name, edit ONLY this file.
   Keep the "slug" values unchanged once products are uploaded.
   ========================================== */

window.ZENTRO_CATALOG = [
    {
        slug: 'fresh-flowers-garlands',
        name: 'Fresh Flowers & Garlands',
        subcategories: [
            {
                slug: 'fresh-cut-flowers',
                name: 'Fresh Cut Flowers',
                products: [
                    'Premium Roses – Hosur', 'Madurai Jasmine (Malli)', 'Pitchi Buds',
                    'Chrysanthemum – White', 'Chrysanthemum – Yellow', 'Marigold – Yellow',
                    'Marigold – Orange', 'Gerbera – Assorted Colours', 'Tuberose (Sampangi)',
                    'Lily', 'Lotus', 'Carnation', 'Orchid', 'Crossandra', 'Sunflower',
                    'Gladiolus', "Gypsophila (Baby's Breath)", 'Aster', 'Golden Rod',
                    'Liatris', 'Anthurium', 'Tulip', 'Bird of Paradise', 'Lisianthus',
                    'Statice', 'Nerine', 'Calla Lily', 'Dahlia', 'Heliconia'
                ]
            },
            {
                slug: 'flower-garlands',
                name: 'Flower Garlands',
                products: [
                    'Madurai Jasmine Garland', 'Jasmine & Rose Mixed Garland', 'Premium Rose Garland',
                    'Traditional Poo Malai', 'Wedding Flower Garland', 'Custom-Made Flower Garland',
                    'Marigold Garland – Yellow', 'Marigold Garland – Orange',
                    'Chrysanthemum Garland – White', 'Chrysanthemum Garland – Yellow',
                    'Tuberose Garland (Sampangi)', 'Lotus Garland', 'Crossandra Garland (Kanakambaram)',
                    'Mixed Colour Flower Garland', 'Jasmine Bud Garland', 'Double Jasmine Garland',
                    'Rose Petal Garland', 'Red Rose Garland', 'White Rose Garland', 'Pink Rose Garland',
                    'Orchid Garland', 'Lily Garland', 'Hibiscus Garland', 'Arali Garland',
                    'Avarampoo Garland', 'Tulsi Garland', 'Mango Leaf Garland',
                    'Temple Deity Garland', 'Bridal Premium Garland'
                ]
            }
        ]
    },
    {
        slug: 'rice',
        name: 'Rice',
        subcategories: [
            {
                slug: 'basmati',
                name: 'Basmati Rice',
                products: [
                    '1121 Basmati Rice', '1509 Basmati Rice', '1718 Basmati Rice',
                    'Traditional Basmati Rice', 'Pusa Basmati Rice', 'Brown Basmati Rice'
                ]
            },
            {
                slug: 'non-basmati',
                name: 'Non-Basmati Rice',
                products: [
                    'Sona Masoori Rice', 'Ponni Rice', 'IR 64 Rice', 'Swarna Rice',
                    'Matta Rice (Kerala Red Rice)', 'Seeraga Samba Rice', 'Idli Rice',
                    'Kolam Rice', 'Red Rice', 'Black Rice'
                ]
            }
        ]
    },
    {
        slug: 'edible-oils',
        name: 'Edible Oils',
        subcategories: [
            {
                slug: 'vegetable-seed-based',
                name: 'Vegetable & Seed-Based Oils',
                products: [
                    'Groundnut Oil', 'Sunflower Oil', 'Sesame / Gingelly Oil', 'Soybean Oil',
                    'Mustard Oil', 'Rice Bran Oil', 'Corn Oil', 'Safflower Oil'
                ]
            },
            {
                slug: 'coconut-palm-based',
                name: 'Coconut & Palm-Based Oils',
                products: ['Coconut Oil', 'Virgin Coconut Oil', 'Palm Oil', 'Palmolein Oil']
            },
            {
                slug: 'specialty',
                name: 'Specialty Edible Oils',
                products: ['Almond Oil', 'Walnut Oil', 'Avocado Oil']
            }
        ]
    },
    {
        slug: 'spices-seasonings',
        name: 'Spices & Seasonings',
        subcategories: [
            {
                slug: 'whole-spices',
                name: 'Whole Spices',
                note: 'Whole spices only – no powders, blended masalas or dehydrated products.',
                products: [
                    'Turmeric Fingers', 'Guntur Red Chilli', 'Byadgi Red Chilli', 'Teja Red Chilli',
                    'Black Pepper', 'White Pepper', 'Green Cardamom', 'Black Cardamom', 'Cinnamon',
                    'Cloves', 'Cumin Seeds', 'Coriander Seeds', 'Fennel Seeds', 'Fenugreek Seeds',
                    'Mustard Seeds', 'Dry Ginger', 'Star Anise', 'Nutmeg', 'Mace', 'Bay Leaves'
                ]
            }
        ]
    },
    {
        slug: 'millets',
        name: 'Millets',
        subcategories: [
            {
                slug: 'millets',
                name: 'Major Millets',
                products: [
                    'Finger Millet (Ragi)', 'Pearl Millet (Bajra)', 'Foxtail Millet (Thinai)',
                    'Little Millet (Samai)', 'Kodo Millet (Varagu)', 'Barnyard Millet (Kuthiraivali)',
                    'Proso Millet (Pani Varagu)', 'Sorghum (Jowar)'
                ]
            }
        ]
    },
    {
        slug: 'other-grains-cereals',
        name: 'Other Grains & Cereals',
        subcategories: [
            {
                slug: 'other-grains-cereals',
                name: 'Major Grains & Cereals',
                products: ['Wheat', 'Maize / Yellow Corn', 'White Maize', 'Barley', 'Oats', 'Rye', 'Triticale']
            }
        ]
    },
    {
        slug: 'edible-seeds-oilseeds',
        name: 'Edible Seeds & Oilseeds',
        subcategories: [
            {
                slug: 'edible-seeds',
                name: 'Edible Seeds',
                products: ['White Sesame Seeds', 'Black Sesame Seeds', 'Hulled Sesame Seeds', 'Groundnuts (Peanuts)']
            },
            {
                slug: 'oilseeds',
                name: 'Oilseeds',
                products: ['Flaxseeds (Linseed)', 'Mustard Seeds', 'Niger Seeds']
            }
        ]
    }
];
