const fs = require('fs');
const path = require('path');

const TARGET_KEYS = [
  'analytics', 'notifications', 'products', 'automations', 'calendar', 
  'contacts', 'dashboard', 'documents', 'events', 'inbox', 
  'invites', 'invoices', 'nav', 'plans', 'search', 'settings', 'chat', 'crm'
];

const LOCALES_DIR = 'src/i18n/locales';
const FILES = ['ru.json', 'kk.json', 'uz.json'];

FILES.forEach(file => {
  const filePath = path.join(LOCALES_DIR, file);
  if (!fs.existsSync(filePath)) return;

  console.log(`Processing ${file}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  let data;
  
  try {
    data = JSON.parse(content);
  } catch (e) {
    console.error(`Error parsing ${file}: ${e.message}`);
    return;
  }

  // Determine the root for keys and remove 'translation' wrapper in kk.json if present
  let root = data;
  if (data.translation && typeof data.translation === 'object') {
    root = data.translation;
    console.log(`  Removing "translation" wrapper from ${file}`);
  }

  // Ensure 'zones' exists as an object
  if (!root.zones) root.zones = {};

  // Migrate target keys from root to zones
  TARGET_KEYS.forEach(key => {
    if (root[key] && key !== 'zones') {
      console.log(`  Moving "${key}" to root.zones["${key}"]`);
      root.zones[key] = root[key];
      delete root[key];
    }
  });

  // Specifically check for 'fintech' key (common in RU/KK) and map it to 'invoices' if needed
  if (root.fintech && !root.zones.invoices) {
    console.log(`  Mapping "fintech" to root.zones["invoices"]`);
    root.zones.invoices = root.fintech;
    delete root.fintech;
  }

  // Sort keys alphabetically for better git diffs and long-term maintenance
  const sortedRoot = {};
  Object.keys(root).sort().forEach(key => {
    sortedRoot[key] = root[key];
  });

  // Write sorted JSON back to the file
  fs.writeFileSync(filePath, JSON.stringify(sortedRoot, null, 2), 'utf8');
  console.log(`Successfully refactored ${file}`);
});
