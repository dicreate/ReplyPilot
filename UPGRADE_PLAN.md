# Instagram DM Automation - Upgrade Plan

## 🚨 **CRITICAL ISSUES IN CURRENT IMPLEMENTATION**

### **Current State Analysis**

- ❌ Using Instagram Basic Display API (personal accounts only)
- ❌ DM sending is simulated (no real messages sent)
- ❌ Manual comment polling (no real-time webhooks)
- ❌ Missing business account requirements
- ❌ No Page access token management
- ❌ Limited to test users only

### **Production Requirements**

- ✅ Instagram Business API with proper permissions
- ✅ Real-time webhook subscriptions
- ✅ Actual DM sending via Private Replies or Messaging API
- ✅ Multi-tenant business account support
- ✅ App Review compliance for production use

## 📋 **REQUIRED UPDATES**

### **Phase 1: API Migration (Critical)**

#### **1.1 Update Authentication Flow**

**Current**: Instagram Basic Display OAuth

```javascript
// Current (WRONG for business use)
const response = await axios.post("https://api.instagram.com/oauth/access_token", ...);
```

**Required**: Facebook Login for Business

```javascript
// Required for business accounts
const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=pages_show_list,instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_messaging&response_type=code`;
```

#### **1.2 Token Management Updates**

**Add to User Model**:

```javascript
{
  pageId: String,              // Facebook Page ID
  pageAccessToken: String,     // Page access token
  igBusinessAccountId: String, // Instagram Business Account ID
  longLivedToken: String,      // 60-day token
  tokenExpiresAt: Date,        // Token expiry tracking
}
```

#### **1.3 Real DM Sending Implementation**

**Replace simulated DM with**:

```javascript
// Option A: Private Replies (recommended)
POST https://graph.facebook.com/v18.0/{COMMENT_ID}/private_replies
{
  "message": "Your automated response here",
  "access_token": "{PAGE_ACCESS_TOKEN}"
}

// Option B: Instagram Messaging API
POST https://graph.facebook.com/v18.0/{IG_USER_ID}/messages
{
  "recipient": {"id": "{INSTAGRAM_USER_SCOPED_ID}"},
  "message": {"text": "Your message here"}
}
```

### **Phase 2: Webhook Implementation (High Priority)**

#### **2.1 Add Webhook Endpoint**

```javascript
// Required webhook verification and processing
app.get("/webhook", (req, res) => {
  // Verify webhook subscription
});

app.post("/webhook", (req, res) => {
  // Process real-time comment events
  // Verify X-Hub-Signature-256
  // Handle comment events immediately
});
```

#### **2.2 Webhook Subscription Management**

```javascript
// Subscribe to Instagram webhooks
POST https://graph.facebook.com/v18.0/{APP_ID}/subscriptions
{
  "object": "instagram",
  "callback_url": "https://yourdomain.com/webhook",
  "fields": "comments,messages",
  "verify_token": "your_verify_token"
}
```

### **Phase 3: Business Account Support (High Priority)**

#### **3.1 Page and IG Account Discovery**

```javascript
// Get user's Facebook Pages
GET https://graph.facebook.com/v18.0/me/accounts?access_token={USER_TOKEN}

// Get Instagram Business Account from Page
GET https://graph.facebook.com/v18.0/{PAGE_ID}?fields=instagram_business_account&access_token={PAGE_TOKEN}
```

#### **3.2 Multi-tenant Architecture**

- Store multiple IG accounts per user
- Handle Page-level permissions
- Manage token refresh cycles
- Queue system for rate limiting

### **Phase 4: App Review Preparation (Medium Priority)**

#### **4.1 Required Permissions**

- `instagram_manage_messages` (Advanced Access)
- `instagram_manage_comments` (Advanced Access)
- `pages_messaging` (Advanced Access)
- `pages_show_list` (Standard Access)

#### **4.2 Business Verification Requirements**

- Business Manager setup
- Company documentation
- App Review submission with demo video
- Privacy Policy and Terms (✅ Already implemented)

## 🚀 **IMPLEMENTATION PRIORITY**

### **Immediate (Week 1)**

1. ✅ Fix Instagram API credentials issue
2. 🔄 Implement real DM sending (Private Replies)
3. 🔄 Add webhook endpoint and verification

### **Short-term (Week 2-3)**

1. 🔄 Migrate to Facebook Login for Business
2. 🔄 Add Page and IG Business Account management
3. 🔄 Implement real-time webhook processing

### **Medium-term (Month 1)**

1. 🔄 App Review submission preparation
2. 🔄 Business verification process
3. 🔄 Production deployment with proper domains

## 💡 **QUICK WINS**

### **Option 1: Minimal Viable Update**

- Keep current auth but add real Private Replies API
- Add basic webhook endpoint
- Test with development accounts

### **Option 2: Full Production Upgrade**

- Complete migration to Instagram Business API
- Full webhook system with signature verification
- Multi-tenant business account support
- App Review ready

## 🎯 **RECOMMENDATION**

**Start with Option 1** to get real DM sending working quickly, then upgrade to Option 2 for production readiness.

The current implementation is a good foundation but needs these critical updates to actually send DMs and work with business accounts.
