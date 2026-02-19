import fs from 'fs';
import path from 'path';

const HOOK_MAP = {
    'useAdminAuth': 'admin', 'useAdminEvents': 'admin', 'useAdminPages': 'admin', 'useAdminStats': 'admin', 'useAdminTemplates': 'admin', 'useAdminUsers': 'admin', 'useAdminAnalytics': 'admin',
    'useAnalyticsTracking': 'analytics', 'useHeatmapData': 'analytics', 'useHeatmapTracking': 'analytics', 'usePageAnalytics': 'analytics', 'useFunnelAnalytics': 'analytics', 'useLandingAnalytics': 'analytics', 'useMarketingAnalytics': 'analytics', 'useWebVitals': 'analytics',
    'useDashboard': 'dashboard', 'useDashboardAI': 'dashboard', 'useDashboardAuthGuard': 'dashboard', 'useDashboardOnboarding': 'dashboard', 'useDashboardSharing': 'dashboard', 'useDashboardUsername': 'dashboard', 'useDashboardV2': 'dashboard',
    'useBlockEditor': 'editor', 'useBlockHints': 'editor', 'useBlockUndo': 'editor', 'useGridDragDrop': 'editor', 'useGridLayout': 'editor', 'useEditorHistory': 'editor',
    'useCloudPageState': 'page', 'usePageCache': 'page', 'usePageVersions': 'page', 'useMultiPage': 'page',
    'useAuth': 'user', 'useUserProfile': 'user', 'usePremiumStatus': 'user', 'useFreemiumLimits': 'user', 'useFriends': 'user', 'useStreak': 'user', 'useAchievements': 'user', 'useReferral': 'user', 'useTokens': 'user', 'useDailyQuests': 'user',
    'useCollaboration': 'social', 'useLeaderboard': 'social', 'useSocialFeatures': 'social', 'useGallery': 'social', 'useGalleryFilters': 'social',
    'useLeads': 'crm',
    'useSwipeGesture': 'ui', 'usePullToRefresh': 'ui', 'useHapticFeedback': 'ui', 'useSoundEffects': 'ui', 'use-toast': 'ui', 'use-mobile': 'ui',
};

const LIB_MAP = {
    'block-factory': 'blocks', 'block-recommendations': 'blocks', 'block-registry': 'blocks', 'block-spacing': 'blocks', 'block-styling': 'blocks', 'block-utils': 'blocks', 'block-validators': 'blocks',
    'excel-export': 'export', 'pdf-export': 'export',
    'utils': 'utils', 'format': 'utils', 'url-helpers': 'utils', 'compression': 'utils', 'image-compression': 'utils', 'data-url-to-blob': 'utils', 'icon-utils': 'utils', 'logger': 'utils', 'sentry': 'utils', 'cache-utils': 'utils', 'calendar-utils': 'utils', 'upgrade-utils': 'utils',
};

// We also need to find imports that are relative and turn them into alias if they match.
// e.g. import { ... } from './useSoundEffects' inside src/hooks/dashboard/useDashboard.ts
// It resolves to src/hooks/dashboard/useSoundEffects, but the file is actually in src/hooks/ui
// OR maybe the import was originally './useSoundEffects' when both were in src/hooks/, so it resolves to src/hooks/useSoundEffects.

function fixFile(filePath, basePath, typeMap, prefix) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Regex to match relative imports: from './fileName' or from '../fileName'
    const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;

    newContent = newContent.replace(importRegex, (match, relPath) => {
        // If the relPath ends up pointing to one of our mapped files...
        // The relative path was originally written assuming flat structure (both were in src/hooks/).
        // But since the file moved to src/hooks/admin/, a path like './useAuth' now means src/hooks/admin/useAuth.
        // The ORIGINAL intent was to point to the file that was called 'useAuth'.
        // We can just extract the basename of the import, see if it's in our map!
        const basename = path.basename(relPath).replace(/\.(ts|tsx)$/, '');

        // Check hooks
        if (HOOK_MAP[basename]) {
            return `from '@/hooks/${HOOK_MAP[basename]}/${basename}'`;
        }
        // Check libs
        if (LIB_MAP[basename]) {
            return `from '@/lib/${LIB_MAP[basename]}/${basename}'`;
        }

        // Otherwise keep as is
        return match;
    });

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated relative imports in ${filePath}`);
    }
}

function processDirectory(dir) {
    fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
            fixFile(fullPath, dir);
        }
    });
}

// Also process src/main.tsx and others that might have relative imports pointing to lib
function processAllSources(dir) {
    fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            processAllSources(fullPath);
        } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
            fixFile(fullPath, dir);
        }
    });
}

processAllSources(path.join(process.cwd(), 'src'));
