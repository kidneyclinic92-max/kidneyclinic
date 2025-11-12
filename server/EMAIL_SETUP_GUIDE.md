# 📧 Email Setup Guide - Nodemailer with Gmail

## ✅ **STEP 1: Configure Your Gmail Account**

### A. Enable 2-Factor Authentication (2FA)
1. Go to: https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the prompts to enable 2FA (you'll need your phone)

### B. Create an App Password
1. After enabling 2FA, go back to **Security**
2. Under "How you sign in to Google", click **App passwords**
   - If you don't see this option, make sure 2FA is enabled first
3. Select app: **Mail**
4. Select device: **Other (Custom name)** → Type "Clinic System"
5. Click **Generate**
6. **COPY THE 16-CHARACTER PASSWORD** 
   - It looks like: `abcd efgh ijkl mnop`
   - You won't see it again!

---

## ✅ **STEP 2: Update Your `.env` File**

Add these lines to `server/.env`:

```env
# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=Clinic System <your-email@gmail.com>
```

**Replace:**
- `your-email@gmail.com` → Your actual Gmail address
- `abcd efgh ijkl mnop` → The 16-character app password from Step 1

---

## ✅ **STEP 3: Test Email Connection**

### Restart Backend Server:
```bash
cd server
npm run dev
```

### Test the Connection:
Open in browser: `http://localhost:3001/api/test-email`

**Expected Response:**
```json
{
  "success": true,
  "message": "Email connection verified successfully! ✅",
  "configured": true
}
```

---

## ✅ **STEP 4: Test with Real Appointment**

1. Go to admin panel: `http://localhost:8080/admin/`
2. Login: `admin` / `admin123`
3. Click **Appointments** tab
4. Click **✓ Confirm** on a pending appointment
5. Check the patient's email inbox!

---

## 📧 **What Emails Are Sent?**

### 1. **Confirmation Email** (Status: Pending → Confirmed)
- ✅ Subject: "Appointment Confirmed"
- Contains: Date, time, doctor, what to bring, directions
- Professional HTML template with clinic branding

### 2. **Cancellation Email** (Status: Any → Cancelled)
- ❌ Subject: "Appointment Cancelled"
- Contains: Cancelled details, reschedule instructions
- Contact information for rebooking

### 3. **Thank You Email** (Status: Confirmed → Completed)
- 🙏 Subject: "Thank You for Your Visit"
- Contains: Follow-up care instructions, feedback request
- Patient care information

---

## 🔒 **SECURITY NOTES**

### Important:
- ⚠️ **NEVER commit your `.env` file to Git!**
- The app password gives access to your Gmail
- Keep it secret and safe
- The `.env` file is already in `.gitignore`

### Gmail Limits:
- **Free Gmail:** ~500 emails/day
- **Google Workspace:** 2,000 emails/day
- More than enough for most clinics!

---

## 🐛 **TROUBLESHOOTING**

### Problem: "Email not configured"
**Solution:** Make sure EMAIL_USER and EMAIL_PASS are in `.env` file

### Problem: "Invalid login"
**Solution:** 
1. Make sure 2FA is enabled
2. Use App Password, not your regular Gmail password
3. Remove spaces from the app password (or keep them, both work)

### Problem: "Connection refused"
**Solution:** Check your internet connection

### Problem: Emails going to spam
**Solution:**
1. Add your clinic email to recipient's contacts
2. Ask recipients to mark as "Not Spam"
3. Consider using a custom domain (professional email)

---

## 📝 **EXAMPLE `.env` FILE**

Here's what your complete `.env` file should look like:

```env
# MongoDB Connection
MONGO_URI=mongodb://backup-cdb01:...@backup-cdb01.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&replicaSet=globaldb&maxIdleTimeMS=120000&appName=@backup-cdb01@

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=kidneyclinicstorage;AccountKey=...;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=clinic-images

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=clinic@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=My Clinic <clinic@gmail.com>

# Server Port
PORT=3001
```

---

## 🚀 **NEXT STEPS**

1. ✅ Enable 2FA on Gmail (2 minutes)
2. ✅ Get App Password (1 minute)
3. ✅ Add to `.env` file (30 seconds)
4. ✅ Restart server (10 seconds)
5. ✅ Test with `/api/test-email` endpoint
6. ✅ Confirm an appointment and check email!

---

## 💡 **TIPS**

- Use a dedicated Gmail account for your clinic (e.g., `appointments@yourlinic.com` with Gmail)
- Check spam folder first time you test
- Professional email tip: Use Google Workspace for custom domain emails
- Keep your app password safe - store in password manager

---

## ✅ **YOU'RE ALL SET!**

Once configured, emails will automatically send when:
- ✅ Admin confirms an appointment
- ❌ Admin cancels an appointment  
- 🙏 Admin marks appointment as completed

No manual intervention needed - it's fully automated! 🎉

