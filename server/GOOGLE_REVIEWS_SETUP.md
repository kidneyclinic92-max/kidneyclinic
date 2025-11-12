# Google Reviews Integration Setup Guide

This guide will help you set up automatic Google Reviews fetching for your clinic website.

## 📋 Prerequisites

- Google Cloud account (free tier is sufficient)
- Your clinic's Google Place ID
- Node.js server running

## 🔑 Step 1: Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing one)
3. Enable the **Places API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Places API"
   - Click "Enable"
4. Create API credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key
5. (Optional but recommended) Restrict your API key:
   - Click on your API key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API"
   - Under "Application restrictions", you can restrict by IP or HTTP referrer

## 🆔 Step 2: Find Your Google Place ID

Your clinic's Place ID is already identified: **ChIJyX_-2MztOj4ROVbuY8wjPmc**

To verify or find it yourself:
1. Go to [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
2. Search for "The Kidney Clinic"
3. Copy the Place ID

## ⚙️ Step 3: Configure Environment Variables

Create a `.env` file in the `server` directory with the following:

```env
# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/clinic_local

# Email Configuration (if using)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google Places API
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
GOOGLE_PLACE_ID=ChIJyX_-2MztOj4ROVbuY8wjPmc

# Server
PORT=3001
```

Replace `your_google_places_api_key_here` with your actual API key from Step 1.

## 🚀 Step 4: Start the Server

```bash
cd server
npm install
npm run dev
```

## ✅ Step 5: Test the Integration

1. Make sure your server is running on http://localhost:3001
2. Open your browser and navigate to the reviews page
3. You should see real Google reviews automatically loaded!

## 💰 Pricing & Rate Limits

**Google Places API Pricing:**
- First $200/month is FREE (includes ~4,000 requests)
- Place Details (for reviews): $0.017 per request
- Our implementation uses caching (1-hour cache) to minimize API calls

**Caching:**
- Reviews are cached for 1 hour
- This means you'll use approximately 720 API calls per month (if constantly accessed)
- Well within the free tier!

## 🔍 Troubleshooting

### Reviews not loading?

1. **Check server logs** for error messages
2. **Verify API key** is correct in `.env` file
3. **Check API is enabled** in Google Cloud Console
4. **Test the endpoint** directly:
   ```bash
   curl http://localhost:3001/api/google-reviews
   ```

### "API key not configured" error?

- Make sure you created the `.env` file in the `server` directory
- Restart your server after adding the API key
- Check that the variable name is exactly `GOOGLE_PLACES_API_KEY`

### Getting rate limit errors?

- The free tier includes $200/month (~11,700 requests)
- Our caching system should prevent this
- If needed, you can increase cache duration in `google-reviews-service.js`

## 📊 What Data is Fetched?

From each review:
- ✅ Author name
- ✅ Rating (1-5 stars)
- ✅ Review text
- ✅ Date/time
- ✅ Profile photo (if available)

Additional data:
- ✅ Overall clinic rating
- ✅ Total number of reviews
- ✅ Direct link to Google Maps

## 🔄 Refresh Reviews

Reviews are automatically cached for 1 hour. To manually refresh:
1. Wait 1 hour, or
2. Restart the server, or
3. Modify the `CACHE_DURATION` in `server/src/google-reviews-service.js`

## 🛡️ Security Best Practices

1. ✅ **Never commit `.env` file** to git (it's in .gitignore)
2. ✅ **Use API key restrictions** in Google Cloud Console
3. ✅ **Keep your API key secret** - never expose it in frontend code
4. ✅ **Monitor your API usage** in Google Cloud Console
5. ✅ **Set up billing alerts** to avoid unexpected charges

## 📞 Support

If you encounter any issues:
1. Check the server console for error messages
2. Verify all environment variables are set correctly
3. Make sure the Places API is enabled in Google Cloud Console
4. Check your API key permissions and restrictions

---

**Note:** The integration is already set up in your code. You just need to add the API key to start seeing real Google reviews!

