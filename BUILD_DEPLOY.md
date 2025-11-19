# Build & Deployment Guide

This guide covers building and deploying Pixelparken to Google App Engine.

## Prerequisites

### Node.js
- **Node 20.x** (required for both development and production)
- Check version: `node --version`

### Google Cloud SDK (gcloud)
Required for deployment to Google App Engine.

#### Install gcloud CLI
```bash
# Linux/macOS
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Or use package manager
# Ubuntu/Debian: apt-get install google-cloud-cli
# macOS: brew install google-cloud-sdk
```

#### Initialize gcloud
First time setup:

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project pixelparken

# Set default region (optional)
gcloud config set compute/region europe-west1

# Verify configuration
gcloud config list
```

#### Enable Required APIs
```bash
# Enable App Engine Admin API
gcloud services enable appengine.googleapis.com

# Enable Cloud Build API (for deployments)
gcloud services enable cloudbuild.googleapis.com

# Enable Firestore API (for database)
gcloud services enable firestore.googleapis.com
```

#### Create App Engine Application (First Time Only)
```bash
# Create App Engine app in your project
gcloud app create --region=europe-west

# Verify it was created
gcloud app describe
```

---

## Build Process

### Frontend Build
Builds the Phaser games and launcher UI using Vite.

```bash
npm run build
```

**Output:** `/dist/` directory containing:
- `index.html` - Launcher page
- `assets/` - Bundled JS and CSS
- `games/` - Individual game HTML files
- `icons/` - Favicons and app icons
- `shared-assets/` - Shared game assets (images, sounds)

### Backend Build
Compiles TypeScript backend and prepares for deployment.

```bash
npm run backend:build
```

**Output:** `backend/dist/` directory containing:
- `index.js` - Compiled Express server
- `public/` - Frontend build (copied from `/dist/`)
- `package.json` - Production dependencies only
- `app.yaml` - App Engine configuration
- `models/`, `routes/`, `services/` - Compiled backend code

---

## Deployment

### Full Deployment (Recommended)
Builds frontend, backend, and deploys to App Engine:

```bash
npm run deploy
```

This command:
1. Builds frontend with Vite
2. Copies frontend to backend/dist/public/
3. Compiles backend TypeScript
4. Copies production configs (package.prod.json → package.json, app.prod.yaml → app.yaml)
5. Deploys to Google App Engine

**Deployment process:**
- gcloud will show deployment summary
- Type `Y` to confirm
- Deployment takes ~2-5 minutes
- Your app will be live at: `https://pixelparken.ew.r.appspot.com`

### Backend-Only Deployment
If you only changed backend code (no frontend changes):

```bash
cd backend
npm run deploy
```

**Note:** This assumes frontend was already built. If not, run `npm run build` from root first.

---

## Deployment Configuration

### Production Files

#### `backend/package.prod.json`
Lightweight package.json for production (no devDependencies):
- Only includes runtime dependencies: express, cors, helmet, @google-cloud/firestore
- Specifies Node 20 engine
- Entry point: `"main": "index.js"`
- Start command: `"start": "node index.js"`

#### `backend/app.prod.yaml`
App Engine configuration for production:
- Runtime: `nodejs20`
- Environment: `NODE_ENV: 'production'`
- Auto-scaling: 0-10 instances
- Static file handlers for `/assets`, `/games`, `/icons`, `/shared-assets`
- API routing for `/api/*`
- SPA fallback for all other routes

### Build Scripts

**Root package.json:**
```json
{
  "deploy": "npm run build && cd backend && npm run deploy"
}
```

**Backend package.json:**
```json
{
  "build": "mkdir -p dist/public && cp -r ../dist/* dist/public/ 2>/dev/null || true && tsc && cp package.prod.json dist/package.json && cp app.prod.yaml dist/app.yaml",
  "deploy": "npm run build && cd dist && gcloud app deploy"
}
```

---

## Verification

### Check Deployment Status
```bash
# View current app versions
gcloud app versions list

# View app details
gcloud app describe

# Open app in browser
gcloud app browse
```

### Check Logs
```bash
# Tail logs in real-time
gcloud app logs tail -s default

# Read recent logs
gcloud logging read "resource.type=gae_app" --limit=50

# Read error logs only
gcloud logging read "resource.type=gae_app AND severity>=ERROR" --limit=20
```

### Test Endpoints
```bash
# Health check
curl https://pixelparken.ew.r.appspot.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## Troubleshooting

### Build Fails

**Problem:** TypeScript compilation errors
```bash
# Check types locally
npm run type-check
cd backend && tsc --noEmit
```

**Problem:** Frontend build fails
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### Deployment Fails

**Problem:** Authentication error
```bash
# Re-authenticate
gcloud auth login
gcloud auth application-default login
```

**Problem:** Permission denied
```bash
# Verify you have App Engine Admin role
gcloud projects get-iam-policy pixelparken --flatten="bindings[].members" --filter="bindings.members:$(gcloud config get-value account)"
```

**Problem:** App Engine not initialized
```bash
# Create App Engine app
gcloud app create --region=europe-west
```

### Runtime Errors

**Problem:** 404 on static files
- Check `backend/dist/public/` has frontend files
- Verify `app.yaml` static handlers point to `public/` (not `dist/public/`)

**Problem:** Server won't start
```bash
# Check logs
gcloud app logs tail -s default

# Common issues:
# - Missing package.json in dist/
# - Wrong entry point in package.json
# - Missing dependencies
```

**Problem:** Firestore connection fails
```bash
# Verify Firestore is enabled
gcloud services list --enabled | grep firestore

# Enable if needed
gcloud services enable firestore.googleapis.com
```

---

## Development vs Production

### Development
```bash
# Frontend dev server (hot reload)
npm run dev

# Backend dev server (hot reload with tsx)
npm run backend:dev
```

### Production
```bash
# Build & deploy
npm run deploy

# Check it's running
curl https://pixelparken.ew.r.appspot.com/api/health
```

---

## Rollback

If deployment breaks production:

```bash
# List versions
gcloud app versions list

# Route traffic to previous version
gcloud app services set-traffic default --splits=PREVIOUS_VERSION=1

# Example:
gcloud app services set-traffic default --splits=20251119t200347=1
```

---

## Cost Optimization

**Current settings (app.prod.yaml):**
- `min_instances: 0` - Scales to zero when idle (free tier eligible)
- `max_instances: 10` - Prevents runaway costs
- `target_cpu_utilization: 0.65` - Efficient resource usage

**Free tier limits:**
- 28 instance hours/day
- 1 GB egress/day
- 5 GB Cloud Storage

---

## Quick Reference

```bash
# Full deployment
npm run deploy

# Build only
npm run build
npm run backend:build

# Check logs
gcloud app logs tail -s default

# Check status
gcloud app versions list

# Open in browser
gcloud app browse

# Rollback
gcloud app services set-traffic default --splits=PREVIOUS_VERSION=1
```

---

## Additional Resources

- [App Engine Node.js Documentation](https://cloud.google.com/appengine/docs/standard/nodejs)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference)
- [App Engine Pricing](https://cloud.google.com/appengine/pricing)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)
