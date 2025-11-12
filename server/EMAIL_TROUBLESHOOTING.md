# Email Service Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Email Not Sending When Appointment is Confirmed

**Symptoms:**
- Appointment status updates successfully in admin panel
- No email received by patient
- No error messages visible

**Possible Causes & Solutions:**

#### 1. Email Credentials Not Configured
**Check:** Server console should show:
```
✅ Email configured with: your-email@gmail.com
✅ Email service ready to send notifications
```

**If you see:**
```
⚠️  Email not configured - Set EMAIL_USER and EMAIL_PASS in .env file
```

**Solution:**
1. Create a `.env` file in the `server/` directory (copy from `env.template`)
2. Add your email credentials:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
3. For Gmail, you need to use an **App Password**, not your regular password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate an app password for "Mail"
   - Use that 16-character password in `.env`

#### 2. Check Server Logs
When you confirm an appointment, check the server console for:
- ✅ Success: `✅ Confirmation email sent successfully to: patient@example.com`
- ❌ Failure: `❌ Failed to send confirmation email: [error message]`

**Common Error Messages:**
- `Email not configured` → Set EMAIL_USER and EMAIL_PASS
- `Invalid login` → Wrong credentials or need app password
- `Connection timeout` → Firewall or network issue

#### 3. Test Email Connection
Use the test endpoint to verify email setup:
```bash
# In browser or using curl:
http://localhost:3001/api/test-email
```

Expected response:
```json
{
  "success": true,
  "message": "Email connection verified successfully! ✅",
  "configured": true
}
```

### Issue 2: Email Sends but Patient Doesn't Receive

**Possible Causes:**
1. **Email in Spam/Junk Folder** - Check patient's spam folder
2. **Wrong Email Address** - Verify the email in appointment data
3. **Email Provider Blocking** - Some providers block automated emails
4. **Rate Limiting** - Too many emails sent too quickly

**Solutions:**
- Check spam folder
- Verify email address is correct
- Try sending to a different email provider
- Wait a few minutes between test emails

### Issue 3: Server Crashes When Sending Email

**Check:**
- Server logs for full error stack trace
- Node.js version (should be 18+)
- All dependencies installed: `npm install` in `server/` directory

### Quick Diagnostic Steps

1. **Check Email Configuration:**
   ```bash
   cd server
   cat .env | grep EMAIL
   ```
   Should show EMAIL_USER and EMAIL_PASS

2. **Test Email Connection:**
   ```bash
   curl http://localhost:3001/api/test-email
   ```

3. **Check Server Logs:**
   When confirming an appointment, watch the server console for:
   - Email configuration status
   - Email sending attempts
   - Any error messages

4. **Verify Appointment Data:**
   - Check that `patientEmail` field exists in appointment
   - Verify email format is valid

### Manual Testing

1. Start the server:
   ```bash
   cd server
   npm start
   ```

2. Check email configuration status in console

3. Create a test appointment via the website

4. Confirm the appointment in admin panel

5. Watch server console for email sending logs

6. Check patient's email (including spam folder)

### Environment Variables Required

```env
# Required for email service
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional - defaults to EMAIL_USER
EMAIL_FROM=your-email@gmail.com

# Email service (defaults to 'gmail')
EMAIL_SERVICE=gmail
```

### Gmail Setup Instructions

1. Enable 2-Step Verification on your Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Select "Mail" and your device
4. Generate and copy the 16-character password
5. Use this password (not your regular password) in `.env`

### Other Email Providers

For non-Gmail providers, you may need to:
- Update `EMAIL_SERVICE` in `.env`
- Use provider-specific SMTP settings
- Check provider documentation for SMTP configuration

### Still Not Working?

1. Check server console for detailed error messages
2. Verify `.env` file exists and has correct values
3. Test email connection using `/api/test-email` endpoint
4. Check that nodemailer is installed: `npm list nodemailer`
5. Try sending a test email manually using the test endpoint

---

**Last Updated:** Based on current server implementation
**Support:** Check server logs for detailed error messages

