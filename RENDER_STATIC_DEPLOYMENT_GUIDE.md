# Complete Guide: Deploying Clinic Website & Admin Panel on Render Static Web App

This guide walks you through deploying the clinic website and admin panel on Render's static web app service from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Step 1: Prepare Your Repository](#step-1-prepare-your-repository)
4. [Step 2: Create Render Account](#step-2-create-render-account)
5. [Step 3: Create Static Web Service](#step-3-create-static-web-service)
6. [Step 4: Configure Deployment Settings](#step-4-configure-deployment-settings)
7. [Step 5: Verify Configuration Files](#step-5-verify-configuration-files)
8. [Step 6: Deploy](#step-6-deploy)
9. [Step 7: Test Deployment](#step-7-test-deployment)
10. [Step 8: Access Admin Panel](#step-8-access-admin-panel)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance](#maintenance)

---

## Prerequisites

Before starting, ensure you have:

- ✅ A GitHub account
- ✅ Your code pushed to a GitHub repository
- ✅ A Render account (free tier works)
- ✅ Azure backend deployed and accessible (for admin panel API)
- ✅ Azure backend URL: `https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net`

---

## Pre-Deployment Checklist

Verify these files exist in your repository:

- [ ] `index.html` (main homepage)
- [ ] `admin/index.html` (admin panel)
- [ ] `admin/admin.js` (admin panel logic)
- [ ] `admin/admin.css` (admin panel styles)
- [ ] `config.js` (API configuration - should have Azure URL)
- [ ] `assets/css/styles.css` (main stylesheet)
- [ ] `assets/js/content.js` (content loading)
- [ ] `assets/js/layout.js` (header/footer)
- [ ] `render.yaml` (optional, for configuration)

---

## Step 1: Prepare Your Repository

### 1.1 Verify File Structure

Your repository should have this structure:

```
clinic_system1/
├── index.html
├── config.js                    ← API configuration
├── admin/
│   ├── index.html
│   ├── admin.js
│   ├── admin.css
│   └── test-connection.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── content.js
│       └── layout.js
├── data/
│   └── *.json
└── render.yaml                  ← Optional
```

### 1.2 Verify config.js

Ensure `config.js` exists at the root and contains:

```javascript
// Configuration file for API endpoints
window.__CONFIG__ = window.__CONFIG__ || {};
window.__CONFIG__.API_BASE_URL = window.__CONFIG__.API_BASE_URL || 'https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net';
```

### 1.3 Verify render.yaml (Optional)

If using `render.yaml`, ensure it's configured:

```yaml
services:
  - type: static
    name: kidneyclinic-frontend
    rootDir: .
    publishDir: .
    buildCommand: ""
    envVars:
      - key: API_BASE_URL
        value: https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net
```

### 1.4 Push to GitHub

Ensure all changes are committed and pushed:

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

---

## Step 2: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"** or **"Sign Up"**
3. Sign up using:
   - GitHub (recommended - easiest integration)
   - Email
   - Google
4. Verify your email if required

---

## Step 3: Create Static Web Service

### 3.1 Navigate to Dashboard

1. After logging in, you'll see the Render dashboard
2. Click **"New +"** button (top right)
3. Select **"Static Site"**

### 3.2 Connect Repository

1. **Connect GitHub** (if not already connected):
   - Click **"Connect GitHub"** or **"Configure account"**
   - Authorize Render to access your repositories
   - Select the repositories you want to deploy (or all repositories)

2. **Select Repository**:
   - Choose your repository: `kidneyclinic` (or your repo name)
   - Render will automatically detect it's a static site

---

## Step 4: Configure Deployment Settings

### 4.1 Basic Settings

Fill in the following:

- **Name**: `kidneyclinic-frontend` (or your preferred name)
- **Branch**: `main` (or `master` if that's your default branch)
- **Root Directory**: `.` (leave empty or use `.` for root)
- **Build Command**: Leave empty (no build needed for static site)
- **Publish Directory**: `.` (leave empty or use `.` for root)

### 4.2 Environment Variables (Optional)

**Note**: Render static sites don't automatically inject environment variables into JavaScript. The `config.js` file handles the API URL.

However, you can add environment variables for documentation:

1. Click **"Advanced"** → **"Add Environment Variable"**
2. Add:
   - **Key**: `API_BASE_URL`
   - **Value**: `https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net`

This is optional since `config.js` already has the URL hardcoded.

### 4.3 Plan Selection

- Select **"Free"** plan (sufficient for static sites)
- Free plan includes:
  - Unlimited static sites
  - Custom domains
  - Automatic SSL
  - Global CDN

### 4.4 Review and Create

1. Review all settings
2. Click **"Create Static Site"**

---

## Step 5: Verify Configuration Files

### 5.1 Check render.yaml (if using)

If you're using `render.yaml`, Render will automatically detect it. Verify:

- Service type is `static`
- Root directory is correct
- Publish directory is correct

### 5.2 Verify File Paths

Ensure all file paths in your HTML files are correct:

- **Admin panel**: `admin/index.html` should reference:
  - `../config.js` (for API config)
  - `../assets/css/styles.css` (for styles)
  - `admin.js` and `admin.css` (relative to admin folder)

---

## Step 6: Deploy

### 6.1 Automatic Deployment

Once you click **"Create Static Site"**:

1. Render will automatically:
   - Clone your repository
   - Detect it's a static site
   - Deploy all files
   - Generate a URL

2. **First deployment** takes 2-5 minutes

3. You'll see a **"Live"** status when deployment completes

### 6.2 Manual Deployment (if needed)

If auto-deploy is disabled:

1. Go to your service dashboard
2. Click **"Manual Deploy"**
3. Select branch: `main`
4. Click **"Deploy"**

### 6.3 Deployment URL

After deployment, Render provides a URL like:
```
https://kidneyclinic-frontend.onrender.com
```

Or if you used a custom name:
```
https://your-service-name.onrender.com
```

---

## Step 7: Test Deployment

### 7.1 Test Homepage

1. Open your Render URL in a browser
2. Verify:
   - ✅ Homepage loads correctly
   - ✅ Styles are applied
   - ✅ Navigation works
   - ✅ Images load
   - ✅ No console errors (F12 → Console)

### 7.2 Test Other Pages

Visit these URLs and verify they work:

- `https://your-url.onrender.com/services.html`
- `https://your-url.onrender.com/doctors.html`
- `https://your-url.onrender.com/about.html`
- `https://your-url.onrender.com/contact.html`

### 7.3 Test Admin Panel Connection

1. Visit: `https://your-url.onrender.com/admin/test-connection.html`
2. Verify:
   - ✅ Page loads
   - ✅ Shows environment information
   - ✅ API connection test works
   - ✅ Shows "200 OK" response

---

## Step 8: Access Admin Panel

### 8.1 Access Admin Panel

1. Navigate to: `https://your-url.onrender.com/admin/`
2. You should see the login screen

### 8.2 Login Credentials

Use your admin credentials (set in your backend/admin system).

### 8.3 Verify Admin Panel Works

After logging in, verify:

- ✅ Dashboard loads
- ✅ Can view doctors list
- ✅ Can view services list
- ✅ Can view appointments
- ✅ API calls work (check browser console for errors)

### 8.4 Test API Connection

1. Open browser console (F12)
2. Check Network tab
3. Verify API calls go to: `https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net`
4. Verify no CORS errors

---

## Troubleshooting

### Issue: Admin Panel Shows Blank Page

**Solution:**
1. Check browser console (F12) for errors
2. Verify `config.js` is accessible: `https://your-url.onrender.com/config.js`
3. Check that `admin/index.html` loads `config.js` correctly
4. Verify file paths are correct (relative paths from admin folder)

### Issue: API Connection Fails

**Symptoms:**
- Admin panel can't load data
- Console shows CORS errors
- Network requests fail

**Solutions:**

1. **Check CORS on Azure Backend**:
   - Ensure Azure backend allows requests from your Render domain
   - Update `server/src/index.js` CORS config:
   ```javascript
   app.use(cors({
     origin: [
       'https://your-render-url.onrender.com',
       '*'
     ],
     // ... rest of config
   }));
   ```

2. **Verify API URL**:
   - Open `admin/test-connection.html`
   - Check if API URL is correct
   - Test connection manually

3. **Check Azure Backend Status**:
   - Verify Azure backend is running
   - Test: `https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net/health`

### Issue: Styles Not Loading

**Solution:**
1. Check file paths in HTML files
2. Verify `assets/css/styles.css` is accessible
3. Check browser console for 404 errors
4. Ensure paths are relative (not absolute)

### Issue: config.js Not Loading

**Symptoms:**
- `window.__CONFIG__` is undefined
- Admin panel uses default URL

**Solution:**
1. Verify `config.js` exists at root: `https://your-url.onrender.com/config.js`
2. Check `admin/index.html` includes: `<script src="../config.js"></script>`
3. The inline fallback in `admin/index.html` should handle this, but verify it's present

### Issue: Deployment Fails

**Solutions:**
1. Check Render deployment logs
2. Verify repository is accessible
3. Check branch name is correct
4. Verify root directory is correct
5. Ensure no build errors (shouldn't be any for static site)

### Issue: Files Not Found (404)

**Solution:**
1. Verify file structure matches repository
2. Check file paths are case-sensitive (Linux servers)
3. Ensure all files are committed and pushed to GitHub
4. Check Render deployment logs for missing files

---

## Maintenance

### Updating the Website

1. **Make Changes Locally**:
   ```bash
   # Edit files
   git add .
   git commit -m "Update website"
   git push origin main
   ```

2. **Render Auto-Deploys**:
   - Render automatically detects pushes to `main` branch
   - Triggers new deployment
   - Usually completes in 2-5 minutes

3. **Manual Deploy** (if auto-deploy disabled):
   - Go to Render dashboard
   - Click "Manual Deploy"
   - Select branch and deploy

### Changing API URL

If you need to change the Azure backend URL:

1. **Update config.js**:
   ```javascript
   window.__CONFIG__.API_BASE_URL = 'https://new-azure-url.azurewebsites.net';
   ```

2. **Commit and Push**:
   ```bash
   git add config.js
   git commit -m "Update API URL"
   git push origin main
   ```

3. **Render will auto-deploy** with new URL

### Custom Domain Setup

1. Go to Render dashboard → Your service
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain
4. Follow DNS configuration instructions
5. Render provides SSL automatically

### Monitoring

- **Deployment Logs**: Available in Render dashboard
- **Service Status**: Shows in dashboard
- **Uptime**: Free plan includes basic monitoring

---

## Quick Reference

### Important URLs

- **Render Dashboard**: https://dashboard.render.com
- **Your Website**: `https://your-service-name.onrender.com`
- **Admin Panel**: `https://your-service-name.onrender.com/admin/`
- **Test Connection**: `https://your-service-name.onrender.com/admin/test-connection.html`
- **Config Debug**: `https://your-service-name.onrender.com/admin/debug-config.html`

### Key Files

- `config.js` - API configuration
- `admin/index.html` - Admin panel entry point
- `admin/admin.js` - Admin panel logic
- `render.yaml` - Render configuration (optional)

### Support Resources

- **Render Docs**: https://render.com/docs
- **Render Support**: support@render.com
- **Test Tools**: Use `admin/test-connection.html` for diagnostics

---

## Summary Checklist

After deployment, verify:

- [ ] Homepage loads correctly
- [ ] All pages are accessible
- [ ] Styles are applied
- [ ] Admin panel is accessible at `/admin/`
- [ ] Admin panel can connect to Azure backend
- [ ] No console errors
- [ ] No CORS errors
- [ ] API calls work from admin panel
- [ ] Test connection page shows success

---

## Next Steps

After successful deployment:

1. ✅ Set up custom domain (optional)
2. ✅ Configure monitoring (optional)
3. ✅ Set up backups (if needed)
4. ✅ Document admin credentials securely
5. ✅ Test all admin panel features
6. ✅ Share the URL with your team

---

**Congratulations!** Your clinic website and admin panel are now live on Render! 🎉

