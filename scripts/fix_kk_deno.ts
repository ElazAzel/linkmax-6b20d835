const path = "c:\\Users\\admin\\OneDrive - УО 'Алматы Менеджмент Университет'\\Документы\\inkmax\\src\\i18n\\locales\\kk.json";

try {
    const content = await Deno.readTextFile(path);
    const data = JSON.parse(content);

    // Ensure translation object exists
    if (!data.translation) {
        console.log("No translation object found!");
        Deno.exit(1);
    }

    const t = data.translation;
    const rootKeys = ['experts', 'themes', 'gallery', 'footer', 'pricing', 'seo', 'pwa', 'teams', 'friends', 'gift', 'telegram', 'product', 'paidContent', 'adminVerification', 'collab', 'rewards', 'onboarding', 'landing', 'blocks', 'auth', 'common', 'errors', 'form', 'newsletter', 'success', 'actions', 'profile', 'verification', 'frames', 'nameAnimation', 'profileEditor', 'blockTypes', 'recommendations', 'settings', 'niche', 'niches'];
    // Added more keys that might be at root. Based on previous inspections, specifically 'experts', 'themes', 'gallery', 'footer', 'pricing' were seen at root.

    // We should also check for duplicates INSIDE translation object that usually cause linter errors.
    // However, JSON.parse behaves by taking the LAST occurrence of a duplicate key.
    // So simply parsing and stringifying removes duplicates automatically!
    // The main task is to move misplaced root keys into translation object.

    // Specific root keys we saw in the file view:
    const keysToMove = ['experts', 'themes', 'gallery', 'footer', 'pricing'];

    for (const key of keysToMove) {
        if (data[key]) {
            console.log(`Processing root key: ${key}`);

            if (!t[key]) {
                t[key] = data[key];
            } else {
                // Merge if exists
                console.log(`Merging ${key} into translation.${key}`);
                if (typeof t[key] === 'object' && typeof data[key] === 'object') {
                    Object.assign(t[key], data[key]);
                }
            }
            delete data[key];
        }
    }

    // Write back
    await Deno.writeTextFile(path, JSON.stringify(data, null, 2));
    console.log("Successfully fixed kk.json structure and removed syntax duplicates via parse/stringify");

} catch (e) {
    console.error("Error:", e);
}
