import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Don't show navbar on landing page
  if (location.pathname === "/" && !isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/" style={{ color: '#e1306c' }}>
          <i className="fab fa-instagram me-2"></i>
          DM Automation
        </Link>
        <div className="navbar-nav ms-auto">
          {isAuthenticated && (
            <>
              <Link className="nav-link me-3" to="/dashboard">
                <i className="fas fa-tachometer-alt me-1"></i>
                Dashboard
              </Link>
              <button 
                className="btn btn-outline-danger btn-sm" 
                onClick={handleLogout}
                style={{ borderRadius: '20px' }}
              >
                <i className="fas fa-sign-out-alt me-1"></i>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;