"""
Generate seedData.json for HK supermarket PoS Prediction System.
1. Downloads HK Consumer Council price data CSV
2. Curates ~60 products across 7 categories
3. Searches Open Food Facts for product images
4. Outputs final JSON with randomized stock & 14-day forecasts
"""

import csv
import io
import json
import os
import random
import re
import time
import urllib.request
import urllib.parse
import ssl

random.seed(42)

# ---------------------------------------------------------------------------
# 1.  Category definitions
# ---------------------------------------------------------------------------
CATEGORIES = {
    "beverages":      {"label": "Beverages",              "color": "#DBEAFE", "textColor": "#1E40AF", "accent": "#3B82F6"},
    "dairy":          {"label": "Dairy & Fresh",           "color": "#DCFCE7", "textColor": "#166534", "accent": "#22C55E"},
    "snacks":         {"label": "Snacks & Confectionery",  "color": "#FFEDD5", "textColor": "#9A3412", "accent": "#F97316"},
    "noodles_rice":   {"label": "Noodles & Rice",          "color": "#FEF3C7", "textColor": "#92400E", "accent": "#F59E0B"},
    "canned_cooking": {"label": "Canned Food & Cooking",   "color": "#FEE2E2", "textColor": "#991B1B", "accent": "#EF4444"},
    "frozen":         {"label": "Frozen Food",             "color": "#E0E7FF", "textColor": "#3730A3", "accent": "#6366F1"},
    "bakery":         {"label": "Bakery & Breakfast",      "color": "#F3E8FF", "textColor": "#6B21A8", "accent": "#A855F7"},
}

