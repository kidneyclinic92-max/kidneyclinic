# Render Static Site Deployment Guide

## Admin Panel Support

**Yes, Render static sites fully support the admin panel!** The admin panel is a client-side JavaScript application that works on any static hosting.

## Common Issues and Solutions

### 1. Admin Panel Not Loading

**Problem:** Admin panel shows blank page or errors

**Solutions:**
- Check browser console (F12) for errors
- Verify file paths are correct
- Ensure `config.js` is accessible at root level
- Check that all files in `/admin/` folder are deployed

### 2. API Connection Issues

**Problem:** Admin panel can't connect to Azure backend

**Solutions:**
- Open `admin/test-connection.html` to diagnose
- Check CORS settings on Azure server
- Verify `config.js` has correct API URL
- Check browser console for CORS errors

### 3. Environment Variables Not Working

**Problem:** `API_BASE_URL` environment variable not being used

**Solution:**
Render static sites don't automatically inject environment variables. The admin panel will:
1. Check `localStorage.getItem('api_base')` (user can set this)
2. Check `window.__CONFIG__.API_BASE_URL` (from `config.js`)
3. Fall back to default Azure URL

To update the API URL:
- Edit `config.js` manually, OR
- Use the admin panel's API URL input field (saves to localStorage)

### 4. Path Issues

**Problem:** CSS/JS files not loading

**Solution:**
- All paths in admin panel use relative paths (`../assets/`)
- Ensure file structure is preserved during deployment
- Check Render's publish directory matches your root directory

## File Structure Required

```
/
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
└── data/
    └── *.json
```

## Testing After Deployment

1. **Test Admin Panel Access:**
   ```
   https://your-render-url.onrender.com/admin/
   ```

2. **Test API Connection:**
   ```
   https://your-render-url.onrender.com/admin/test-connection.html
   ```

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

## CORS Configuration

Your Azure backend must allow requests from Render. Update `server/src/index.js`:

```javascript
app.use(cors({
  origin: [
    'https://kidneyclinic-frontend.onrender.com', // Your Render URL
    'http://localhost:5500', // Local development
    '*' // Or allow all (less secure)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
```

## Manual API URL Configuration

If environment variables don't work, users can manually set the API URL:

1. Open admin panel
2. Open browser console (F12)
3. Run: `localStorage.setItem('api_base', 'https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net')`
4. Refresh the page

## Troubleshooting Checklist

- [ ] All files are in the correct directory structure
- [ ] `config.js` exists at root level
- [ ] `admin/index.html` loads without errors
- [ ] Browser console shows no JavaScript errors
- [ ] API health check works (`/health` endpoint)
- [ ] CORS headers are present in API responses
- [ ] Network requests show correct API URL

## Support

If issues persist:
1. Check Render deployment logs
2. Use `admin/test-connection.html` for diagnostics
3. Verify Azure server is running and accessible
4. Check CORS configuration on Azure backend

