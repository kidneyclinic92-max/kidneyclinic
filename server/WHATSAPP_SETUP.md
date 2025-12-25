# WhatsApp Business API Setup Guide

This guide will help you set up WhatsApp Business API integration for sending appointment confirmation messages.

## Prerequisites

1. A Facebook Business Account
2. A Meta Developer Account
3. A WhatsApp Business Account (or phone number ready to be verified)

## Step 1: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. **Log in** with your Facebook account (make sure you're logged in)
3. **Find "My Apps"**:
   - Look for a dropdown menu in the top-right corner (your profile picture/name)
   - OR look for "My Apps" in the top navigation bar
   - OR go directly to: https://developers.facebook.com/apps/
4. **Create a new app**:
   - Click "Create App" button (usually green/blue, top right)
   - If you don't see "Create App", click "Add a New App" or the "+" icon
5. **Select app type**:
   - Choose **"Business"** as the app type
   - Click "Next"
6. **Fill in app details**:
   - **App Name**: e.g., "Clinic Appointment System" or "My Clinic WhatsApp"
   - **App Contact Email**: Your email address
   - **Business Account**: Select or create one (if prompted)
   - Click "Create App"

**Troubleshooting:**
- If you can't see "My Apps", make sure you're logged in with a Facebook account
- If you see "No apps", that's normal - you need to create your first app
- If you get an error, try using a different browser or clearing cache
- Make sure your Facebook account has developer access enabled

## Step 2: Add WhatsApp Product

1. **Access your app dashboard**:
   - After creating the app, you'll be redirected to the app dashboard
   - If not, go to https://developers.facebook.com/apps/ and click on your app name

2. **Add WhatsApp product**:
   - In the left sidebar, look for "Add Products" or "Products" section
   - Scroll down to find "WhatsApp" in the product list
   - Click the **"Set Up"** button next to WhatsApp
   - OR go to: https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/ (replace YOUR_APP_ID)

3. **Follow the setup wizard**:
   - You may be asked to accept terms and conditions
   - Select your Meta Business Account (or create one if needed)
   - Click "Continue" or "Next" through the steps

**Note:** If you don't see WhatsApp in the products list:
- Make sure your app type is "Business" (not "Consumer" or "Other")
- Try refreshing the page
- Check if your account has the necessary permissions

## Step 3: Get Your Credentials

**Navigate to WhatsApp API Setup:**
1. In your app dashboard, look for **"WhatsApp"** in the left sidebar
2. Click on **"WhatsApp"** → **"API Setup"** (or "Getting Started")
3. You should see a page with your credentials

**You'll need the following:**

1. **Access Token** (`WHATSAPP_ACCESS_TOKEN`)
   - Look for "Temporary access token" section
   - Click "Copy" or manually copy the token
   - ⚠️ **Important**: Temporary tokens expire in 24 hours
   - For production, you'll need to create a System User and generate a permanent token (see Step 3.5 below)

2. **Phone Number ID** (`WHATSAPP_PHONE_NUMBER_ID`)
   - Found in the "From" section or "Phone number ID" field
   - It's a long numeric ID (e.g., "123456789012345")
   - Copy this number

3. **Business Account ID** (`WHATSAPP_BUSINESS_ACCOUNT_ID`) - Optional
   - Found in the same API Setup page
   - Usually shown as "WhatsApp Business Account ID"
   - Useful for managing multiple numbers

4. **API Version** (`WHATSAPP_API_VERSION`) - Optional
   - Default: `v21.0` (or check the current version shown in the API URL)
   - Check Meta's documentation for the latest version: https://developers.facebook.com/docs/whatsapp/cloud-api

**If you can't see these credentials:**
- Make sure you've completed Step 2 (added WhatsApp product)
- Try refreshing the page
- Check if you need to verify your business account first

## Step 4: Verify Your Phone Number

1. In WhatsApp → API Setup, click "Add phone number"
2. Enter your business phone number
3. Verify it using the code sent via SMS or call
4. Once verified, you can send messages

## Step 5: Configure Environment Variables

Add these to your `.env` file in the `server/` directory:

```env
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here  # Optional
WHATSAPP_API_VERSION=v21.0  # Optional, defaults to v21.0
```

