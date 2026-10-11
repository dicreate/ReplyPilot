# ReplyPilot - Comment-to-DM Automation Tool

## 📌 Introduction
The **ReplyPilot** is a full-stack web application designed to streamline interactions on Instagram by automatically responding to comments based on predefined keywords. This tool is particularly useful for businesses, influencers, and content creators who want to maintain engagement with their audience while reducing manual effort. Additionally, it provides analytics and keyword management features to enhance Instagram marketing strategies.

With this tool, users can:
- **Automate Instagram comment replies** based on specific keywords.
- **Manage a list of keywords** to tailor responses effectively.
- **Analyze engagement metrics** using Instagram Graph API.
- **Secure authentication via Instagram OAuth** for seamless login.
- **Monitor and track conversations** in an easy-to-use dashboard.

This project leverages **React** for the frontend and **Node.js with Express** for the backend, connected to a **MongoDB database** to store user data and keywords. Authentication is handled through **Instagram OAuth**, ensuring security and ease of use.

GitHub Repository: [InstagramDMAutomation](https://github.com/Rushi0207/InstagramDMAutomation)

---

## 🚀 Tech Stack
- **Frontend**: React, Vite, React Router
- **Backend**: Node.js, Express, MongoDB
- **Database**: MongoDB
- **Authentication**: Instagram OAuth
- **API Integration**: Instagram Graph API
- **Testing**: Jest, Supertest

---

## 🛠️ Setup & Installation

### 🔧 Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (for local DB setup)
- [Git](https://git-scm.com/)

### 📥 Clone the Repository
```sh
git clone https://github.com/Rushi0207/InstagramDMAutomation.git
cd InstagramDMAutomation
```

### 📦 Install Dependencies
#### Backend
```sh
cd backend
npm install
```
#### Frontend
```sh
cd frontend
npm install
```

---

## 🔑 Environment Variables (.env)
### Backend (`backend/.env`)
```env
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_REDIRECT_URI=http://localhost:5173/auth/instagram/callback
MONGO_URI=mongodb://localhost:27017/instagram_auto_reply
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Frontend (`frontend/.env`)
```env
VITE_INSTAGRAM_CLIENT_ID=your_instagram_client_id
VITE_INSTAGRAM_REDIRECT_URI=http://localhost:5173/auth/instagram/callback
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🔄 Running the Project

### 🚀 Start Backend
```sh
cd backend
npm start
```
Backend runs on: `http://localhost:5000`

### 🚀 Start Frontend
```sh
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 🔐 How to Create an Instagram API
1. **Create a Facebook Developer Account**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Click on **My Apps** → **Create App**
   - Select **Consumer** as the app type

2. **Configure Instagram API**
   - In your app dashboard, go to **Add Products** → Select **Instagram**
   - Click **Set Up** under Instagram Graph API

3. **Create an Instagram App**
   - Go to **Instagram Basic Display** → Click **Create New App**
   - Add the necessary **redirect URIs** under **OAuth Settings**

4. **Get API Credentials**
   - Navigate to **Settings → Basic** and copy **App ID** and **App Secret**
   - In **Instagram Basic Display**, generate a **User Token**

5. **Set Permissions**
   - Ensure the following permissions are enabled: `user_profile`, `user_media`

6. **Generate an Access Token**
   - Use the following API request to exchange the authorization code for an access token:
   ```sh
   curl -X POST "https://api.instagram.com/oauth/access_token" \
   -d "client_id=YOUR_CLIENT_ID" \
   -d "client_secret=YOUR_CLIENT_SECRET" \
   -d "grant_type=authorization_code" \
   -d "redirect_uri=YOUR_REDIRECT_URI" \
   -d "code=YOUR_AUTHORIZATION_CODE"
   ```

---

## 📡 API Endpoints
### 🛠 Authentication
- **`POST /api/auth/instagram`** → Handles Instagram login

### 💬 Comments Auto-Reply
- **`GET /api/comments`** → Fetches comments
- **`POST /api/comments/reply`** → Sends automated replies

### 📊 Analytics
- **`GET /api/analytics`** → Fetches Instagram insights

### 🔑 Keyword Management
- **`GET /api/keywords`** → Get all keywords
- **`POST /api/keywords`** → Add a keyword
- **`DELETE /api/keywords/:id`** → Remove a keyword

---

## ✅ Testing
Run backend tests:
```sh
cd backend
npm test
```

---

## 🐞 Troubleshooting
### ⚠️ Invalid Scope Error (user_profile, user_media)
- Ensure correct **App Permissions** in [Meta Developer Console](https://developers.facebook.com/).
- Check if the **redirect URI** is correctly added in **OAuth Settings**.

### ⚠️ MongoDB Connection Error
- Ensure **MongoDB is running** (`mongod` command).
- Check if **MONGO_URI** is correctly set.

### ⚠️ Instagram OAuth Redirects to Error Page
- Double-check the **client_id, redirect_uri, and scopes** in the login request.
- Verify your app is **Live Mode enabled** in Meta settings.

---

## 📜 License
This project is open-source and available under the MIT License.

---

## 💡 Future Improvements
- ✅ Webhooks for real-time Instagram comment tracking.
- ✅ Admin Dashboard for comment moderation.
- ✅ Improved Analytics UI.

---

## 🤝 Contributing
1. **Fork** the repository.
2. **Create a new branch** (`feature-xyz`)
3. **Commit your changes**
4. **Push** and create a PR.

---

## 🎉 Acknowledgements
Special thanks to the Instagram Graph API documentation!