# ---------------------------------------------------------------------------
# 2.  Product master list  (name, shortName, brand, category, fallback_price,
#     OFF search query, csv_match_hint for Consumer Council lookup)
# ---------------------------------------------------------------------------
PRODUCTS = [
    # --- BEVERAGES (15) ---
    ("Coca Cola Coke - Bottle 500mL",       "Coke 500mL",         "Coca Cola",      "beverages",  10.0,  "Coca Cola 500ml",           "coca cola"),
    ("Coca Cola Coke Zero - Bottle 500mL",  "Coke Zero 500mL",    "Coca Cola",      "beverages",  10.0,  "Coca Cola Zero 500ml",      "coke zero"),
    ("Sprite - Bottle 1.25L",               "Sprite 1.25L",       "Sprite",         "beverages",  12.5,  "Sprite 1.25L",              "sprite"),
    ("Fanta Orange - Bottle 2L",            "Fanta Orange 2L",    "Fanta",          "beverages",  16.9,  "Fanta Orange 2L",           "fanta"),
    ("Schweppes Cream Soda - Can 330mL",    "Cream Soda 330mL",   "Schweppes",      "beverages",   5.5,  "Schweppes Cream Soda",      "schweppes cream soda"),
    ("Vita Lemon Tea - Pack 250mL x6",      "Vita Lemon Tea x6",  "Vita",           "beverages",  20.9,  "Vita Lemon Tea",            "vita lemon tea"),
    ("Vita Distilled Water - Bottle 1.5L",  "Vita Water 1.5L",    "Vita",           "beverages",   6.5,  "Vita distilled water",      "vita distilled water"),
    ("Pocari Sweat - Bottle 500mL",         "Pocari 500mL",       "Pocari Sweat",   "beverages",   9.9,  "Pocari Sweat 500ml",        "pocari sweat"),
    ("Red Bull Energy Drink - Can 250mL",   "Red Bull 250mL",     "Red Bull",       "beverages",  15.0,  "Red Bull 250ml",            "red bull"),
    ("Tao Ti Mandarin Lemon - Bottle 500mL","Tao Ti Lemon 500mL", "Tao Ti",         "beverages",   8.5,  "Tao Ti Mandarin Lemon",     "tao ti"),
    ("Hung Fook Tong Chrysanthemum Tea 500mL","HFT Chrysanthemum", "Hung Fook Tong", "beverages",   9.0,  "Hung Fook Tong tea",        "hung fook tong"),
    ("Minute Maid Orange Juice - Bottle 1.2L","Minute Maid OJ 1.2L","Minute Maid",  "beverages",  19.9,  "Minute Maid Orange",        "minute maid orange"),
    ("San Pellegrino Sparkling Water 500mL", "San Pellegrino 500mL","San Pellegrino","beverages",  15.9,  "San Pellegrino 500ml",      "san pellegrino"),
    ("Perrier Sparkling Water - Bottle 330mL","Perrier 330mL",     "Perrier",        "beverages",  12.0,  "Perrier 330ml",             "perrier"),
    ("Healthworks Sugarcane Water 500mL",    "Sugarcane 500mL",    "Healthworks",    "beverages",   9.5,  "Healthworks Sugarcane",     "healthworks sugarcane"),

    # --- DAIRY (11) ---
    ("Kowloon Dairy Fresh Milk 946mL",       "KD Fresh Milk",      "Kowloon Dairy",  "dairy",  23.9,  "Kowloon Dairy Milk",         "kowloon dairy fresh milk"),
    ("Meiji Deluxe Milk 946mL",              "Meiji Milk 946mL",   "Meiji",          "dairy",  26.5,  "Meiji milk",                 "meiji deluxe milk"),
    ("Nestle Dairy Farm Fresh Milk 946mL",   "Dairy Farm Milk",    "Dairy Farm",     "dairy",  22.5,  "Nestle Dairy Farm milk",     "dairy farm fresh milk"),
    ("CP-Meiji Yoghurt Strawberry 135g",     "Meiji Yoghurt Straw","CP-Meiji",       "dairy",   8.9,  "Meiji yoghurt strawberry",   "cp-meiji yoghurt"),
    ("CP-Meiji Yoghurt Mango 135g",          "Meiji Yoghurt Mango","CP-Meiji",       "dairy",   8.9,  "Meiji yoghurt mango",        "cp-meiji yoghurt mango"),
    ("BESTbuy Fresh Eggs 10pcs",             "Fresh Eggs 10pcs",   "BESTbuy",        "dairy",  22.0,  "fresh eggs",                 "bestbuy fresh eggs"),
    ("Kraft Singles Cheese Slices 12pcs",    "Kraft Singles 12s",   "Kraft",          "dairy",  29.9,  "Kraft Singles cheese",       "kraft singles"),
    ("Philadelphia Cream Cheese 250g",       "Philly Cream Cheese", "Philadelphia",  "dairy",  32.9,  "Philadelphia cream cheese",  "philadelphia cream cheese"),
    ("Anchor Butter Unsalted 227g",          "Anchor Butter 227g", "Anchor",         "dairy",  29.9,  "Anchor Butter unsalted",     "anchor butter"),
    ("Kowloon Dairy Soya Milk 946mL",        "KD Soya Milk",       "Kowloon Dairy",  "dairy",  17.9,  "Kowloon Dairy soya milk",    "kowloon dairy soya"),
    ("Pak Fook Soya Milk 1L",                "Pak Fook Soya 1L",   "Pak Fook",       "dairy",  13.9,  "Pak Fook soya milk",         "pak fook soya"),

    # --- SNACKS (11) ---
    ("Calbee BBQ Potato Chips 170g",         "Calbee BBQ 170g",    "Calbee",         "snacks", 18.5,  "Calbee BBQ chips",           "calbee bbq"),
    ("Calbee Jagabee Original 75g",          "Jagabee 75g",        "Calbee",         "snacks", 14.9,  "Calbee Jagabee",             "calbee jagabee"),
    ("Pringles Original 134g",               "Pringles 134g",      "Pringles",       "snacks", 22.9,  "Pringles Original",          "pringles original"),
    ("Pringles Sour Cream & Onion 134g",     "Pringles SC&O 134g", "Pringles",       "snacks", 22.9,  "Pringles Sour Cream",        "pringles sour cream"),
    ("Cadbury Dairy Milk Chocolate 180g",    "Cadbury DM 180g",    "Cadbury",        "snacks", 29.9,  "Cadbury Dairy Milk",         "cadbury dairy milk"),
    ("Ferrero Rocher T16",                   "Ferrero T16",        "Ferrero",        "snacks", 52.9,  "Ferrero Rocher",             "ferrero rocher"),
    ("Lindt Excellence Dark 85% 100g",       "Lindt Dark 85%",     "Lindt",          "snacks", 39.9,  "Lindt Excellence Dark 85",   "lindt excellence"),
    ("M&M's Peanut 200g",                    "M&M Peanut 200g",    "M&M's",          "snacks", 29.9,  "M&M's Peanut",               "m&m peanut"),
    ("Oreo Original Cookies 137g",           "Oreo 137g",          "Oreo",           "snacks", 12.9,  "Oreo cookies",               "oreo"),
    ("Tim Tam Original 200g",                "Tim Tam 200g",       "Tim Tam",        "snacks", 25.9,  "Tim Tam Original",           "tim tam"),
    ("Garden Lemon Puff 340g",               "Lemon Puff 340g",    "Garden",         "snacks", 16.9,  "Garden Lemon Puff",          "garden lemon puff"),

    # --- NOODLES & RICE (6) ---
    ("Nissin Demae Ramen Sesame Oil 5pk",    "Demae Ramen 5pk",    "Nissin",         "noodles_rice", 18.9, "Nissin Demae Ramen",     "nissin demae ramen"),
    ("Doll Instant Noodle Chicken 5pk",      "Doll Noodle Chk 5pk","Doll",           "noodles_rice", 14.5, "Doll instant noodle",    "doll instant noodle"),
    ("Nongshim Shin Ramyun 5pk",             "Shin Ramyun 5pk",    "Nongshim",       "noodles_rice", 32.9, "Nongshim Shin Ramyun",   "nongshim shin ramyun"),
    ("Barilla Spaghetti No.5 500g",          "Barilla Spag 500g",  "Barilla",        "noodles_rice", 19.9, "Barilla Spaghetti No.5", "barilla spaghetti"),
    ("Thai Hom Mali Jasmine Rice 8kg",       "Thai Rice 8kg",      "Thai Hom Mali",  "noodles_rice", 98.0, "Thai Jasmine Rice",      "thai hom mali rice"),
    ("Japanese Pearl Rice 5kg",              "Pearl Rice 5kg",     "Various",        "noodles_rice", 72.0, "Japanese pearl rice",    "japanese pearl rice"),

    # --- CANNED & COOKING (5) ---
    ("Greatwall Premium Luncheon Meat 340g", "GW Luncheon 340g",   "Greatwall",      "canned_cooking", 22.9, "Greatwall luncheon meat",   "greatwall luncheon"),
    ("Ayam Brand Tuna Chunks in Water 185g", "Ayam Tuna 185g",     "Ayam Brand",     "canned_cooking", 16.9, "Ayam Brand tuna",           "ayam brand tuna"),
    ("Amoy Gold Label Soy Sauce 500mL",      "Amoy Soy Sauce",     "Amoy",           "canned_cooking", 15.9, "Amoy soy sauce",            "amoy soy sauce"),
    ("Lee Kum Kee Premium Oyster Sauce 510g","LKK Oyster Sauce",   "Lee Kum Kee",    "canned_cooking", 22.5, "Lee Kum Kee oyster sauce",  "lee kum kee oyster"),
    ("Lion & Globe Peanut Oil 900mL",        "L&G Peanut Oil",     "Lion & Globe",   "canned_cooking", 35.9, "Lion Globe peanut oil",     "lion globe peanut oil"),

    # --- FROZEN (6) ---
    ("Amoy Shrimp Shao Mai 270g",            "Amoy Shao Mai",      "Amoy",           "frozen", 29.9, "Amoy shrimp siu mai",     "amoy shao mai"),
    ("Amoy Shrimp Har Gow 270g",             "Amoy Har Gow",       "Amoy",           "frozen", 29.9, "Amoy har gow",            "amoy har gow"),
    ("CP Shrimp Wonton 160g",                "CP Shrimp Wonton",   "CP",             "frozen", 24.9, "CP shrimp wonton",        "cp shrimp wonton"),
    ("Haagen-Dazs Vanilla Ice Cream 473mL",  "HD Vanilla 473mL",   "Haagen-Dazs",    "frozen", 79.9, "Haagen-Dazs Vanilla",     "haagen-dazs vanilla"),
    ("Dreyer's Rocky Road Ice Cream 473mL",  "Dreyer's Rocky 473mL","Dreyer's",       "frozen", 49.9, "Dreyer's Rocky Road",     "dreyer's rocky road"),
    ("Nestle Drumstick Vanilla 4pk",          "Drumstick 4pk",      "Nestle",         "frozen", 45.9, "Nestle Drumstick vanilla","nestle drumstick"),

    # --- BAKERY (6) ---
    ("Garden Life White Bread 455g",          "Life Bread 455g",    "Garden",         "bakery", 15.5, "Garden bread",            "garden life bread"),
    ("Garden Sandwich Bread 14 Slices",       "Sandwich Bread 14s", "Garden",         "bakery", 14.5, "Garden sandwich bread",   "garden sandwich bread"),
    ("Garden Croissants 4pcs",                "Croissants 4pcs",    "Garden",         "bakery", 18.9, "Garden croissant",        "garden croissant"),
    ("Kellogg's Corn Flakes 500g",            "Corn Flakes 500g",   "Kellogg's",      "bakery", 39.9, "Kellogg's Corn Flakes",   "kellogg corn flakes"),
    ("Nestle Koko Krunch 330g",               "Koko Krunch 330g",   "Nestle",         "bakery", 35.9, "Nestle Koko Krunch",      "nestle koko krunch"),
    ("Quaker Instant Oatmeal Original 800g",  "Quaker Oatmeal 800g","Quaker",         "bakery", 42.9, "Quaker oatmeal",          "quaker oatmeal"),
]

