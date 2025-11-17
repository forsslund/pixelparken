# 🚀 Pixelparken Deployment Guide

This guide walks you through deploying both the frontend and backend to Google App Engine.

## Prerequisites

Before you begin, ensure you have:

1. ✅ **Google Cloud Account** - Already set up with project `pixelparken`
2. ✅ **Google Cloud SDK (gcloud)** - Install from: https://cloud.google.com/sdk/docs/install
3. ✅ **Node.js 20+** - Check with `node --version`
4. ✅ **npm** - Check with `npm --version`

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│    Google App Engine (Node.js 20)       │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │   Express Backend (Port 8080)      │ │
│  │                                    │ │
│  │   API Routes:                      │ │
│  │   - /api/users                     │ │
│  │   - /api/progress                  │ │
│  │   - /api/guestbook                 │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │   Static Frontend (Vite build)     │ │
│  │   Served from /dist/public/        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
           │
           ├─ Firestore Database
           │  (User data, progress, guestbook)
           │
           └─ Auto-scales based on traffic
```

## 📦 Setup Steps

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project pixelparken

# Initialize App Engine (first time only)
gcloud app create --region=europe-west1
# Choose a region close to your users (europe-west1 for EU)

# Enable required APIs
gcloud services enable firestore.googleapis.com
gcloud services enable appengine.googleapis.com
```

### 3. Set Up Firestore Database

1. Go to https://console.cloud.google.com/firestore
2. Select your project: `pixelparken`
3. Click "Create Database"
4. Choose **Native Mode** (not Datastore mode)
5. Select the same region as your App Engine (e.g., `europe-west1`)
6. Start in **Production Mode** (or Test Mode for development)

**Collections Created Automatically:**
- `users` - User profiles with avatars
- `progress` - Game progress for each user
- `guestbook` - Guestbook entries

### 4. Test Locally (Optional but Recommended)

```bash
# Terminal 1: Start backend (with Firestore emulator or real Firestore)
cd backend
npm run dev

# Terminal 2: Start frontend dev server
npm run dev
```

Visit http://localhost:3000 to test the application.

**Note:** Local development will use the real Firestore database. To use the Firestore emulator, install it with:
```bash
gcloud components install cloud-firestore-emulator
firebase init emulators
```

## 🚀 Deployment

### Quick Deploy (Recommended)

```bash
# Make the script executable (first time only)
chmod +x build-and-deploy.sh

# Run the deployment script
./build-and-deploy.sh
```

This script will:
1. ✅ Build the frontend
2. ✅ Copy frontend to backend/dist/public
3. ✅ Build the backend TypeScript
4. ✅ Copy app.yaml config
5. ✅ Deploy to App Engine

### Manual Deploy (Step by Step)

If you prefer to do it manually:

```bash
# 1. Build frontend
npm run build

# 2. Copy frontend build to backend
rm -rf backend/dist/public
mkdir -p backend/dist/public
cp -r dist/* backend/dist/public/

# 3. Build backend
cd backend
npm run build

# 4. Copy app.yaml
cp app.yaml dist/

# 5. Deploy
cd dist
gcloud app deploy --quiet
```

## 🌐 Access Your App

After deployment completes (usually 3-5 minutes):

- **Main URL:** https://pixelparken.appspot.com
- **Alternative:** https://pixelparken.ey.r.appspot.com

You can also check the deployment status:
```bash
gcloud app browse
```

## 🔍 Monitoring & Logs

### View Application Logs
```bash
# Tail logs in real-time
gcloud app logs tail

# View logs in browser
gcloud app logs read
```

### View in Google Cloud Console
1. Go to https://console.cloud.google.com/appengine
2. Click on "Versions" to see deployed versions
3. Click on "Logs" to see application logs
4. Click on "Services" to see performance metrics

### View Firestore Data
1. Go to https://console.cloud.google.com/firestore
2. Browse collections: `users`, `progress`, `guestbook`

## ⚙️ Configuration

### Environment Variables

