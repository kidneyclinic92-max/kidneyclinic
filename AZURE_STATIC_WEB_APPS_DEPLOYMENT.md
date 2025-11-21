# 🌐 Azure Static Web Apps Deployment Guide - Frontend

## Overview
This guide covers deploying your clinic website **frontend** to **Azure Static Web Apps**, which is the recommended Azure service for static sites (HTML, CSS, JavaScript).

---

## 🎯 Why Azure Static Web Apps?

✅ **Free Tier Available** - Perfect for small to medium sites  
✅ **Built-in CI/CD** - Automatic deployments from GitHub  
✅ **Free SSL Certificates** - HTTPS enabled by default  
✅ **Global CDN** - Fast content delivery worldwide  
✅ **Custom Domains** - Easy domain configuration  
✅ **Optimized for Static Sites** - Better than App Service for frontend  

---

## 📋 Prerequisites

1. **Azure Account** (free tier available)
2. **GitHub Account** (for CI/CD)
3. **Your code pushed to GitHub**

---

## 🚀 Step 1: Create Azure Static Web App

### Via Azure Portal:

1. **Go to Azure Portal**
   - Visit [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure account

2. **Create Static Web App**
   - Click **"Create a resource"** (top left)
   - Search for **"Static Web Apps"**
   - Click **"Create"**

3. **Fill in Basic Details:**
   ```
   Subscription: Your Azure subscription
   Resource Group: Create new (e.g., "clinic-frontend-rg")
   Name: kidneyclinic-frontend (or your preferred name)
   Plan type: Free (or Standard if you need more features)
   Region: East US (or closest to your users)
   ```

4. **Deployment Details:**
   ```
   Source: GitHub
   GitHub account: Sign in and authorize Azure
   Organization: Your GitHub username/organization
   Repository: kidneyclinic (or your repo name)
   Branch: main (or your default branch)
   ```

5. **Build Configuration:**
   ```
   Build Presets: Custom
   App location: / (root directory)
   Api location: (leave empty - your API is separate)
   Output location: / (root directory)
   ```

6. **Click "Review + Create" → "Create"**

---

## ⚙️ Step 2: Configure Build Settings

After creation, Azure will automatically:
- Create a GitHub Action workflow file
- Set up CI/CD pipeline
- Deploy your site

### Verify Build Configuration:

1. Go to your **Static Web App** in Azure Portal
2. Click **"Configuration"** in left menu
3. Check **"Build"** settings:
   ```
   App location: /
   Output location: /
   Api location: (empty)
   ```

### If you need to customize the build:

1. Go to your GitHub repository
2. Check `.github/workflows/` folder
3. You'll see a workflow file like `azure-static-web-apps-{name}.yml`
4. Edit if needed (usually not required for static sites)

---

## 🔧 Step 3: Configure Environment Variables (Optional)

Since Static Web Apps don't support environment variables like App Service, your `config.js` file already handles the API URL:

```javascript
// config.js (already in your project)
window.__CONFIG__ = window.__CONFIG__ || {};
window.__CONFIG__.API_BASE_URL = window.__CONFIG__.API_BASE_URL || 
  'https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net';
```

**No additional configuration needed!** Your frontend will automatically use the Azure backend URL.

---

## 📝 Step 4: Update File Structure (if needed)

Azure Static Web Apps serves files from the root directory. Your current structure is already correct:

```
clinic_system1/
├── index.html          ✅ Main page
├── about.html          ✅
├── services.html       ✅
├── admin/
│   └── index.html      ✅ Admin panel
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── config.js           ✅ API configuration
└── ...
```

**Everything is already in the right place!**

---

## 🚀 Step 5: Deploy

### Automatic Deployment (Recommended):

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Azure Static Web Apps deployment"
   git push origin main
   ```

2. **Azure will automatically:**
   - Detect the push
   - Run the GitHub Action
   - Build and deploy your site
   - Provide you with a URL

3. **Check Deployment Status:**
   - Go to Azure Portal → Your Static Web App
   - Click **"Deployment history"** to see build progress
   - Or check GitHub → **Actions** tab

### Manual Deployment (Alternative):

If you prefer manual deployment:

```bash
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Login to Azure
az login

# Deploy
swa deploy ./ --deployment-token YOUR_DEPLOYMENT_TOKEN
```

Get deployment token from: Azure Portal → Static Web App → **"Manage deployment token"**

---

## 🌐 Step 6: Access Your Site

After deployment, your site will be available at:

```
https://{your-app-name}.azurestaticapps.net
```

Example:
```
https://kidneyclinic-frontend.azurestaticapps.net
```

---

## 🔗 Step 7: Configure Custom Domain (Optional)

1. Go to Azure Portal → Your Static Web App
2. Click **"Custom domains"** in left menu
3. Click **"Add"**
4. Enter your domain (e.g., `www.yourclinic.com`)
5. Follow DNS configuration instructions
6. Azure will automatically provision SSL certificate

---

## ✅ Step 8: Verify Deployment

1. **Test Homepage:**
   - Visit your Static Web App URL
   - Verify all pages load correctly

2. **Test Admin Panel:**
   - Visit `https://your-app.azurestaticapps.net/admin`
   - Login and verify it connects to Azure backend

3. **Test API Connection:**
   - Open browser console (F12)
   - Check Network tab for API calls
   - Verify they go to: `https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net`

4. **Test All Pages:**
   - Navigate through all pages
   - Check images load correctly
   - Verify JavaScript works

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────┐
│   Azure Static Web Apps             │
│   (Frontend - HTML/CSS/JS)          │
│   https://your-app.azurestaticapps.net│
└──────────────┬──────────────────────┘
               │ API Calls
               │
               ▼
┌─────────────────────────────────────┐
│   Azure App Service                  │
│   (Backend - Node.js API)            │
│   https://kidney-clinic-...azurewebsites.net│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   MongoDB Atlas                     │
│   (Database)                         │
└─────────────────────────────────────┘
```

---

## 💰 Cost Estimation

**Azure Static Web Apps (Free Tier):**
- ✅ 100 GB bandwidth/month
- ✅ Unlimited custom domains
- ✅ Free SSL certificates
- ✅ 100 builds/month
- **Cost: $0/month**

**Standard Tier** (if you need more):
- $9/month per app
- 1 TB bandwidth/month
- Unlimited builds
- Advanced features

**For most clinics, Free Tier is sufficient!**

---

## 🔄 Continuous Deployment

Once set up, every push to your `main` branch will:
1. Trigger GitHub Action
2. Build your site
3. Deploy to Azure Static Web Apps
4. Update your live site automatically

**No manual deployment needed!**

---

## 🐛 Troubleshooting

### Site not deploying:

1. **Check GitHub Actions:**
   - Go to GitHub → Your repo → **Actions** tab
   - Check for failed workflows
   - Review error messages

2. **Check Build Logs:**
   - Azure Portal → Static Web App → **"Deployment history"**
   - Click on latest deployment
   - Review build logs

3. **Verify File Structure:**
   - Ensure `index.html` is in root directory
   - Check all asset paths are correct

### Admin panel not working:

1. **Check API URL:**
   - Open browser console
   - Verify `config.js` loads correctly
   - Check API calls go to correct backend URL

2. **Check CORS:**
   - Ensure backend allows requests from your Static Web App domain
   - Backend should allow: `https://your-app.azurestaticapps.net`

### 404 errors on routes:

Azure Static Web Apps handles routing automatically for:
- `/index.html` → `/`
- `/about.html` → `/about`
- `/admin/index.html` → `/admin`

If you have client-side routing, you may need to configure `routes.json`:

```json
{
  "routes": [
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ]
}
```

---

## 📊 Monitoring

**View Analytics:**
- Azure Portal → Static Web App → **"Analytics"**
- See: Page views, unique visitors, bandwidth usage

**View Logs:**
- Azure Portal → Static Web App → **"Log stream"**
- Real-time application logs

---

## 🔒 Security

✅ **HTTPS by default** - All traffic encrypted  
✅ **Free SSL certificates** - Automatically managed  
✅ **DDoS protection** - Built-in protection  
✅ **No server management** - Azure handles security updates  

---

## 🚀 Next Steps

After successful deployment:

1. ✅ Test all pages and functionality
2. ✅ Configure custom domain (optional)
3. ✅ Set up monitoring alerts (optional)
4. ✅ Update any hardcoded URLs in your code
5. ✅ Share your new URL with stakeholders!

---

## 📞 Support

- **Azure Static Web Apps Docs:** https://docs.microsoft.com/azure/static-web-apps/
- **GitHub Actions:** https://docs.github.com/en/actions
- **Azure Portal:** https://portal.azure.com

---

## ✨ Summary

✅ **Service:** Azure Static Web Apps (Free tier available)  
✅ **Deployment:** Automatic via GitHub Actions  
✅ **URL:** `https://your-app.azurestaticapps.net`  
✅ **Cost:** $0/month (Free tier)  
✅ **SSL:** Free and automatic  
✅ **CDN:** Global content delivery included  

**Your frontend is production-ready on Azure! 🎉**

---

## 🔄 Migration from Render

If you're currently on Render and want to migrate:

1. **Deploy to Azure Static Web Apps** (follow steps above)
2. **Test thoroughly** on Azure URL
3. **Update DNS** (if using custom domain)
4. **Keep Render** as backup during transition
5. **Switch DNS** when ready
6. **Cancel Render** subscription after confirming Azure works

**Both can run simultaneously during migration!**

