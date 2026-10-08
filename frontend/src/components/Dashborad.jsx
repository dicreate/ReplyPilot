import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import KeywordManager from "./KeywordManager";
import Analytics from "./Analytics";
import MediaProcessor from "./MediaProcessor";
import axios from "axios";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user:", err);
        
        if (err.response?.status === 401) {
          // Token expired or invalid, redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
        } else {
          setError("Failed to load user information");
          setLoading(false);
        }
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="welcome-section">
                <h1 className="dashboard-title">
                  Welcome back, <span className="text-gradient">{user?.username || 'Instagram User'}</span>! 👋
                </h1>
                <p className="dashboard-subtitle">
                  Manage your Instagram automation and track your engagement performance.
                </p>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <div className="quick-stats">
                <div className="stat-badge">
                  <i className="fas fa-robot"></i>
                  <span>Automation Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Media Processor - Full Width */}
        <div className="row mb-4">
          <div className="col-12">
            <MediaProcessor />
          </div>
        </div>
        
        {/* Keyword Manager and Analytics */}
        <div className="row g-4">
          <div className="col-lg-6">
            <KeywordManager />
          </div>
          <div className="col-lg-6">
            <Analytics />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;