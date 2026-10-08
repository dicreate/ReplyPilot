# Using ngrok for Facebook App Development

## 📋 **Quick Setup with ngrok**

1. **Install ngrok**: Download from [ngrok.com](https://ngrok.com/) or use:
   ```bash
   # Windows (with Chocolatey)
   choco install ngrok
   
   # Or download directly from ngrok.com
   ```

2. **Start your backend server**:
   ```bash
   cd backend
   npm run dev
   ```

3. **In a new terminal, start ngrok**:
   ```bash
   ngrok http 5000
   ```

4. **Copy the HTTPS URL** (something like `https://abc123.ngrok.io`)

5. **Update your Facebook App settings** with:
   - **Data Deletion URL**: `https://abc123.ngrok.io/api/compliance/data-deletion`
   - **Deauthorize URL**: `https://abc123.ngrok.io/api/compliance/deauthorize`
   - **Privacy Policy**: `https://abc123.ngrok.io/api/compliance/privacy-policy`
   - **Terms of Service**: `https://abc123.ngrok.io/api/compliance/terms`

6. **Update your frontend .env**:
   ```env
   VITE_BACKEND_URL=https://abc123.ngrok.io
   ```

## 🔄 **Alternative: Use a Free Hosting Service**

Deploy your backend to a free service like:
- **Railway**: railway.app
- **Render**: render.com  
- **Heroku**: heroku.com (free tier)

Then use those URLs in your Facebook app settings.