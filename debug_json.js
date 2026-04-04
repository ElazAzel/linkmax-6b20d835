const fs = require('fs');
try {
    const content = fs.readFileSync('src/i18n/locales/en.json', 'utf8');
    JSON.parse(content);
    console.log('en.json is valid');
} catch (e) {
    const msg = e.message;
    console.error('Error in en.json:', msg);
    // Find the position if possible
    if (e.at) {
        console.error('At position:', e.at);
    }
    // Write to a file since I can't see stderr easily if run_command fails
    fs.writeFileSync('json_error.txt', msg + '\n' + content.substring(Math.max(0, e.pos - 50), e.pos + 50));
}
