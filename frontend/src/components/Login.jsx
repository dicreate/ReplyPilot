import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Вход — через Instagram OAuth (endpoint instagram.com).
      // ВАЖНО: client_id здесь — это ID *приложения Instagram* (Dashboard → use-case
      // Instagram → "ID приложения Instagram", у нас 1627491405694611),
      // а НЕ ID Facebook-приложения. Смешивание дает Invalid platform app,
      // а instagram_business-скоупы на facebook-диалоге дают Invalid Scopes.
      // Значения берутся из frontend/.env.
      const clientId = import.meta.env.VITE_INSTAGRAM_APP_ID || '1627491405694611';
      const redirectUri = import.meta.env.VITE_INSTAGRAM_REDIRECT_URI || 'http://localhost:5173/auth/instagram/callback';
      // Скоупы = только обязательные из секции 1 use-case'а Instagram.
      const scope = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments';
      window.location.href = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="container">
            <div className="row align-items-center min-vh-100">
              <div className="col-lg-6">
                <div className="hero-content">
                  <h1 className="hero-title">
                    Automate Your Instagram
                    <span className="gradient-text"> Engagement</span>
                  </h1>
                  <p className="hero-subtitle">
                    Transform your Instagram presence with intelligent DM
                    automation. Respond to comments instantly with personalized
                    messages and grow your audience effortlessly.
                  </p>
                  <div className="hero-buttons">
                    <button
                      className="btn btn-primary btn-lg me-3"
                      onClick={handleLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <i className="fab fa-instagram me-2"></i>
                          Get Started Free
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-light btn-lg"
                      onClick={() => scrollToSection("features")}
                    >
                      Learn More
                    </button>
                  </div>
                  <div className="hero-stats">
                    <div className="stat-item">
                      <span className="stat-number">10K+</span>
                      <span className="stat-label">Messages Automated</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">500+</span>
                      <span className="stat-label">Happy Users</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">24/7</span>
                      <span className="stat-label">Automation</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="hero-image">
                  <div className="phone-mockup">
                    <div className="phone-screen">
                      <div className="instagram-interface">
                        <div className="ig-header">
                          <div className="ig-profile-pic"></div>
                          <div className="ig-username">your_brand</div>
                        </div>
                        <div className="ig-post"></div>
                        <div className="ig-comments">
                          <div className="ig-comment">
                            <span className="comment-user">follower1:</span>
                            <span className="comment-text">Love this! 😍</span>
                          </div>
                          <div className="ig-comment automated">
                            <span className="comment-user">your_brand:</span>
                            <span className="comment-text">
                              Thank you! Check your DMs 💌
                            </span>
                            <span className="automated-badge">AUTO</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center mb-5">
              <h2 className="section-title">
                Powerful Features for Instagram Growth
              </h2>
              <p className="section-subtitle">
                Everything you need to automate your Instagram engagement and
                build meaningful connections with your audience.
              </p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-robot"></i>
                </div>
                <h4>Smart Automation</h4>
                <p>
                  Automatically respond to comments with personalized messages
                  based on keywords you define.
                </p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <h4>Instant DM Responses</h4>
                <p>
                  Send direct messages instantly when specific keywords are
                  mentioned in your post comments.
                </p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h4>Analytics Dashboard</h4>
                <p>
                  Track your engagement metrics, response rates, and automation
                  performance in real-time.
                </p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-tags"></i>
                </div>
                <h4>Keyword Management</h4>
                <p>
                  Create and manage unlimited keyword-response pairs with
                  dynamic placeholders.
                </p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h4>Secure & Reliable</h4>
                <p>
                  Built with enterprise-grade security and reliability. Your
                  data is always protected.
                </p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <h4>24/7 Monitoring</h4>
                <p>
                  Continuous monitoring of your posts ensures no engagement
                  opportunity is missed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center mb-5">
              <h2 className="section-title">How It Works</h2>
              <p className="section-subtitle">
                Get started in minutes with our simple 3-step process
              </p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Connect Instagram</h4>
                  <p>
                    Securely connect your Instagram account using official
                    Instagram OAuth.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Set Keywords</h4>
                  <p>
                    Define keywords and create personalized response messages
                    for each trigger.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Automate & Grow</h4>
                  <p>
                    Sit back and watch as your engagement increases with
                    automated responses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <h2 className="cta-title">Ready to Automate Your Instagram?</h2>
              <p className="cta-subtitle">
                Join thousands of creators and businesses who are already
                growing their Instagram presence with automation.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Connecting...
                  </>
                ) : (
                  <>
                    <i className="fab fa-instagram me-2"></i>
                    Start Free Today
                  </>
                )}
              </button>
              <p className="cta-note">
                No credit card required • Free forever plan available
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <h5>ReplyPilot</h5>
              <p>
                Automate your Instagram engagement and grow your audience with
                intelligent DM responses.
              </p>
            </div>
            <div className="col-lg-6 text-lg-end">
              <p>&copy; 2024 ReplyPilot. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
