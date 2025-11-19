# Admin Panel Quick Fix Guide

## If Admin Panel is Not Working on Render

### Step 1: Run Diagnostic

1. Visit: `https://your-render-url.onrender.com/admin/diagnose.html`
2. Click "Run Full Diagnostic"
3. Review the results

### Step 2: Common Issues & Quick Fixes

#### Issue: Blank Page / Nothing Loads

**Check:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check Network tab for failed file loads

**Fix:**
- Verify all files are deployed
- Check file paths are correct
- Ensure `admin.js` and `admin.css` are in the `admin/` folder

#### Issue: "AdminPanel is not defined"

**Fix:**
- Check that `admin.js` is loading
- Verify script tag: `<script src="admin.js"></script>`
- Check browser console for script loading errors

#### Issue: API Connection Fails / CORS Errors

**Fix:**
1. Update Azure backend CORS in `server/src/index.js`:
   ```javascript
   app.use(cors({
     origin: [
       'https://your-render-url.onrender.com',
       '*'
     ],
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization'],
     credentials: false
   }));
   ```

2. Redeploy Azure backend

#### Issue: Config Not Loading

**Fix:**
- The inline fallback in `admin/index.html` should handle this
- Verify the script tag order:
  ```html
  <script>
    // Inline config fallback
    if (typeof window.__CONFIG__ === 'undefined') {
      window.__CONFIG__ = {};
    }
    if (!window.__CONFIG__.API_BASE_URL) {
      window.__CONFIG__.API_BASE_URL = 'https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net';
    }
  </script>
  <script src="../config.js"></script>
  <script src="admin.js"></script>
  ```

### Step 3: Manual API URL Override

If nothing else works, manually set the API URL:

1. Open admin panel
2. Open browser console (F12)
3. Run:
   ```javascript
   localStorage.setItem('api_base', 'https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net');
   location.reload();
   ```

### Step 4: Verify File Structure on Render

Check that these files exist:
- `/admin/index.html`
- `/admin/admin.js`
- `/admin/admin.css`
- `/config.js`
- `/assets/css/styles.css`

### Step 5: Check Render Deployment Logs

1. Go to Render dashboard
2. Click on your static site
3. Check "Logs" tab
4. Look for any deployment errors

### Still Not Working?

1. Use `admin/diagnose.html` for detailed diagnostics
2. Check browser console for specific errors
3. Verify Azure backend is accessible
4. Test API connection: `https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net/health`

