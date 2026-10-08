# Instagram API Setup Guide

## 🚨 **FIXING "Invalid platform app" ERROR**

The "Invalid platform app" error occurs when your Instagram app isn't properly configured. Follow these steps:

## 📋 **Step 1: Create Instagram App**

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" as app type
4. Fill in app details:
   - **App Name**: Your app name (e.g., "Instagram DM Automation")
   - **App Contact Email**: Your email
   - **App Purpose**: Choose appropriate purpose

## 📋 **Step 2: Add Instagram Basic Display Product**

1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Go to Instagram Basic Display → Basic Display

## 📋 **Step 3: Configure OAuth Settings**

1. In Instagram Basic Display settings:

   - **Valid OAuth Redirect URIs**: Add `http://localhost:5173/auth/instagram/callback`
   - **Deauthorize Callback URL**: Add `http://localhost:5000/api/compliance/deauthorize`
   - **Data Deletion Request URL**: Add `http://localhost:5000/api/compliance/data-deletion`

2. For production, use your actual domain:
   - **Valid OAuth Redirect URIs**: `https://yourdomain.com/auth/instagram/callback`
   - **Deauthorize Callback URL**: `https://yourdomain.com/api/compliance/deauthorize`
   - **Data Deletion Request URL**: `https://yourdomain.com/api/compliance/data-deletion`

## 📋 **Step 4: Get Your Credentials**

1. Go to Settings → Basic
2. Copy your **App ID** (this is your CLIENT_ID)
3. Copy your **App Secret** (this is your CLIENT_SECRET)

## 📋 **Step 5: Update Environment Variables**

Update your `backend/.env` file:

```env
# Replace with your actual credentials from Facebook Developers
INSTAGRAM_CLIENT_ID=your_app_id_from_facebook_developers
INSTAGRAM_CLIENT_SECRET=your_app_secret_from_facebook_developers
INSTAGRAM_REDIRECT_URI=http://localhost:5173/auth/instagram/callback
```

Update your `frontend/.env` file:

```env
# Use the same App ID as backend
VITE_INSTAGRAM_CLIENT_ID=your_app_id_from_facebook_developers
VITE_INSTAGRAM_REDIRECT_URI=http://localhost:5173/auth/instagram/callback
VITE_BACKEND_URL=http://localhost:5000
```

## 📋 **Step 5b: Configure Webhooks (Comments & Interactive Buttons)**

To automatically receive comments and button clicks in Direct (ChatPlace style):

1. In Facebook Developers, go to **Webhooks** (or **Instagram** → **Configuration**).
2. Set Callback URL: `https://yourdomain.com/api/webhook/instagram`
3. Set Verify Token: value matching your `WEBHOOK_VERIFY_TOKEN` in `backend/.env`
4. Subscribe to the following subscription fields:
   - **`comments`**: for incoming comments under Posts and Reels.
   - **`messages`**: for user replies and Quick Reply button clicks (`✅ Я подписался`).
   - **`messaging_postbacks`**: for interactive postback buttons.

## 📋 **Step 6: Add Test Users (Development)**

1. In Instagram Basic Display → Roles → Roles
2. Add Instagram Testers
3. The Instagram account you want to test with must accept the tester invitation

## 📋 **Step 7: App Review (Production)**

For production use, you'll need:

1. App Review for `instagram_basic` permission
2. Business verification
3. **Privacy Policy URL**: `https://yourdomain.com/api/compliance/privacy-policy`
4. **Terms of Service URL**: `https://yourdomain.com/api/compliance/terms`

**Note**: We've created these compliance endpoints for you. For development, you can use:

- Privacy Policy: `http://localhost:5000/api/compliance/privacy-policy`
- Terms of Service: `http://localhost:5000/api/compliance/terms`

## 🔧 **Common Issues & Solutions**

### Issue: "Invalid platform app"

**Solution**: Make sure your App ID and App Secret are correct and the app has Instagram Basic Display product added.

### Issue: "Redirect URI mismatch"

**Solution**: Ensure the redirect URI in your app settings exactly matches the one in your code.

### Issue: "User not authorized"

**Solution**: Add the Instagram account as a tester in your app settings.

### Issue: "Invalid scope"

**Solution**: Make sure you're only requesting `instagram_basic` scope for Basic Display API.

## 🚀 **Testing Your Setup**

1. Restart your backend server
2. Visit `http://localhost:5173`
3. Click "Login with Instagram"
4. You should be redirected to Instagram's authorization page

## 📝 **Current App Configuration**

Your current credentials in `.env`:

- **Client ID**: `3173855979432880`
- **Client Secret**: `24bee85886c45d9dbcacdfb7c300d076`

⚠️ **These appear to be example/test credentials. You need to replace them with your actual app credentials from Facebook Developers.**

## 🔗 **Useful Links**

- [Instagram Basic Display API Documentation](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Facebook App Dashboard](https://developers.facebook.com/apps/)
- [Instagram API Testing Guide](https://developers.facebook.com/docs/instagram-basic-display-api/getting-started)
