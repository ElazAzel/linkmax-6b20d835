const fs = require('fs');
const path = "c:\\Users\\admin\\OneDrive - УО 'Алматы Менеджмент Университет'\\Документы\\inkmax\\src\\i18n\\locales\\kk.json";

try {
    const content = fs.readFileSync(path, 'utf8');
    const data = JSON.parse(content);

    // Ensure translation object exists
    if (!data.translation) {
        console.log("No translation object found!");
        process.exit(1);
    }

    const t = data.translation;
    const rootKeys = ['experts', 'themes', 'gallery', 'footer', 'pricing']; // keys to move from root to translation

    rootKeys.forEach(key => {
        if (data[key]) {
            console.log(`Processing root key: ${key}`);

            if (key === 'footer') {
                // Merge footer
                if (t.footer) {
                    console.log('Merging footer...');
                    Object.assign(t.footer, data.footer);
                } else {
                    t.footer = data.footer;
                }
            } else if (key === 'pricing') {
                // Special handling for pricing
                console.log('Merging pricing...');

                // Move tokens if present
                if (data.pricing.tokens) {
                    console.log('Moving tokens from pricing to translation root...');
                    t.tokens = data.pricing.tokens;
                    delete data.pricing.tokens;
                }

                if (t.pricing) {
                    // Merge pricing fields
                    for (const subKey in data.pricing) {
                        if (!t.pricing[subKey]) {
                            t.pricing[subKey] = data.pricing[subKey];
                        } else if (typeof t.pricing[subKey] === 'object' && typeof data.pricing[subKey] === 'object') {
                            Object.assign(t.pricing[subKey], data.pricing[subKey]);
                        }
                    }
                } else {
                    t.pricing = data.pricing;
                }
            } else {
                // Default move (experts, themes, gallery)
                // If it already exists, log it.
                if (t[key]) {
                    console.log(`Warning: ${key} already exists in translation. Overwriting/Merging...`);
                    if (typeof t[key] === 'object' && typeof data[key] === 'object') {
                        Object.assign(t[key], data[key]);
                    } else {
                        t[key] = data[key];
                    }
                } else {
                    t[key] = data[key];
                }
            }

            // Remove from root
            delete data[key];
        }
    });

    // Write back
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log("Successfully fixed kk.json");

} catch (e) {
    console.error("Error:", e);
}
