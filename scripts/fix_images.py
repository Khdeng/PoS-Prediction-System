import json, urllib.request, urllib.parse, sys, time
sys.stdout.reconfigure(encoding='utf-8')

# Map by brand + partial match to known barcodes
BRAND_BARCODES = {
    ("Coca Cola", "Coke"): "5449000214799",
    ("Coca Cola", "Zero"): "5449000131805",
    ("Sprite", ""): "5449000009968",
    ("Fanta", "Orange"): "5449000016164",
    ("Schweppes", ""): "5449000100023",
    ("Red Bull", ""): "90162602",
    ("Pocari Sweat", ""): "4980055012207",
    ("Minute Maid", ""): "5000112185849",
    ("San Pellegrino", ""): "8002270018702",
    ("Perrier", ""): "3076820001098",
    ("Pringles", "Original"): "5053990101573",
    ("Pringles", "Sour"): "5053990101597",
    ("Cadbury", "Dairy"): "7622300120014",
    ("Ferrero", "Rocher"): "8000500359945",
    ("Lindt", "Excellence"): "3046920091435",
    ("Lindt", "Dark"): "3046920091435",
    ("M&M", ""): "5000159461122",
    ("Oreo", ""): "7622210652492",
    ("Arnott", "Tim"): "9300650658509",
    ("Nongshim", "Shin"): "8801043157742",
    ("Barilla", "Spaghetti"): "8076808153585",
    ("Kellogg", "Corn"): "5050083493706",
    ("Quaker", "Oatmeal"): "0030000318829",
    ("Kraft", "Singles"): "0021000623149",
    ("Philadelphia", ""): "7622200607341",
    ("Anchor", "Butter"): "9946000013224",
    ("Haagen-Dazs", "Vanilla"): "0074570690044",
    ("Haagen", "Vanilla"): "0074570690044",
    ("Nissin", "Demae"): "4897878100026",
    ("Lee Kum Kee", "Oyster"): "0078895120036",
    ("Ayam", "Tuna"): "9556023200026",
    ("Nestle", "Drumstick"): "7613035759855",
    ("Nestle", "Koko"): "9556001241849",
    ("Meiji", "Yoghurt"): "4902705089471",
    ("Meiji", "Milk"): "4902705089471",
    ("Dreyer", ""): "0041548750019",
    ("Calbee", "BBQ"): "4892294300135",
    ("Calbee", "Jagabee"): "4892294300302",
    ("Garden", "Lemon"): None,  # HK local, unlikely to have
}

SEARCH_FALLBACK = {
    "Coca Cola": "coca cola can",
    "Sprite": "sprite soda",
    "Fanta": "fanta orange",
    "Schweppes": "schweppes soda",
    "Red Bull": "red bull energy",
    "Pocari Sweat": "pocari sweat",
    "Minute Maid": "minute maid orange juice",
    "San Pellegrino": "san pellegrino water",
    "Perrier": "perrier water",
    "Pringles": "pringles chips",
    "Cadbury": "cadbury dairy milk chocolate",
    "Ferrero": "ferrero rocher",
    "Lindt": "lindt excellence dark",
    "M&M": "m&m peanut chocolate",
    "Oreo": "oreo cookies",
    "Nongshim": "nongshim shin ramyun",
    "Barilla": "barilla spaghetti",
    "Kellogg": "kelloggs corn flakes",
    "Quaker": "quaker oats oatmeal",
    "Kraft": "kraft singles cheese",
    "Philadelphia": "philadelphia cream cheese",
    "Anchor": "anchor butter",
    "Nestle": "nestle cereal",
    "Calbee": "calbee potato chips",
    "Lee Kum Kee": "lee kum kee oyster sauce",
    "Ayam": "ayam brand tuna",
    "Nissin": "nissin ramen",
}


def get_by_barcode(barcode):
    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}?fields=image_front_small_url,image_front_url"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "PoS-Demo/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read())
            p = data.get("product", {})
            return p.get("image_front_small_url") or p.get("image_front_url")
    except:
        return None


def get_by_search(query):
    encoded = urllib.parse.quote(query)
    url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={encoded}&search_simple=1&action=process&json=1&page_size=3&fields=image_front_small_url,image_front_url"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "PoS-Demo/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read())
            for p in data.get("products", []):
                img = p.get("image_front_small_url") or p.get("image_front_url")
                if img and img.startswith("http"):
                    return img
    except:
        return None
    return None


with open("src/data/seedData.json", "r") as f:
    data = json.load(f)

found = 0
for product in data["products"]:
    brand = product["brand"]
    name = product["name"] + " " + product["shortName"]
    img = None

    # Try barcode lookup
    for (b, partial), barcode in BRAND_BARCODES.items():
        if barcode and brand.lower().startswith(b.lower()) and partial.lower() in name.lower():
            img = get_by_barcode(barcode)
            if img:
                print(f"[BC OK] {product['shortName']}")
            break
    time.sleep(0.15)

    # Try search fallback
    if not img and brand in SEARCH_FALLBACK:
        img = get_by_search(SEARCH_FALLBACK[brand])
        if img:
            print(f"[SR OK] {product['shortName']}")
        time.sleep(0.2)

    if img:
        product["image"] = img
        found += 1
    else:
        product["image"] = None
        print(f"[NONE]  {product['shortName']}")

with open("src/data/seedData.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\nDone: {found}/{len(data['products'])} with images")
