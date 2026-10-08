import React, { useEffect, useState } from "react";
import axios from "axios";

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [keywordStats, setKeywordStats] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch all analytics data
      const [summaryRes, keywordRes, timelineRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/summary?days=${selectedPeriod}`, config),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/keywords`, config),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/timeline?days=${selectedPeriod}`, config)
      ]);

      if (summaryRes.data.success) setSummary(summaryRes.data.data);
      if (keywordRes.data.success) setKeywordStats(keywordRes.data.data);
      if (timelineRes.data.success) setTimeline(timelineRes.data.data);

    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  const getRecentActivity = () => {
    if (!timeline?.timeline) return [];
    return timeline.timeline.slice(-7); // Last 7 days
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 mb-0">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            {error}
            <button 
              className="btn btn-sm btn-outline-danger ms-2" 
              onClick={fetchAnalytics}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Analytics Dashboard</h5>
          <select 
            className="form-select form-select-sm" 
            style={{ width: 'auto' }}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>
      <div className="card-body">
        {/* Navigation Tabs */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'keywords' ? 'active' : ''}`}
              onClick={() => setActiveTab('keywords')}
            >
              Keywords
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
          </li>
        </ul>

        {/* Summary Tab */}
        {activeTab === 'summary' && summary && (
          <div>
            <div className="row mb-4">
              <div className="col-6">
                <div className="card bg-primary text-white">
                  <div className="card-body text-center">
                    <h4 className="card-title">{formatNumber(summary.totalDmsSent)}</h4>
                    <p className="card-text">DMs Sent</p>
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="card bg-info text-white">
                  <div className="card-body text-center">
                    <h4 className="card-title">{formatNumber(summary.totalCommentsProcessed)}</h4>
                    <p className="card-text">Comments Processed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-6">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h4 className="card-title">{summary.successRate}%</h4>
                    <p className="card-text">Success Rate</p>
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="card bg-warning text-white">
                  <div className="card-body text-center">
                    <h4 className="card-title">{formatNumber(summary.totalKeywordMatches)}</h4>
                    <p className="card-text">Keyword Matches</p>
                  </div>
                </div>
              </div>
            </div>

            {summary.totalErrors > 0 && (
              <div className="alert alert-warning">
                <strong>Errors:</strong> {formatNumber(summary.totalErrors)} errors occurred during processing.
              </div>
            )}

            <div className="mt-3">
              <h6>Recent Activity (Last 7 Days)</h6>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>DMs</th>
                      <th>Comments</th>
                      <th>Matches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getRecentActivity().map((day, index) => (
                      <tr key={index}>
                        <td>{new Date(day.date).toLocaleDateString()}</td>
                        <td>{day.dmsSent}</td>
                        <td>{day.commentsProcessed}</td>
                        <td>{day.keywordMatches}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && keywordStats && (
          <div>
            <div className="mb-3">
              <h6>Top Performing Keywords</h6>
              {keywordStats.keywordStats.length === 0 ? (
                <p className="text-muted">No keywords created yet.</p>
              ) : (
                <div className="list-group">
                  {keywordStats.keywordStats.slice(0, 5).map((keyword, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <span className="badge bg-primary me-2">{keyword.keyword}</span>
                        {keyword.lastUsed && (
                          <small className="text-muted">
                            Last used: {new Date(keyword.lastUsed).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                      <span className="badge bg-success rounded-pill">
                        {keyword.matchCount} matches
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {keywordStats.recentMatches.length > 0 && (
              <div className="mt-4">
                <h6>Recent Matches (Last 7 Days)</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Keyword</th>
                        <th>Matches</th>
                        <th>DMs Sent</th>
                        <th>Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywordStats.recentMatches.map((match, index) => (
                        <tr key={index}>
                          <td>
                            <span className="badge bg-primary">{match._id}</span>
                          </td>
                          <td>{match.count}</td>
                          <td>{match.dmsSent}</td>
                          <td>
                            {match.count > 0 ? 
                              `${((match.dmsSent / match.count) * 100).toFixed(1)}%` : 
                              '0%'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && timeline && (
          <div>
            <h6>Activity Timeline</h6>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>DMs Sent</th>
                    <th>Comments Processed</th>
                    <th>Keyword Matches</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.timeline.slice(-10).reverse().map((day, index) => (
                    <tr key={index}>
                      <td>{new Date(day.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${day.dmsSent > 0 ? 'bg-success' : 'bg-secondary'}`}>
                          {day.dmsSent}
                        </span>
                      </td>
                      <td>{day.commentsProcessed}</td>
                      <td>{day.keywordMatches}</td>
                      <td>
                        {day.errors > 0 ? (
                          <span className="badge bg-danger">{day.errors}</span>
                        ) : (
                          <span className="badge bg-success">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {timeline.timeline.every(day => day.dmsSent === 0 && day.commentsProcessed === 0) && (
              <div className="alert alert-info mt-3">
                <strong>No activity yet!</strong> Start processing comments to see your analytics data.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;