import json

def get_keys(data, prefix=''):
    keys = {}
    if isinstance(data, dict):
        for k, v in data.items():
            new_prefix = f"{prefix}.{k}" if prefix else k
            keys.update(get_keys(v, new_prefix))
    else:
        keys[prefix] = data
    return keys

def compare_locales(source_path, target_path):
    with open(source_path, 'r', encoding='utf-8') as f:
        source = json.load(f)
    with open(target_path, 'r', encoding='utf-8') as f:
        target = json.load(f)
    
    source_keys = get_keys(source)
    target_keys = get_keys(target)
    
    missing = []
    placeholders = []
    
    for k, v in source_keys.items():
        if k not in target_keys:
            missing.append(k)
        elif target_keys[k] == v or target_keys[k] == "" or (isinstance(v, str) and k in target_keys and target_keys[k].lower() in [v.lower()]):
            # Very simple placeholder detection: identical to source or empty
             placeholders.append(k)
            
    return missing, placeholders

# Compare RU with KK
missing_kk, placeholders_kk = compare_locales(
    'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales/ru.json',
    'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales/kk.json'
)

# Compare RU with UZ
missing_uz, placeholders_uz = compare_locales(
    'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales/ru.json',
    'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales/uz.json'
)

print(f"KK: Missing {len(missing_kk)}, Placeholders {len(placeholders_kk)}")
print(f"UZ: Missing {len(missing_uz)}, Placeholders {len(placeholders_uz)}")

# Print first 20 missing for each for sampling
print("\nTop 20 Missing in KK:")
print(missing_kk[:20])

print("\nTop 20 Missing in UZ:")
print(missing_uz[:20])
