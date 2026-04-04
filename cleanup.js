const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'src/i18n/locales/en.json'),
  path.join(__dirname, 'src/i18n/locales/ru.json')
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    return;
  }
  try {
    const content = fs.readFileSync(file, 'utf8');
    // JSON.parse naturally deduplicates keys by keeping the last one.
    const data = JSON.parse(content);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), { encoding: 'utf8' });
    console.log(`Successfully cleaned ${file}`);
  } catch (e) {
    console.error(`Error cleaning ${file}: ${e.message}`);
    // If it fails, we need manual fix for syntax.
  }
});
