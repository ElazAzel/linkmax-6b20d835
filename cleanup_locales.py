import json
import os

def cleanup_json(filepath):
    print(f"Cleaning up {filepath}...")
    try:
        # We can't use standard json.load if there are duplicates and we want to control which one to keep
        # However, json.loads() usually keeps the LAST occurrence of a key.
        # In our case, the LAST occurrence is the correct V2 landing object.
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse - this will automatically resolve duplicates by keeping the last one
        data = json.loads(content)
        
        # Write back pretty-printed
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully cleaned {filepath}")
    except Exception as e:
        print(f"Error cleaning {filepath}: {e}")

# Target files
files = [
    r'c:\Users\i.azelkhanov\Documents\inkmax\src\i18n\locales\ru.json',
    r'c:\Users\i.azelkhanov\Documents\inkmax\src\i18n\locales\en.json'
]

for f in files:
    if os.path.exists(f):
        cleanup_json(f)
    else:
        print(f"File not found: {f}")