# ---------------------------------------------------------------------------
# 3.  Download Consumer Council CSV and build price lookup
# ---------------------------------------------------------------------------
CSV_URL = "https://online-price-watch.consumer.org.hk/opw/opendata/pricewatch_en.csv"

def download_csv():
    """Download the Consumer Council price watch CSV. Returns list of dicts."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        print(f"Downloading Consumer Council CSV from {CSV_URL} ...")
        req = urllib.request.Request(CSV_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            raw = resp.read()
        # Try utf-8-sig first (BOM), then utf-8, then latin-1
        for enc in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                text = raw.decode(enc)
                break
            except UnicodeDecodeError:
                continue
        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)
        print(f"  -> Downloaded {len(rows)} rows")
        return rows
    except Exception as e:
        print(f"  -> CSV download failed: {e}")
        return []


def build_price_lookup(rows):
    """Build a dict mapping lowercase product-description fragments to prices."""
    lookup = {}
    for row in rows:
        # Column names vary; try common ones
        name = row.get("Product Name", row.get("product_name", row.get("Product", "")))
        price_str = row.get("Price", row.get("price", ""))
        brand = row.get("Brand", row.get("brand", ""))
        code = row.get("Product Code", row.get("code", row.get("Code", "")))
        if not name:
            continue
        try:
            price = float(re.sub(r"[^\d.]", "", str(price_str)))
        except (ValueError, TypeError):
            price = None
        key = f"{brand} {name}".lower().strip()
        if price and price > 0:
            lookup[key] = price
    print(f"  -> Built price lookup with {len(lookup)} entries")
    return lookup


def match_price(lookup, hint, fallback):
    """Try to find a price in the lookup using the hint."""
    hint_lower = hint.lower()
    # Exact substring match
    for key, price in lookup.items():
        if hint_lower in key or key in hint_lower:
            return round(price, 1)
    # Word-based fuzzy: if >=2 hint words appear in key
    hint_words = hint_lower.split()
    for key, price in lookup.items():
        matches = sum(1 for w in hint_words if w in key)
        if matches >= 2:
            return round(price, 1)
    return fallback

# ---------------------------------------------------------------------------
# 4.  Open Food Facts image search
# ---------------------------------------------------------------------------
OFF_URL = "https://world.openfoodfacts.org/cgi/search.pl"

def search_image(query):
    """Search Open Food Facts for product image. Returns URL or None."""
    params = urllib.parse.urlencode({
        "search_terms": query,
        "search_simple": "1",
        "action": "process",
        "json": "1",
        "page_size": "3",
        "fields": "product_name,brands,image_front_small_url,image_front_url",
    })
    url = f"{OFF_URL}?{params}"
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "PoS-SeedGen/1.0"})
        with urllib.request.urlopen(req, timeout=5, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        products = data.get("products", [])
        for p in products:
            img = p.get("image_front_url") or p.get("image_front_small_url")
            if img:
                return img
    except Exception:
        pass
    return None

# ---------------------------------------------------------------------------
# 5.  Forecast generation
# ---------------------------------------------------------------------------
def generate_forecast(base_min=5, base_max=30):
    """Generate 14-day forecast with slight weekend uplift."""
    forecast = []
    # Day 0 = today; model a simple weekly pattern
    for d in range(14):
        day_of_week = d % 7
        base = random.randint(base_min, base_max)
        # Weekend uplift on Sat(5) / Sun(6)
        if day_of_week in (5, 6):
            base = int(base * random.uniform(1.1, 1.35))
        forecast.append(min(base, 35))  # cap at 35
    return forecast

# ---------------------------------------------------------------------------
# 6.  Main
# ---------------------------------------------------------------------------
def main():
    # Download CSV
    rows = download_csv()
    price_lookup = build_price_lookup(rows) if rows else {}

    products_json = []
    images_found = 0

    for idx, (name, short, brand, cat, fallback_price, off_query, csv_hint) in enumerate(PRODUCTS, 1):
        item_id = f"item_{idx:03d}"
        sku = f"P{900000000 + idx:09d}"

        # Price: try CSV, else fallback
        price = match_price(price_lookup, csv_hint, fallback_price)

        # Image from Open Food Facts
        print(f"  [{idx:2d}/{len(PRODUCTS)}] Searching image for: {off_query} ...", end=" ", flush=True)
        image = search_image(off_query)
        if image:
            images_found += 1
            print("found")
        else:
            print("none")
        time.sleep(0.3)

        stock = random.randint(10, 80)
        forecast = generate_forecast()

        products_json.append({
            "id": item_id,
            "sku": sku,
            "name": name,
            "shortName": short,
            "brand": brand,
            "category": cat,
            "price": price,
            "image": image,
            "stock": stock,
            "initialStock": stock,
            "salesToday": 0,
            "forecast": forecast,
            "autoOrder": False,
            "lastOrdered": None,
        })

    # Assemble final structure
    seed_data = {
        "categories": CATEGORIES,
        "products": products_json,
        "metadata": {
            "currency": "HKD",
            "currencySymbol": "$",
            "totalProducts": len(products_json),
            "productsWithImages": images_found,
        },
    }

    out_dir = os.path.join(os.path.dirname(__file__), "src", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "seedData.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(seed_data, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Wrote {len(products_json)} products to {out_path}")
    print(f"  Products with images: {images_found}/{len(products_json)}")


if __name__ == "__main__":
    main()
