import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const OAuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Код авторизации одноразовый, а StrictMode монтирует эффект дважды —
  // без гарда уходят два параллельных POST и второй падает с E11000.
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(`Instagram authentication failed: ${errorParam}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('No authorization code received from Instagram');
          setLoading(false);
          return;
        }

        // Exchange code for access token
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/instagram`, {
          code: code
        });

        // Store token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.response?.data?.message || 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Completing Instagram authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Authentication Error</h4>
          <p>{error}</p>
          <hr />
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/')}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;