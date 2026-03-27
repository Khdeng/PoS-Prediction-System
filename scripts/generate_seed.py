import json, random, os

random.seed(42)

categories = {
    "beverages": {"label": "Beverages", "color": "#DBEAFE", "textColor": "#1E40AF", "accent": "#3B82F6"},
    "dairy": {"label": "Dairy & Fresh", "color": "#DCFCE7", "textColor": "#166534", "accent": "#22C55E"},
    "snacks": {"label": "Snacks & Confectionery", "color": "#FFEDD5", "textColor": "#9A3412", "accent": "#F97316"},
    "noodles_rice": {"label": "Noodles & Rice", "color": "#FEF3C7", "textColor": "#92400E", "accent": "#F59E0B"},
    "canned_cooking": {"label": "Canned Food & Cooking", "color": "#FEE2E2", "textColor": "#991B1B", "accent": "#EF4444"},
    "frozen": {"label": "Frozen Food", "color": "#E0E7FF", "textColor": "#3730A3", "accent": "#6366F1"},
    "bakery": {"label": "Bakery & Breakfast", "color": "#F3E8FF", "textColor": "#6B21A8", "accent": "#A855F7"},
}

# [category, brand, full_name, short_name, price_hkd, image_url_or_none]
raw = [
    # BEVERAGES (15)
    ["beverages", "Coca Cola", "Coke - Bottle 500mL", "Coke 500mL", 10.0, "https://images.openfoodfacts.org/images/products/544/900/021/4799/front_en.187.400.jpg"],
    ["beverages", "Coca Cola", "Coke Zero - Bottle 500mL", "Coke Zero 500mL", 10.0, "https://images.openfoodfacts.org/images/products/544/900/013/0768/front_en.176.400.jpg"],
    ["beverages", "Sprite", "Lemon-Lime Soda 1.25L", "Sprite 1.25L", 10.0, "https://images.openfoodfacts.org/images/products/544/900/000/9978/front_en.55.400.jpg"],
    ["beverages", "Fanta", "Orange Drink 2L", "Fanta Orange 2L", 17.0, "https://images.openfoodfacts.org/images/products/544/900/001/6167/front_en.50.400.jpg"],
    ["beverages", "Schweppes", "Cream Soda 330mL x 8", "Cream Soda 8pk", 40.0, "https://images.openfoodfacts.org/images/products/054/491/001/5652/front_en.13.400.jpg"],
    ["beverages", "Vita", "Lemon Tea 250mL x 6", "Lemon Tea 6pk", 19.0, None],
    ["beverages", "Vita", "Pure Distilled Water 430mL", "Distilled Water", 4.5, None],
    ["beverages", "Pocari Sweat", "Ion Supply Drink 350mL x 6", "Pocari Sweat 6pk", 33.0, "https://images.openfoodfacts.org/images/products/498/919/810/1205/front_en.3.400.jpg"],
    ["beverages", "Red Bull", "Energy Drink 250mL", "Red Bull 250mL", 16.0, "https://images.openfoodfacts.org/images/products/90162602/front_en.428.400.jpg"],
    ["beverages", "Tao Ti", "Mandarin Lemon 500mL", "Mandarin Lemon", 8.0, None],
    ["beverages", "Hung Fook Tong", "Chrysanthemum Honey 500mL", "Chrysanthemum Tea", 9.0, None],
    ["beverages", "Minute Maid", "Orange Juice 420mL", "Orange Juice", 9.0, "https://images.openfoodfacts.org/images/products/500/011/218/5849/front_en.33.400.jpg"],
    ["beverages", "San Pellegrino", "Sparkling Water 750mL", "Sparkling Water", 23.5, "https://images.openfoodfacts.org/images/products/804/198/640/5750/front_en.44.400.jpg"],
    ["beverages", "Perrier", "Sparkling Mineral Water 750mL", "Perrier 750mL", 24.0, "https://images.openfoodfacts.org/images/products/307/611/500/0109/front_en.207.400.jpg"],
    ["beverages", "Healthworks", "Sugarcane Sea Coconut 500mL", "Sugarcane Drink", 8.0, None],
    # DAIRY (11)
    ["dairy", "Kowloon Dairy", "100% Fresh Milk 946mL", "Fresh Milk 946mL", 32.0, None],
    ["dairy", "Meiji", "4.3 Deluxe Milk 946mL", "Deluxe Milk 946mL", 33.0, None],
    ["dairy", "Nestle", "Dairy Farm Fresh Milk 236mL", "Fresh Milk 236mL", 6.0, None],
    ["dairy", "CP-Meiji", "Low Fat Yoghurt Strawberry 135g", "Strawberry Yoghurt", 10.0, None],
    ["dairy", "CP-Meiji", "Low Fat Yoghurt Mango 135g", "Mango Yoghurt", 10.0, None],
    ["dairy", "BESTbuy", "Fresh Brown Eggs (L) 12pcs", "Brown Eggs 12pcs", 22.0, None],
    ["dairy", "Kraft", "Singles Hi-Calcium Cheese 12s", "Cheese Singles 12s", 37.9, "https://images.openfoodfacts.org/images/products/002/100/062/3124/front_en.6.400.jpg"],
    ["dairy", "Philadelphia", "Cream Cheese 250g", "Cream Cheese 250g", 42.0, "https://images.openfoodfacts.org/images/products/762/200/060/7346/front_en.10.400.jpg"],
    ["dairy", "Anchor", "NZ Butter Salted 227g", "Salted Butter 227g", 43.9, "https://images.openfoodfacts.org/images/products/994/600/001/3228/front_en.30.400.jpg"],
    ["dairy", "Kowloon Dairy", "Soya Gold Fresh Soya 946mL", "Fresh Soya Milk", 12.0, None],
    ["dairy", "Pak Fook", "Soya Milk Hi Calcium 946mL", "Hi-Cal Soya Milk", 12.0, None],
    # SNACKS (11)
    ["snacks", "Calbee", "Potato Chips BBQ 105g", "BBQ Chips 105g", 22.0, None],
    ["snacks", "Calbee", "Jagabee Potato Sticks 18g x 5", "Jagabee Original 5pk", 26.9, None],
    ["snacks", "Pringles", "Original 102g", "Pringles Original", 18.0, "https://images.openfoodfacts.org/images/products/003/800/013/8416/front_en.140.400.jpg"],
    ["snacks", "Pringles", "Sour Cream & Onion 102g", "Sour Cream Pringles", 18.0, "https://images.openfoodfacts.org/images/products/003/800/013/8614/front_en.135.400.jpg"],
    ["snacks", "Cadbury", "Dairy Milk Chocolate 180g", "Dairy Milk 180g", 26.0, "https://images.openfoodfacts.org/images/products/772/600/012/0014/front_en.28.400.jpg"],
    ["snacks", "Ferrero", "Rocher T5 62.5g", "Ferrero Rocher 5pc", 25.0, "https://images.openfoodfacts.org/images/products/800/050/035/9948/front_en.57.400.jpg"],
    ["snacks", "Lindt", "Excellence 70% Dark 100g", "Lindt Dark 70%", 37.9, "https://images.openfoodfacts.org/images/products/300/595/009/1434/front_en.93.400.jpg"],
    ["snacks", "M&M's", "Peanut Choc Fun Size 175.5g", "Peanut M&Ms", 29.9, "https://images.openfoodfacts.org/images/products/500/015/926/5542/front_en.129.400.jpg"],
    ["snacks", "Oreo", "Chocolate Sandwich 248.4g", "Oreo Cookies 9pk", 23.5, "https://images.openfoodfacts.org/images/products/762/210/065/2494/front_en.7.400.jpg"],
    ["snacks", "Arnott's", "Tim Tam Original 200g", "Tim Tam Original", 28.0, "https://images.openfoodfacts.org/images/products/993/489/370/0014/front_en.12.400.jpg"],
    ["snacks", "Garden", "Lemon Puff 350g", "Lemon Puff 350g", 28.5, None],
    # NOODLES & RICE (6)
    ["noodles_rice", "Nissin", "Demae Ramen Tonkotsu 97g", "Demae Ramen", 5.0, "https://images.openfoodfacts.org/images/products/489/001/000/2655/front_en.7.400.jpg"],
    ["noodles_rice", "Doll", "Instant Noodle Chicken 103g x 5", "Doll Chicken 5pk", 18.0, None],
    ["noodles_rice", "Nongshim", "Shin Ramyun 120g x 5", "Shin Ramyun 5pk", 28.0, "https://images.openfoodfacts.org/images/products/880/200/203/1146/front_en.52.400.jpg"],
    ["noodles_rice", "Barilla", "Spaghetti No.5 500g", "Spaghetti 500g", 26.0, "https://images.openfoodfacts.org/images/products/807/680/815/3580/front_en.241.400.jpg"],
    ["noodles_rice", "Chewy", "Thai Hom Mali Rice 8kg", "Thai Rice 8kg", 102.9, None],
    ["noodles_rice", "Cherry Blossom", "Japanese Pearl Rice 5kg", "Japanese Rice 5kg", 52.0, None],
    # CANNED & COOKING (5)
    ["canned_cooking", "Greatwall", "Chopped Pork & Ham 340g", "Luncheon Meat 340g", 27.0, None],
    ["canned_cooking", "Ayam Brand", "Tuna in Water 150g", "Tuna Chunks 150g", 25.0, "https://images.openfoodfacts.org/images/products/995/512/100/5133/front_en.8.400.jpg"],
    ["canned_cooking", "Amoy", "Gold Label Light Soy 500mL", "Light Soy Sauce", 13.9, None],
    ["canned_cooking", "Lee Kum Kee", "Premium Oyster Sauce 255g", "Oyster Sauce 255g", 24.9, "https://images.openfoodfacts.org/images/products/078/895/120/0036/front_en.6.400.jpg"],
    ["canned_cooking", "Lion & Globe", "Peanut Oil 900mL x 3", "Peanut Oil 3pk", 120.0, None],
    # FROZEN (6)
    ["frozen", "Amoy", "Shrimp Shao Mai 10pcs 120g", "Shrimp Siu Mai 10pc", 20.9, None],
    ["frozen", "Amoy", "Premium Hargow 6pcs 102g", "Hargow 6pc", 20.9, None],
    ["frozen", "CP", "Shrimp Wonton 8pcs 101g", "Shrimp Wonton 8pc", 20.9, None],
    ["frozen", "Haagen-Dazs", "Vanilla Ice Cream 473mL", "Vanilla Ice Cream", 79.9, "https://images.openfoodfacts.org/images/products/007/456/706/9004/front_en.8.400.jpg"],
    ["frozen", "Dreyer's", "Rocky Road Ice Cream 750mL", "Rocky Road 750mL", 65.0, None],
    ["frozen", "Nestle", "Drumstick Mango Cone 115mL x 4", "Mango Drumstick 4pk", 44.5, None],
    # BAKERY (6)
    ["bakery", "Garden", "Life Bread Protein 14 slices", "Life Bread 14s", 17.0, None],
    ["bakery", "Garden", "Sandwich Bread 8 slices", "Sandwich Bread 8s", 13.5, None],
    ["bakery", "Garden", "French Croissants 4pcs", "Croissants 4pc", 27.5, None],
    ["bakery", "Kellogg's", "Classic Corn Flakes 275g", "Corn Flakes 275g", 30.0, "https://images.openfoodfacts.org/images/products/500/803/415/0213/front_en.108.400.jpg"],
    ["bakery", "Nestle", "Koko Krunch 330g", "Koko Krunch 330g", 30.0, None],
    ["bakery", "Quaker", "Instant Oatmeal 800g", "Oatmeal 800g", 29.9, "https://images.openfoodfacts.org/images/products/003/000/031/8823/front_en.83.400.jpg"],
]

products = []
for i, (cat, brand, name, short, price, image) in enumerate(raw):
    avg_daily = random.randint(5, 35)
    initial_stock = random.randint(max(10, avg_daily), max(15, avg_daily * 3))
    forecast = []
    for d in range(14):
        factor = 1.15 if d % 7 >= 5 else 1.0
        val = max(1, round(avg_daily * factor * random.uniform(0.7, 1.35)))
        forecast.append(val)

    products.append({
        "id": f"item_{i+1:03d}",
        "sku": f"P{i+1:09d}",
        "name": f"{brand} {name}",
        "shortName": short,
        "brand": brand,
        "category": cat,
        "price": price,
        "image": image,
        "stock": initial_stock,
        "initialStock": initial_stock,
        "salesToday": 0,
        "forecast": forecast,
        "autoOrder": False,
        "lastOrdered": None,
    })

output = {
    "categories": categories,
    "products": products,
    "metadata": {
        "currency": "HKD",
        "currencySymbol": "$",
        "totalProducts": len(products),
        "productsWithImages": sum(1 for p in products if p["image"]),
    }
}

os.makedirs("src/data", exist_ok=True)
with open("src/data/seedData.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"Generated {len(products)} products ({sum(1 for p in products if p['image'])} with images)")
