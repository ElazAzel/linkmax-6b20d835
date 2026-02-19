import fs from 'fs';
import path from 'path';

const REPLACEMENTS = {
    '@/components/AIGenerator': '@/components/editor/AIGenerator',
    '@/components/BlockEditor': '@/components/editor/BlockEditor',
    '@/components/BlockEditorV2': '@/components/editor/BlockEditorV2',
    '@/components/BlockErrorBoundary': '@/components/editor/BlockErrorBoundary',
    '@/components/BlockRenderer': '@/components/editor/BlockRenderer',
    '@/components/DraggableBlockList': '@/components/editor/DraggableBlockList',
    '@/components/ChatbotWidget': '@/components/chat/ChatbotWidget',
    '@/components/CookieConsent': '@/components/legal/CookieConsent',
    '@/components/TurnstileWidget': '@/components/legal/TurnstileWidget',
    '@/components/LanguageSwitcher': '@/components/translation/LanguageSwitcher',
    '@/components/SEOHead': '@/components/seo/SEOHead',
    '@/components/InstallPromptDialog': '@/components/pwa/InstallPromptDialog',
    '@/components/PWAInstallPrompt': '@/components/pwa/PWAInstallPrompt',
    '@/components/PWAUpdatePrompt': '@/components/pwa/PWAUpdatePrompt',
    '@/components/TierBadge': '@/components/billing/TierBadge',
    '@/components/PremiumFeatureGate': '@/components/billing/PremiumFeatureGate',
    '@/components/FreemiumAILimit': '@/components/billing/FreemiumAILimit',
    '@/components/FreemiumBlockLimit': '@/components/billing/FreemiumBlockLimit',
    '@/components/FreemiumWatermark': '@/components/billing/FreemiumWatermark',
    '@/components/NavLink': '@/components/layout/NavLink',
    '@/components/LocalStorageMigration': '@/components/layout/LocalStorageMigration'
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src', function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        // Also replace relative imports if we were in the root of components
        // for example from "./AIGenerator"

        for (const [oldPath, newPath] of Object.entries(REPLACEMENTS)) {
            // Replace absolute @/components paths
            newContent = newContent.replaceAll(`"${oldPath}"`, `"${newPath}"`);
            newContent = newContent.replaceAll(`'${oldPath}'`, `'${newPath}'`);

            const filePart = oldPath.split('/').pop();
            const newRelative = newPath.replace('@/components/', '../');

            // If the file is inside a subdirectory of components, they might have imported as ../AIGenerator
            newContent = newContent.replaceAll(`"../${filePart}"`, `"${newPath.replace('@/components/', '../../')}"`);
            newContent = newContent.replaceAll(`'../${filePart}'`, `'${newPath.replace('@/components/', '../../')}'`);

            // If the file is inside components root
            // Oops, since the file itself is moved, we also need to fix its OWN internal imports 
            // where it was importing other components.
            // But we just moved them, so now they are in a subfolder and need to use @/components/ or relative.
            // Easiest is to just fix the global @/components/ imports first.
            // And we handle `"./AIGenerator"` -> `"../editor/AIGenerator"` if inside another component
            // Actually we'll just fix @/components/ first and run tsc to see what's broken.
        }

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});
