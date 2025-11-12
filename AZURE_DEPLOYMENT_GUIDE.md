# 🌐 Azure Deployment Guide - Clinic Website

## Overview
This guide covers deploying your clinic website to Azure App Service with proper image storage using Azure Blob Storage.

---

## 📋 Prerequisites

1. Azure Account
2. Azure CLI installed (optional but recommended)
3. Node.js and npm installed locally
4. Git installed

---

## 🗄️ Step 1: Create Azure Blob Storage

### Via Azure Portal:

1. **Create Storage Account**
   - Go to [Azure Portal](https://portal.azure.com)
   - Click "Create a resource" → "Storage account"
   - Fill in details:
     - Subscription: Your subscription
     - Resource Group: Create new or use existing
     - Storage account name: e.g., `clinicstorage123` (must be globally unique)
     - Region: Same as your app service (e.g., East US)
     - Performance: Standard
     - Redundancy: LRS (Locally-redundant storage) - cheapest option
   - Click "Review + Create" → "Create"

2. **Create Container**
   - Go to your storage account
   - Click "Containers" in left menu
   - Click "+ Container"
   - Name: `clinic-images`
   - Public access level: **Blob (anonymous read access for blobs only)**
   - Click "Create"

3. **Get Connection String**
   - Go to "Access keys" in left menu
   - Click "Show keys"
   - Copy **Connection string** from key1 or key2
   - Save this securely - you'll need it for environment variables

---

## 🔧 Step 2: Configure Environment Variables

### In Azure Portal:

1. Go to your **App Service**
2. Click "Configuration" in left menu
3. Click "New application setting" and add:

```
Name: MONGO_URI
Value: your_mongodb_connection_string

Name: AZURE_STORAGE_CONNECTION_STRING
Value: DefaultEndpointsProtocol=https;AccountName=clinicstorage123;AccountKey=your_key_here;EndpointSuffix=core.windows.net

Name: AZURE_STORAGE_CONTAINER_NAME
Value: clinic-images

Name: PORT
Value: 8080
```

4. Click "Save" at the top
5. Restart your app service

### For Local Development:

Create `server/.env` file:
```env
MONGO_URI=your_local_or_cloud_mongodb_connection_string
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=clinic-images
PORT=3001
```

---

## 📦 Step 3: Install Dependencies

```bash
cd server
npm install
```

This will install:
- `@azure/storage-blob` - Azure Blob Storage client
- All other dependencies

---

## 🚀 Step 4: Deploy to Azure App Service

### Option A: Via Azure Portal (Easy)

1. **Prepare your code:**
   ```bash
   # Make sure everything is committed
   git add .
   git commit -m "Add Azure Blob Storage integration"
   ```

2. **Deploy:**
   - In Azure Portal, go to your App Service
   - Click "Deployment Center"
   - Choose deployment source (GitHub, Local Git, etc.)
   - Follow the wizard to connect and deploy

### Option B: Via Azure CLI (Advanced)

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name clinic-rg --location eastus

# Create App Service Plan
az appservice plan create \
  --name clinic-plan \
  --resource-group clinic-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name clinic-app-123 \
  --resource-group clinic-rg \
  --plan clinic-plan \
  --runtime "NODE:18-lts"

# Deploy from local git
az webapp deployment source config-local-git \
  --name clinic-app-123 \
  --resource-group clinic-rg

# Get deployment URL
az webapp deployment list-publishing-credentials \
  --name clinic-app-123 \
  --resource-group clinic-rg

# Push to Azure
git remote add azure https://...git
git push azure main
```

---

## ✅ Step 5: Verify Deployment

1. **Check App Service Logs:**
   ```bash
   az webapp log tail --name clinic-app-123 --resource-group clinic-rg
   ```

2. **Test Image Upload:**
   - Go to your admin panel: `https://clinic-app-123.azurewebsites.net/admin`
   - Try uploading a doctor photo
   - Check if it appears on the doctors page
   - Verify the image URL points to Azure Blob Storage

3. **Check Blob Storage:**
   - Go to Azure Portal → Your Storage Account → Containers → clinic-images
   - You should see uploaded images

---

## 🎯 How It Works in Production

### Upload Flow:
```
User uploads image in admin panel
         ↓
Frontend sends file to /api/upload
         ↓
Backend (Azure App Service) receives file in memory
         ↓
File uploaded to Azure Blob Storage
         ↓
Azure returns public URL (https://clinicstorage123.blob.core.windows.net/clinic-images/123456789.jpg)
         ↓
URL saved to MongoDB
         ↓
Image displays on website using Azure URL
```

### Storage Location:
- ❌ **Local files** - NOT used in production
- ✅ **Azure Blob Storage** - All images stored here
- URL format: `https://{account}.blob.core.windows.net/{container}/{filename}`

---

## 💰 Cost Estimation

**Azure Blob Storage:**
- Storage: ~$0.018 per GB per month
- Operations: ~$0.004 per 10,000 operations
- Example: 100 images (average 500KB each) = 50MB = ~$0.001/month

**Azure App Service (B1 tier):**
- ~$13/month (Basic tier)
- Includes: 1.75 GB RAM, 100 GB storage

**Total estimated cost: ~$13-15/month**

---

## 🔒 Security Best Practices

1. **Connection String:**
   - Never commit to Git
   - Store only in Azure App Settings
   - Use environment variables

2. **Container Access:**
   - Set to "Blob" level (public read only)
   - Files are publicly accessible via URL
   - No authentication needed for viewing

3. **File Validation:**
   - Already implemented: image files only
   - 5MB size limit
   - File type checking

---

## 🐛 Troubleshooting

### Images not uploading:
1. Check Azure connection string in App Settings
2. Verify container exists and has correct permissions
3. Check app logs: `az webapp log tail --name yourapp --resource-group yourgroup`

### Images not displaying:
1. Verify container public access is set to "Blob"
2. Check if URL in database is valid
3. Test URL directly in browser

### "Azure Blob Storage not configured" error:
1. Verify `AZURE_STORAGE_CONNECTION_STRING` is set in App Settings
2. Restart the App Service
3. Check connection string format is correct

---

## 🔄 Migration from Local to Azure

If you have existing images in local `/uploads` folder:

1. **Manual Upload:**
   - Go to Azure Portal → Storage Account → Containers → clinic-images
   - Click "Upload" and select your images

2. **Update Database:**
   - Update doctor records to point to new Azure URLs
   - Format: `https://youraccount.blob.core.windows.net/clinic-images/filename.jpg`

---

## 📊 Monitoring

**View Upload Statistics:**
- Azure Portal → Storage Account → Metrics
- Monitor: Transactions, Used capacity, Ingress/Egress

**View App Logs:**
```bash
# Live logs
az webapp log tail --name yourapp --resource-group yourgroup

# Download logs
az webapp log download --name yourapp --resource-group yourgroup
```

---

## 🚀 Next Steps

After successful deployment:

1. ✅ Set up custom domain (optional)
2. ✅ Configure SSL certificate (free with Azure)
3. ✅ Set up Azure CDN for faster image delivery (optional)
4. ✅ Configure backup/redundancy
5. ✅ Set up monitoring alerts

---

## 📞 Support

- Azure Blob Storage Docs: https://docs.microsoft.com/azure/storage/blobs/
- Azure App Service Docs: https://docs.microsoft.com/azure/app-service/
- Node.js on Azure: https://docs.microsoft.com/azure/app-service/quickstart-nodejs

---

## ✨ Summary

✅ Images stored in Azure Blob Storage (persistent)
✅ Public URLs for direct access
✅ No file loss on app restarts
✅ Scalable and reliable
✅ Cost-effective storage
✅ Easy to deploy and maintain

**Your clinic website is production-ready! 🎉**