Edit `backend/app.yaml` to add environment variables:

```yaml
env_variables:
  NODE_ENV: 'production'
  # Add more variables here
```

### Scaling Configuration

The default `app.yaml` uses automatic scaling:

```yaml
automatic_scaling:
  min_instances: 0  # Scale to zero when idle (saves money)
  max_instances: 10 # Max concurrent instances
  target_cpu_utilization: 0.65
```

**Cost optimization:**
- `min_instances: 0` - App sleeps when idle (free tier friendly)
- First request after sleep takes ~5-10 seconds (cold start)

**Performance optimization:**
- `min_instances: 1` - App always ready (costs more, faster response)

### Update Backend Configuration

After changing `backend/app.yaml`, redeploy:
```bash
./build-and-deploy.sh
```

## 🔒 Security Considerations

### Firestore Security Rules

Set up security rules in Firestore console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read any user, but only update their own avatar
    match /users/{userId} {
      allow read: if true;
      allow create: if true;
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['avatar']);
    }

    // Progress can only be written by users for themselves
    match /progress/{progressId} {
      allow read: if true;
      allow create: if true;
      allow update: if request.resource.data.userId == resource.data.userId;
    }

    // Guestbook is public (read/write by anyone)
    match /guestbook/{entryId} {
      allow read: if true;
      allow create: if true;
    }
  }
}
```

### Content Security Policy

The backend includes Helmet.js for security headers. Edit `backend/src/index.ts` to customize.

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install
```

### Deployment Fails

```bash
# Check you're logged in
gcloud auth list

# Check your project is set
gcloud config get-value project

# Ensure App Engine is enabled
gcloud services enable appengine.googleapis.com
```

### App Doesn't Load

1. Check logs: `gcloud app logs tail`
2. Verify deployment: `gcloud app describe`
3. Check Firestore is enabled and in Native mode

### 502 Bad Gateway

- Backend crashed on startup
- Check logs: `gcloud app logs tail`
- Common cause: Firestore not initialized or wrong mode

### Database Connection Errors

- Ensure Firestore is created in **Native Mode**
- Verify the project ID matches in `backend/src/services/firestore.ts`
- Check IAM permissions for App Engine service account

## 💰 Cost Estimation

Google Cloud offers a **generous free tier** for App Engine and Firestore:

### Free Tier Limits (per day):
- **App Engine:** 28 instance hours/day
- **Firestore:**
  - 50,000 reads
  - 20,000 writes
  - 20,000 deletes
  - 1 GB storage

**For Pixelparken:** With moderate use (50-100 daily users), you'll likely stay within free tier limits.

### Monitor Costs
Check costs at: https://console.cloud.google.com/billing

## 🔄 Update & Redeploy

To deploy new changes:

```bash
# 1. Make your code changes
# 2. Test locally
npm run dev

# 3. Deploy
./build-and-deploy.sh
```

## 📚 Additional Resources

- [App Engine Documentation](https://cloud.google.com/appengine/docs)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)
- [Node.js on App Engine](https://cloud.google.com/appengine/docs/standard/nodejs)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference)

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Frontend builds without errors (`npm run build`)
- [ ] Backend builds without errors (`cd backend && npm run build`)
- [ ] Firestore is set up in Native mode
- [ ] App Engine is initialized (`gcloud app describe`)
- [ ] Security rules are configured in Firestore
- [ ] `app.yaml` scaling settings are appropriate
- [ ] Test the app locally
- [ ] Deploy using `./build-and-deploy.sh`
- [ ] Verify deployment at https://pixelparken.appspot.com
- [ ] Test user registration, games, and guestbook
- [ ] Check logs for any errors
- [ ] Monitor costs in Cloud Console

---

**Need Help?**

- Check logs: `gcloud app logs tail`
- View deployment status: `gcloud app describe`
- Community support: [Stack Overflow - google-app-engine](https://stackoverflow.com/questions/tagged/google-app-engine)

Good luck! 🎮🚀
