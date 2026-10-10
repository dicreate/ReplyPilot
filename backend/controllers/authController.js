const axios = require("axios");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

exports.instagramLogin = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Authorization code is required" });
  }

  try {
    // Обмен кода Instagram OAuth на токен.
    // ВАЖНО: это endpoint Instagram-платформы, и client_id/secret здесь —
    // ID и секрет *приложения Instagram* (Dashboard → use-case Instagram),
    // а не Facebook-приложения. В backend/.env это INSTAGRAM_CLIENT_ID/SECRET.
    const params = new URLSearchParams();
    params.append("client_id", process.env.INSTAGRAM_CLIENT_ID);
    params.append("client_secret", process.env.INSTAGRAM_CLIENT_SECRET);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", process.env.INSTAGRAM_REDIRECT_URI);
    params.append("code", code);

    const response = await axios.post("https://api.instagram.com/oauth/access_token", params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const { access_token: shortToken, user_id } = response.data;

    // Меняем короткоживущий токен (~1 час) на долгоживущий (~60 дней),
    // иначе приложение перестанет работать через час после логина.
    let access_token = shortToken;
    let tokenExpiresAt = null;
    try {
      const exchangeRes = await axios.get("https://graph.instagram.com/access_token", {
        params: {
          grant_type: "ig_exchange_token",
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
          access_token: shortToken,
        },
      });
      access_token = exchangeRes.data.access_token;
      tokenExpiresAt = new Date(Date.now() + exchangeRes.data.expires_in * 1000);
      logger.info(`Exchanged for long-lived token, expires in ${exchangeRes.data.expires_in}s`);
    } catch (exchangeErr) {
      logger.warn(`Long-lived exchange failed, using short-lived token: ${exchangeErr.response?.data?.error?.message || exchangeErr.message}`);
    }

    // Fetch user profile and Instagram business accounts.
    // Токен Instagram-платформы: профиль тянем из graph.instagram.com.
    // ВАЖНО #1: свежеобменянный токен первые секунды может давать 400
    // (propagation на стороне Meta) — стучим в /me с ретраями.
    // ВАЖНО #2: ID берем СТРОКОЙ из /me. 17-значные ID не влезают в точность
    // JS Number, а user_id из ответа обмена axios уже распарсил как Number —
    // последний разряд может быть обрезан (было: ...773 -> ...772 в БД,
    // и private reply падал с "Object does not exist").
    let userProfile = null;
    let instagramAccounts = [];
    try {
      let igData = null;
      for (let attempt = 1; attempt <= 4 && !igData; attempt++) {
        try {
          if (attempt > 1) await new Promise((r) => setTimeout(r, 2000));
          const igRes = await axios.get(`https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`);
          igData = igRes.data;
        } catch (e) {
          logger.warn(`Instagram profile attempt ${attempt}/4 failed: ${e.response?.status || e.message}`);
        }
      }
      try {
        // ID берем только если он реально есть (String(undefined) нам не нужен).
        if (igData && igData.id != null) {
          userProfile = { id: String(igData.id), name: igData.username };
        } else {
          const profileResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name&access_token=${access_token}`);
          if (profileResponse.data && profileResponse.data.id != null) {
            userProfile = { id: String(profileResponse.data.id), name: profileResponse.data.name };
          }
        }
      } catch (fbErr) {
        logger.warn(`Facebook profile fallback failed: ${fbErr.response?.status || fbErr.message}`);
      }
      
      // Get user's Facebook Pages
      const pagesResponse = await axios.get(`https://graph.facebook.com/me/accounts?fields=instagram_business_account&access_token=${access_token}`);
      
      // Extract Instagram business accounts
      if (pagesResponse.data.data) {
        for (const page of pagesResponse.data.data) {
          if (page.instagram_business_account) {
            instagramAccounts.push({
              pageId: page.id,
              instagramId: page.instagram_business_account.id,
              pageAccessToken: page.access_token
            });
          }
        }
      }
    } catch (profileErr) {
      logger.warn(`Failed to fetch user profile: ${profileErr.message}`);
    }

    // Save user in DB (use Instagram user ID as primary key for this flow).
    // Атомарный upsert вместо findOne + save: фронт может прислать callback
    // дважды (напр. двойной эффект StrictMode), и два параллельных save
    // падали со вторым E11000 duplicate key на уникальном индексе.
    // Строковый ключ. Приоритет — /me (там ID всегда строка). user_id из обмена
    // берем только если пришел строкой: число уже может быть обрезано парсером
    // (17-значные ID мимо точности Number: было ...773 -> ...772 в БД,
    // и private reply падал с "Object does not exist").
    const exchangeId = typeof user_id === 'string' ? user_id : null;
    if (user_id != null && typeof user_id !== 'string') {
      logger.warn('Exchange user_id is not a string, ignoring it for primary key (precision risk)');
    }
    const primaryKey = userProfile?.id || exchangeId || (user_id != null ? String(user_id) : null);
    if (!userProfile?.id && !exchangeId) {
      logger.warn('No string profile id available, falling back to exchange user_id (may be precision-damaged)');
    }
    const updateFields = {
      accessToken: access_token,
      instagramAccounts: instagramAccounts,
      lastLogin: new Date(),
      updatedAt: new Date()
    };
    if (tokenExpiresAt) updateFields.tokenExpiresAt = tokenExpiresAt;
    if (userProfile?.name) updateFields.username = userProfile.name;

    let user;
    try {
      user = await User.findOneAndUpdate(
        { facebookId: primaryKey },
        {
          $set: updateFields,
          $setOnInsert: {
            facebookId: primaryKey,
            instagramId: primaryKey || instagramAccounts[0]?.instagramId || null
          }
        },
        { upsert: true, new: true, runValidators: true }
      );
    } catch (dbErr) {
      // Остаточный рейс (напр. коллизия уникального instagramId у разных
      // юзеров): подхватываем существующего вместо 500.
      if (dbErr?.code === 11000) {
        logger.warn(`Duplicate key on login upsert, loading existing user: ${dbErr.message}`);
        user = await User.findOne({ facebookId: primaryKey });
        if (!user) throw dbErr;
        Object.assign(user, updateFields);
        await user.save();
      } else {
        throw dbErr;
      }
    }

    logger.info(`User ${user.username || user.instagramId} logged in successfully`);

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.status(200).json({ 
      token,
      user: {
        id: user._id,
        instagramId: user.instagramId,
        username: user.username
      }
    });
  } catch (err) {
    logger.error(`Instagram login error: ${JSON.stringify(err.response?.data || err.message)}`);
    res.status(500).json({ message: "Login failed", error: err.response?.data || err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-accessToken');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      instagramId: user.instagramId,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch (err) {
    logger.error(`Error fetching current user: ${err.message}`);
    res.status(500).json({ message: "Failed to fetch user information" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // For Instagram Basic Display API, we need to refresh the long-lived token
    // This is a simplified version - in production, you'd implement proper token refresh
    try {
      const refreshResponse = await axios.get(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${user.accessToken}`);
      
      user.accessToken = refreshResponse.data.access_token;
      await user.save();

      logger.info(`Token refreshed for user ${user.username || user.instagramId}`);
      
      res.status(200).json({ message: "Token refreshed successfully" });
    } catch (refreshErr) {
      logger.warn(`Token refresh failed for user ${user.username || user.instagramId}: ${refreshErr.message}`);
      res.status(401).json({ message: "Token refresh failed, please re-authenticate" });
    }
  } catch (err) {
    logger.error(`Error refreshing token: ${err.message}`);
    res.status(500).json({ message: "Failed to refresh token" });
  }
};
