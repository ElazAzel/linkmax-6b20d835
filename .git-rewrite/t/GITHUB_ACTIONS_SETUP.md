# GitHub Actions Deployment Setup

## 🔧 Setup Instructions

### 1. Add API Token to GitHub Secrets

Follow these steps to add the Cloudflare API token to your GitHub repository:

1. Go to your GitHub repository: https://github.com/ElazAzel/inkmax
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the following:
   - **Name:** `CLOUDFLARE_API_TOKEN`
   - **Value:** `T7pmsB-i1p59KXslYhlQoL8RIEoi4SJ3jvgm1J3h`
6. Click **Add secret**

### 2. Verify Configuration

Ensure `cloudflare-worker/wrangler.toml` has the correct account ID:
```toml
account_id = "9058b638459bffbf366813802933852b"
name = "lnkmx-prerender"
main = "prerender-worker.js"
```

### 3. Deploy via GitHub Actions

**Option A: Automatic Deployment**
- Simply push any code to the `main` branch
- The workflow `.github/workflows/deploy.yml` will automatically:
  1. Build the project
  2. Run TypeScript checks
  3. Deploy the Cloudflare Worker

**Option B: Manual Workflow Trigger**
1. Go to GitHub repo → **Actions**
2. Click **Build and Deploy** workflow
3. Click **Run workflow** → **Run workflow** button
4. Wait for the workflow to complete

### 4. Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click the latest workflow run
3. View logs for build and deployment steps
4. Check Cloudflare dashboard for deployed Worker

## 🔐 Security

- ✅ Token is stored securely in GitHub Secrets (encrypted)
- ✅ Token is never displayed in logs (masked by GitHub)
- ✅ Token is only used during workflow execution
- ✅ Only available to authorized workflows and manual trigger

## 🚀 Deployment Status

After adding the secret, the next push to `main` will automatically:

```
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (npm ci)
4. Build project (npm run build)
5. Deploy Cloudflare Worker (wrangler deploy)
```

## ⚠️ Troubleshooting

### Workflow Fails: "Authentication error [code: 10000]"
- **Cause:** Token permissions might be insufficient
- **Solution:** Verify token has "Workers — Edit" permission in Cloudflare dashboard

### Workflow Fails: "account_id does not match"
- **Cause:** `account_id` in `wrangler.toml` doesn't match the token's account
- **Solution:** Update `account_id` in `cloudflare-worker/wrangler.toml`

### Workflow Not Triggering
- **Cause:** Workflow file might not be on `main` branch
- **Solution:** Commit `.github/workflows/deploy.yml` to `main` and push

## 📝 Related Files

- Workflow definition: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- Cloudflare config: [cloudflare-worker/wrangler.toml](cloudflare-worker/wrangler.toml)
- Deployment checklist: [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)

---

**Setup is now complete!** 🎉

Your next `git push origin main` will trigger the automated deployment pipeline.
