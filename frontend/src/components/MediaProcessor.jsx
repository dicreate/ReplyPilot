import React, { useState, useEffect } from "react";
import axios from "axios";

const MediaProcessor = () => {
  const [mediaId, setMediaId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [recentMedia, setRecentMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [sincePreset, setSincePreset] = useState("48"); // 48 default | all | 24 | 168 | 720 | custom
  const [customHours, setCustomHours] = useState("");

  useEffect(() => {
    fetchRecentMedia();
    fetchProcessingHistory();
  }, []);

  const fetchRecentMedia = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/media/recent`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setRecentMedia(response.data.data);
      }
      setLoadingMedia(false);
    } catch (err) {
      console.error("Error fetching recent media:", err);
      setLoadingMedia(false);
    }
  };

  const fetchProcessingHistory = async (errorsOnly = showErrorsOnly) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/media/history?limit=10${errorsOnly ? "&failed=true" : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setHistory(response.data.data.history);
        setStorageInfo(response.data.data.storage || null);
      }
    } catch (err) {
      console.error("Error fetching processing history:", err);
    }
  };

  const toggleErrorsOnly = () => {
    const next = !showErrorsOnly;
    setShowErrorsOnly(next);
    fetchProcessingHistory(next);
  };

  const processMedia = async (selectedMediaId = null) => {
    const targetMediaId = selectedMediaId || mediaId;
    
    if (!targetMediaId.trim()) {
      setError("Please enter a media ID or select from recent posts");
      return;
    }

    // Возрастной фильтр: часы назад; all = за всё время (поле не шлем)
    let sinceHours = null;
    if (sincePreset === "custom") {
      sinceHours = Number(customHours);
      if (!Number.isFinite(sinceHours) || sinceHours <= 0) {
        setError("Custom period must be a positive number of hours");
        return;
      }
    } else if (sincePreset !== "all") {
      sinceHours = Number(sincePreset);
    }

    setProcessing(true);
    setError(null);
    setResults(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/media/process/${targetMediaId}`,
        sinceHours !== null ? { sinceHours } : {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setResults(response.data.data);
        setMediaId(""); // Clear the input
        await fetchProcessingHistory(); // Refresh history
      }
    } catch (err) {
      console.error("Error processing media:", err);
      setError(err.response?.data?.message || "Failed to process media");
    } finally {
      setProcessing(false);
    }
  };

  const extractMediaId = (url) => {
    // Extract media ID from Instagram URL
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return url; // Return as-is if no pattern matches
  };

  const handleInputChange = (value) => {
    // If it looks like a URL, extract the media ID
    if (value.includes('instagram.com')) {
      const extractedId = extractMediaId(value);
      setMediaId(extractedId);
    } else {
      setMediaId(value);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Comment Processor</h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {/* Manual Media ID Input */}
        <div className="mb-4">
          <label htmlFor="mediaId" className="form-label">
            Instagram Media ID or URL
          </label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              id="mediaId"
              placeholder="Enter media ID or paste Instagram URL"
              value={mediaId}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={processing}
            />
            <button
              className="btn btn-primary"
              onClick={() => processMedia()}
              disabled={processing || !mediaId.trim()}
            >
              {processing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing...
                </>
              ) : (
                "Process Comments"
              )}
            </button>
          </div>
          <div className="form-text">
            You can paste an Instagram post URL or enter the media ID directly
          </div>
        </div>

        {/* Age filter */}
        <div className="mb-4">
          <label htmlFor="sincePreset" className="form-label">
            Comments from
          </label>
          <div className="d-flex gap-2 align-items-center">
            <select
              id="sincePreset"
              className="form-select"
              style={{ maxWidth: 220 }}
              value={sincePreset}
              onChange={(e) => setSincePreset(e.target.value)}
              disabled={processing}
            >
              <option value="all">All time</option>
              <option value="24">Last 24 hours</option>
              <option value="48">Last 2 days</option>
              <option value="168">Last 7 days</option>
              <option value="720">Last 30 days</option>
              <option value="custom">Custom...</option>
            </select>
            {sincePreset === "custom" && (
              <div className="input-group" style={{ maxWidth: 200 }}>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="Hours"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  disabled={processing}
                />
                <span className="input-group-text">h</span>
              </div>
            )}
          </div>
          <div className="form-text">
            Only comments newer than the selected period are processed. Older ones are skipped (and can be picked up later with a wider period).
          </div>
        </div>

        {/* Recent Media Posts */}
        <div className="mb-4">
          <h6>Your Recent Posts</h6>
          {loadingMedia ? (
            <div className="text-center">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-2">Loading recent posts...</span>
            </div>
          ) : recentMedia.length === 0 ? (
            <p className="text-muted">No recent posts found</p>
          ) : (
            <div className="row">
              {recentMedia.slice(0, 6).map((media) => (
                <div key={media.id} className="col-md-4 mb-3">
                  <div className="card">
                    <img
                      src={media.media_url || media.thumbnail_url}
                      className="card-img-top"
                      alt="Post"
                      style={{ height: "150px", objectFit: "cover" }}
                    />
                    <div className="card-body p-2">
                      <p className="card-text small">
                        {media.caption ? 
                          media.caption.substring(0, 50) + (media.caption.length > 50 ? "..." : "") 
                          : "No caption"
                        }
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {media.comments_count || 0} comments
                        </small>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => processMedia(media.id)}
                          disabled={processing}
                        >
                          Process
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processing Results */}
        {results && (
          <div className="mb-4">
            <h6>Processing Results</h6>
            <div className="row">
              <div className="col-md-3">
                <div className="card bg-light">
                  <div className="card-body text-center">
                    <h5 className="card-title text-primary">{results.totalComments}</h5>
                    <p className="card-text small">Total Comments</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-light">
                  <div className="card-body text-center">
                    <h5 className="card-title text-info">{results.newComments}</h5>
                    <p className="card-text small">New Comments</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-light">
                  <div className="card-body text-center">
                    <h5 className="card-title text-warning">{results.keywordMatches}</h5>
                    <p className="card-text small">Keyword Matches</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-light">
                  <div className="card-body text-center">
                    <h5 className="card-title text-success">{results.dmsSent}</h5>
                    <p className="card-text small">DMs Sent</p>
                  </div>
                </div>
              </div>
            </div>

            {results.skippedByAge > 0 && (
              <div className="alert alert-info mt-3">
                {results.skippedByAge} comment(s) skipped by age filter. Use a wider period to process them.
              </div>
            )}

            {results.errors > 0 && (
              <div className="alert alert-warning mt-3">
                <strong>Warning:</strong> {results.errors} error(s) occurred during processing.
              </div>
            )}

            {results.processedComments && results.processedComments.length > 0 && (
              <div className="mt-3">
                <h6>Processed Comments</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Author</th>
                        <th>Comment</th>
                        <th>Keyword</th>
                        <th>DM Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.processedComments.map((comment, index) => (
                        <tr key={index}>
                          <td>@{comment.author}</td>
                          <td>{comment.text.substring(0, 50)}...</td>
                          <td>
                            {comment.keywordMatched ? (
                              <span className="badge bg-primary">{comment.keywordMatched}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {comment.dmSent ? (
                              <span className="badge bg-success">✓</span>
                            ) : (
                              <span className="badge bg-secondary">-</span>
                            )}
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

        {/* Processing History */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6>Processing History</h6>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? "Hide" : "Show"} History
            </button>
          </div>

          {storageInfo && (
            <p className="text-muted small mb-2">
              Stored: {storageInfo.total} comment(s)
              {storageInfo.oldestProcessedAt && (
                <> • oldest: {new Date(storageInfo.oldestProcessedAt).toLocaleDateString()}</>
              )}
              {storageInfo.ttlDays && (
                <> • auto-delete after {storageInfo.ttlDays} days</>
              )}
            </p>
          )}

          {showHistory && (
            <div>
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="errorsOnly"
                  checked={showErrorsOnly}
                  onChange={toggleErrorsOnly}
                />
                <label className="form-check-label small" htmlFor="errorsOnly">
                  Show errors only
                </label>
              </div>
            <div className="table-responsive">
              {history.length === 0 ? (
                <p className="text-muted">No processing history yet</p>
              ) : (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Media ID</th>
                      <th>Author</th>
                      <th>Comment</th>
                      <th>Keyword</th>
                      <th>DM Sent</th>
                      {showErrorsOnly && <th>Error</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item._id}>
                        <td>{new Date(item.processedAt).toLocaleDateString()}</td>
                        <td className="font-monospace small">{item.mediaId}</td>
                        <td>@{item.commentAuthor}</td>
                        <td>{item.commentText.substring(0, 30)}...</td>
                        <td>
                          {item.keywordMatched ? (
                            <span className="badge bg-primary">{item.keywordMatched}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {item.dmSent ? (
                            <span className="badge bg-success">✓</span>
                          ) : item.errorMessage ? (
                            <span className="badge bg-danger" title={item.errorMessage}>✗</span>
                          ) : (
                            <span className="badge bg-secondary">-</span>
                          )}
                        </td>
                        {showErrorsOnly && (
                          <td className="small text-danger">{item.errorMessage}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaProcessor;