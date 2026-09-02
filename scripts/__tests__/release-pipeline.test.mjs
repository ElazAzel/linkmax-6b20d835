import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('release workflows have one staging path and one gated production path', () => {
  assert.equal(existsSync('.github/workflows/deploy-staging.yml'), true);
  assert.equal(existsSync('.github/workflows/release.yml'), true);
  assert.equal(existsSync('.github/workflows/deploy.yml'), false);
  assert.equal(existsSync('.github/workflows/deploy-cloudflare-worker.yml'), false);
  assert.equal(existsSync('.github/workflows/deploy-supabase.yml'), false);
});

test('production release deploys the database before functions and creates the GitHub release last', () => {
  const workflow = read('.github/workflows/release.yml');
  const dbPush = workflow.indexOf('supabase db push');
  const functionsDeploy = workflow.indexOf('supabase functions deploy');
  const cloudflareUpload = workflow.indexOf('versions upload');
  const cloudflareDeploy = workflow.indexOf('versions deploy');
  const githubRelease = workflow.indexOf('gh release create');

  for (const [name, position] of Object.entries({ dbPush, functionsDeploy, cloudflareUpload, cloudflareDeploy, githubRelease })) {
    assert.notEqual(position, -1, `${name} step must exist`);
  }

  assert.ok(dbPush < functionsDeploy, 'database migrations must precede function deployment');
  assert.ok(cloudflareUpload < cloudflareDeploy, 'Cloudflare version must be previewed before promotion');
  assert.ok(cloudflareDeploy < githubRelease, 'GitHub Release must be created only after production promotion');
  assert.match(workflow, /environment:\s*production/);
  assert.match(workflow, /x-deployment-id/i, 'Lovable mirror ID must be verified against its preview response');
});

test('CI actions are commit pinned and quality excludes generated worktrees and native builds', () => {
  const workflows = [
    read('.github/workflows/ci.yml'),
    read('.github/workflows/deploy-staging.yml'),
    read('.github/workflows/release.yml'),
  ].join('\n');

  assert.doesNotMatch(workflows, /uses:\s*[^\s]+@(v\d+|main|master|latest)\b/);
  const eslintConfig = read('eslint.config.js');
  assert.match(eslintConfig, /\.worktrees\/\*\*/);
  assert.match(eslintConfig, /android\/\*\*\/build\/\*\*/);
});

test('npm is the single locked package manager used by CI and release builds', () => {
  assert.equal(existsSync('package-lock.json'), true);
  assert.equal(existsSync('bun.lock'), false);
  assert.equal(existsSync('bun.lockb'), false);
  assert.equal(existsSync('yarn.lock'), false);
  assert.equal(existsSync('pnpm-lock.yaml'), false);
});

test('generated release inputs are deterministic and portable', () => {
  const sitemapGenerator = read('scripts/generate-sitemap.mjs');
  const mcpGenerator = read('scripts/generate-mcp.mjs');
  const generatedMcp = read('supabase/functions/mcp/index.ts');
  const serializedMcpEnv = generatedMcp.match(/define_import_meta_env_default\s*=\s*\{[^\n]+/)?.[0] ?? '';
  const iosPackage = read('ios/App/CapApp-SPM/Package.swift');

  assert.match(sitemapGenerator, /order=updated_at\.desc\.nullslast,slug\.asc/);
  assert.match(mcpGenerator, /VITE_SUPABASE_PROJECT_ID/);
  assert.doesNotMatch(serializedMcpEnv, /VITE_(?:SUPABASE_(?:PUBLISHABLE|ANON)_KEY|PAYMENTS_CLIENT_TOKEN)/);
  assert.doesNotMatch(serializedMcpEnv, /eyJ[A-Za-z0-9_-]+\.|live_[A-Za-z0-9_-]+/);
  assert.doesNotMatch(iosPackage, /path:\s*"[^"\n]*\\/);
  assert.match(iosPackage, /CapacitorPushNotifications/);
});

test('every configured Supabase function exists in the repository', () => {
  const config = read('supabase/config.toml');
  const configuredFunctions = [...config.matchAll(/^\[functions\.([^\]]+)\]$/gm)]
    .map((match) => match[1]);

  for (const functionName of configuredFunctions) {
    assert.equal(
      existsSync(`supabase/functions/${functionName}/index.ts`),
      true,
      `supabase/config.toml references missing function ${functionName}`,
    );
  }
});

test('SQL migrations are UTF-8 text without NUL bytes', () => {
  const migrations = readdirSync('supabase/migrations')
    .filter((name) => name.endsWith('.sql'));

  for (const migration of migrations) {
    const bytes = readFileSync(`supabase/migrations/${migration}`);
    const sql = bytes.toString('utf8');
    assert.equal(bytes.includes(0), false, `${migration} contains NUL bytes`);
    assert.equal(
      bytes.subarray(0, 2).equals(Buffer.from([0xff, 0xfe]))
        || bytes.subarray(0, 2).equals(Buffer.from([0xfe, 0xff])),
      false,
      `${migration} is UTF-16`,
    );
    assert.doesNotMatch(sql, /public\.(?:users|admin_users)\b/, `${migration} references a removed admin table`);
  }
});

test('SQL migrations do not recreate an existing RLS policy', () => {
  const activePolicies = new Map();
  const migrations = readdirSync('supabase/migrations')
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();
  const policyStatement = /DROP\s+POLICY(?:\s+IF\s+EXISTS)?\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_."]+)|CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_."]+)/gis;

  for (const migration of migrations) {
    const sql = read(`supabase/migrations/${migration}`);
    for (const match of sql.matchAll(policyStatement)) {
      const isDrop = Boolean(match[1]);
      const policyName = isDrop ? match[1] : match[3];
      const tableName = (isDrop ? match[2] : match[4]).replaceAll('"', '').toLowerCase();
      const policyKey = `${tableName}|${policyName}`;

      if (isDrop) {
        activePolicies.delete(policyKey);
      } else {
        assert.equal(
          activePolicies.has(policyKey),
          false,
          `${migration} recreates policy ${policyKey} from ${activePolicies.get(policyKey)}`,
        );
        activePolicies.set(policyKey, migration);
      }
    }
  }
});

test('release version is coherent across web, Android, and iOS', () => {
  const pkg = JSON.parse(read('package.json'));
  const android = read('android/app/build.gradle');
  const ios = read('ios/App/App.xcodeproj/project.pbxproj');

  assert.equal(pkg.version, '3.1.1');
  assert.match(android, /versionCode\s+30101/);
  assert.match(android, /versionName\s+"3\.1\.1"/);
  assert.match(ios, /MARKETING_VERSION = 3\.1\.1;/);
  assert.match(ios, /CURRENT_PROJECT_VERSION = 30101;/);
});
