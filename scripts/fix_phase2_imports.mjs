import fs from 'fs';
import path from 'path';

// Mapping of filename (without extension) to its new subfolder
const HOOK_MAP = {
    // admin
    'useAdminAuth': 'admin', 'useAdminEvents': 'admin', 'useAdminPages': 'admin', 'useAdminStats': 'admin', 'useAdminTemplates': 'admin', 'useAdminUsers': 'admin', 'useAdminAnalytics': 'admin',
    // analytics
    'useAnalyticsTracking': 'analytics', 'useHeatmapData': 'analytics', 'useHeatmapTracking': 'analytics', 'usePageAnalytics': 'analytics', 'useFunnelAnalytics': 'analytics', 'useLandingAnalytics': 'analytics', 'useMarketingAnalytics': 'analytics', 'useWebVitals': 'analytics',
    // dashboard
    'useDashboard': 'dashboard', 'useDashboardAI': 'dashboard', 'useDashboardAuthGuard': 'dashboard', 'useDashboardOnboarding': 'dashboard', 'useDashboardSharing': 'dashboard', 'useDashboardUsername': 'dashboard', 'useDashboardV2': 'dashboard',
    // editor
    'useBlockEditor': 'editor', 'useBlockHints': 'editor', 'useBlockUndo': 'editor', 'useGridDragDrop': 'editor', 'useGridLayout': 'editor', 'useEditorHistory': 'editor',
    // page
    'useCloudPageState': 'page', 'usePageCache': 'page', 'usePageVersions': 'page', 'useMultiPage': 'page',
    // user
    'useAuth': 'user', 'useUserProfile': 'user', 'usePremiumStatus': 'user', 'useFreemiumLimits': 'user', 'useFriends': 'user', 'useStreak': 'user', 'useAchievements': 'user', 'useReferral': 'user', 'useTokens': 'user', 'useDailyQuests': 'user',
    // social
    'useCollaboration': 'social', 'useLeaderboard': 'social', 'useSocialFeatures': 'social', 'useGallery': 'social', 'useGalleryFilters': 'social',
    // crm
    'useLeads': 'crm',
    // ui
    'useSwipeGesture': 'ui', 'usePullToRefresh': 'ui', 'useHapticFeedback': 'ui', 'useSoundEffects': 'ui', 'use-toast': 'ui', 'use-mobile': 'ui',
};

const LIB_MAP = {
    // blocks
    'block-factory': 'blocks', 'block-recommendations': 'blocks', 'block-registry': 'blocks', 'block-spacing': 'blocks', 'block-styling': 'blocks', 'block-utils': 'blocks', 'block-validators': 'blocks',
    // export
    'excel-export': 'export', 'pdf-export': 'export',
    // utils
    'utils': 'utils', 'format': 'utils', 'url-helpers': 'utils', 'compression': 'utils', 'image-compression': 'utils', 'data-url-to-blob': 'utils', 'icon-utils': 'utils', 'logger': 'utils', 'sentry': 'utils', 'cache-utils': 'utils', 'calendar-utils': 'utils', 'upgrade-utils': 'utils',
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

        // Replace hook imports
        for (const [hookName, folder] of Object.entries(HOOK_MAP)) {
            const oldPath = `@/hooks/${hookName}`;
            const newPath = `@/hooks/${folder}/${hookName}`;
            newContent = newContent.replaceAll(`"${oldPath}"`, `"${newPath}"`);
            newContent = newContent.replaceAll(`'${oldPath}'`, `'${newPath}'`);
        }

        // Replace lib imports
        for (const [libName, folder] of Object.entries(LIB_MAP)) {
            const oldPath = `@/lib/${libName}`;
            const newPath = `@/lib/${folder}/${libName}`;
            newContent = newContent.replaceAll(`"${oldPath}"`, `"${newPath}"`);
            newContent = newContent.replaceAll(`'${oldPath}'`, `'${newPath}'`);
        }

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated imports in: ' + filePath);
        }
    }
});
