# 🚨 URGENT: Update Your App Credentials

## Current Problem
You're still using example credentials that don't work:
- INSTAGRAM_CLIENT_ID=3173855979432880 (FAKE)
- INSTAGRAM_CLIENT_SECRET=24bee85886c45d9dbcacdfb7c300d076 (FAKE)

## Solution: Get Real Credentials

### 1. Go to Facebook Developers
- Visit: https://developers.facebook.com/apps/
- Find your app (the one you set up webhooks for)
- Go to Settings → Basic

### 2. Copy Your Real Credentials
- App ID: [Copy this number]
- App Secret: [Click "Show" and copy]

### 3. Update backend/.env
```env
# Replace with YOUR REAL credentials
INSTAGRAM_CLIENT_ID=YOUR_REAL_APP_ID_HERE
INSTAGRAM_CLIENT_SECRET=YOUR_REAL_APP_SECRET_HERE
INSTAGRAM_REDIRECT_URI=https://xr9mbjzk-5173.inc1.devtunnels.ms/auth/instagram/callback
```

### 4. Update frontend/.env
```env
# Use the same REAL App ID
VITE_INSTAGRAM_CLIENT_ID=YOUR_REAL_APP_ID_HERE
VITE_INSTAGRAM_REDIRECT_URI=https://xr9mbjzk-5173.inc1.devtunnels.ms/auth/instagram/callback
VITE_BACKEND_URL=https://56a8d20f03fb.ngrok-free.app
```

### 5. Restart Your Servers
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm run dev
```

## Why This Matters
- The Graph API Explorer token you have is from a REAL app
- But your code is still trying to use FAKE credentials
- This mismatch causes "Invalid platform app" error

## After Updating
- ✅ "Invalid platform app" error will be fixed
- ✅ Your app will work with real Instagram accounts
- ✅ OAuth flow will work properly
- ✅ Webhooks will receive real events

## Quick Check
Your real App ID should be different from 3173855979432880
If it's the same, you're still using example credentials!