## Step 6: Test the Integration

1. Start your server:
   ```bash
   cd server
   npm run dev
   ```

2. Test the WhatsApp connection:
   ```bash
   curl http://localhost:3001/api/test-whatsapp
   ```

   Or visit in browser:
   ```
   http://localhost:3001/api/test-whatsapp
   ```

3. You should see a success message if configured correctly.

## Step 7: Test with an Appointment

1. Create an appointment through your frontend
2. The system will automatically send a WhatsApp message to the patient's phone number
3. Check the server logs for confirmation

## Message Templates (24-Hour Window)

For production use, you'll need to create message templates in Meta Business Manager:

1. Go to Meta Business Manager → WhatsApp → Message Templates
2. Create templates for:
   - Appointment Confirmation
   - Appointment Cancellation
   - Appointment Reminder (if needed)

**Note:** Currently, the implementation uses free-form text messages. For production, you may want to use approved templates to avoid the 24-hour messaging window limitation.

## Free-Form Messages vs Templates

- **Free-form messages**: Can only be sent within 24 hours of the last customer message
- **Template messages**: Can be sent anytime but must be pre-approved by Meta

For appointment confirmations, you'll likely want to use template messages since they're sent automatically without customer initiation.

## Common Navigation Issues

### Can't find "My Apps" button
- **Solution 1**: Look for a dropdown menu in the top-right corner (click your profile picture/name)
- **Solution 2**: Go directly to: https://developers.facebook.com/apps/
- **Solution 3**: Check if you're logged in with the correct Facebook account

### Can't see your app after creating it
- **Solution 1**: Refresh the page (F5 or Ctrl+R)
- **Solution 2**: Go directly to: https://developers.facebook.com/apps/ and look for your app name
- **Solution 3**: Check if you're logged in with the same account that created the app
- **Solution 4**: Clear browser cache and cookies, then try again

### Can't find WhatsApp product
- **Solution 1**: Make sure your app type is "Business" (not "Consumer")
- **Solution 2**: In your app dashboard, look in the left sidebar for "Products" or "Add Products"
- **Solution 3**: Try going directly to: https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/
  (Replace YOUR_APP_ID with your actual app ID from the URL)

### App dashboard looks empty
- **Solution 1**: Make sure you've completed the app creation process
- **Solution 2**: Check if your app is in "Development Mode" (this is normal for new apps)
- **Solution 3**: Try a different browser (Chrome, Firefox, Edge)

### Need to find your App ID
- Your App ID is in the URL when you're viewing your app dashboard
- Format: `https://developers.facebook.com/apps/YOUR_APP_ID/`
- You can also find it in **Settings** → **Basic** → **App ID**

## Troubleshooting

### Error: "Invalid OAuth access token"
- Check that your `WHATSAPP_ACCESS_TOKEN` is correct
- Make sure the token hasn't expired (temporary tokens expire in 24 hours)
- Generate a new token if needed

### Error: "Phone number not found"
- Verify your `WHATSAPP_PHONE_NUMBER_ID` is correct
- Make sure the phone number is verified in Meta Business Manager

### Error: "Message failed to send"
- Check that the recipient's phone number is in the correct format (country code + number, no + or spaces)
- Verify your phone number has messaging credits (if applicable)
- Check Meta's status page for API issues

### Messages not being sent
- Check server logs for detailed error messages
- Verify all environment variables are set correctly
- Test the connection using `/api/test-whatsapp` endpoint

## Production Considerations

1. **Use Permanent Access Tokens**: Create a System User and generate a permanent token instead of temporary ones
2. **Message Templates**: Set up approved templates for better deliverability
3. **Error Handling**: Implement retry logic for failed messages
4. **Rate Limiting**: Be aware of Meta's rate limits
5. **Webhooks**: Set up webhooks to receive delivery status updates
6. **Monitoring**: Monitor message delivery rates and errors

## Additional Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta for Developers](https://developers.facebook.com/)
- [WhatsApp Cloud API Guide](https://developers.facebook.com/docs/whatsapp/cloud-api)

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify your credentials in Meta Business Manager
3. Test the connection using the `/api/test-whatsapp` endpoint
4. Consult Meta's documentation and status page

