import React, { useState, useEffect } from "react";
import api from "../utils/api";
import LoadingSpinner from "./LoadingSpinner";

const KeywordManager = () => {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const emptyFormData = {
    keyword: "",
    message: "",
    messageForNonFollowers: "",
    enableFollowCheckButton: true,
    followButtonText: "✅ Я подписался",
    notFollowedYetMessage: "",
    mediaIds: []
  };

  const [formData, setFormData] = useState(emptyFormData);
  const [postScope, setPostScope] = useState("all"); // "all" | "specific"
  const [recentMedia, setRecentMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [placeholders, setPlaceholders] = useState({});
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [messagePreview, setMessagePreview] = useState("");

  useEffect(() => {
    fetchKeywords();
    fetchPlaceholders();
  }, []);

  const fetchKeywords = async () => {
    try {
      const response = await api.get('/api/keywords');
      
      if (response.data.success) {
        setKeywords(response.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching keywords:", err);
      setError("Failed to load keywords");
      setLoading(false);
    }
  };

  const fetchPlaceholders = async () => {
    try {
      const response = await api.get('/api/keywords/placeholders');
      
      if (response.data.success) {
        setPlaceholders(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching placeholders:", err);
    }
  };

  const previewMessage = async (message) => {
    if (!message.trim()) {
      setMessagePreview("");
      return;
    }

    try {
      const response = await api.post('/api/keywords/preview', { message });
      
      if (response.data.success) {
        setMessagePreview(response.data.data.preview);
      }
    } catch (err) {
      console.error("Error previewing message:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.keyword.trim() || !formData.message.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        // "All posts" = пустой массив (глобально, обратная совместимость)
        mediaIds: postScope === "specific" ? formData.mediaIds : []
      };
      let response;
      if (editingId) {
        response = await api.put(`/api/keywords/${editingId}`, payload);
      } else {
        response = await api.post('/api/keywords', payload);
      }

      if (response.data.success) {
        await fetchKeywords();
        setFormData(emptyFormData);
        setPostScope("all");
        setEditingId(null);
        setMessagePreview("");
      }
    } catch (err) {
      console.error("Error saving keyword:", err);
      setError(err.response?.data?.message || "Failed to save keyword");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (keyword) => {
    const ids = Array.isArray(keyword.mediaIds) ? keyword.mediaIds : [];
    setFormData({
      keyword: keyword.keyword,
      message: keyword.message,
      messageForNonFollowers: keyword.messageForNonFollowers || "",
      enableFollowCheckButton: keyword.enableFollowCheckButton !== undefined ? keyword.enableFollowCheckButton : true,
      followButtonText: keyword.followButtonText || "✅ Я подписался",
      notFollowedYetMessage: keyword.notFollowedYetMessage || "",
      mediaIds: ids
    });
    setPostScope(ids.length > 0 ? "specific" : "all");
    if (ids.length > 0) fetchRecentMedia();
    setEditingId(keyword._id);
    previewMessage(keyword.message);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this keyword?")) return;

    try {
      const response = await api.delete(`/api/keywords/${id}`);

      if (response.data.success) {
        await fetchKeywords();
      }
    } catch (err) {
      console.error("Error deleting keyword:", err);
      setError("Failed to delete keyword");
    }
  };

  const handleCancel = () => {
    setFormData(emptyFormData);
    setPostScope("all");
    setEditingId(null);
    setError(null);
    setMessagePreview("");
  };

  const fetchRecentMedia = async () => {
    setMediaLoading(true);
    setMediaError(null);
    try {
      const response = await api.get('/api/media/recent');
      if (response.data.success) {
        setRecentMedia(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching recent media:", err);
      setMediaError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setMediaLoading(false);
    }
  };

  const handleScopeChange = (scope) => {
    setPostScope(scope);
    if (scope === "specific" && recentMedia.length === 0) {
      fetchRecentMedia();
    }
    if (scope === "all") {
      setFormData({ ...formData, mediaIds: [] });
    }
  };

  const toggleMedia = (mediaId) => {
    const ids = formData.mediaIds || [];
    setFormData({
      ...formData,
      mediaIds: ids.includes(mediaId)
        ? ids.filter((id) => id !== mediaId)
        : [...ids, mediaId]
    });
  };

  const handleMessageChange = (value) => {
    setFormData({ ...formData, message: value });
    previewMessage(value);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner text="Loading keywords..." />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Keyword Management</h5>
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

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label htmlFor="keyword" className="form-label">
              Keyword
            </label>
            <input
              type="text"
              className="form-control"
              id="keyword"
              placeholder="Enter keyword to match in comments"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="message" className="form-label">
              Response Message
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-2"
                onClick={() => setShowPlaceholders(!showPlaceholders)}
              >
                {showPlaceholders ? "Hide" : "Show"} Placeholders
              </button>
            </label>
            <textarea
              className="form-control"
              id="message"
              rows="3"
              placeholder="Enter the message to send as DM"
              value={formData.message}
              onChange={(e) => handleMessageChange(e.target.value)}
              required
            />
            
            {showPlaceholders && (
              <div className="mt-2">
                <small className="text-muted">Available placeholders:</small>
                <div className="mt-1">
                  {Object.entries(placeholders).map(([placeholder, description]) => (
                    <span
                      key={placeholder}
                      className="badge bg-secondary me-1 mb-1"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const newMessage = formData.message + placeholder;
                        handleMessageChange(newMessage);
                      }}
                      title={description}
                    >
                      {placeholder}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {messagePreview && (
              <div className="mt-2">
                <small className="text-muted">Preview:</small>
                <div className="border rounded p-2 bg-light">
                  <small>{messagePreview}</small>
                </div>
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">
              Posts to watch
            </label>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="postScope"
                id="scopeAll"
                checked={postScope === "all"}
                onChange={() => handleScopeChange("all")}
              />
              <label className="form-check-label" htmlFor="scopeAll">
                All posts <small className="text-muted">(default — works under any post)</small>
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="postScope"
                id="scopeSpecific"
                checked={postScope === "specific"}
                onChange={() => handleScopeChange("specific")}
              />
              <label className="form-check-label" htmlFor="scopeSpecific">
                Specific posts only <small className="text-muted">(less load — keyword checked only under selected posts)</small>
              </label>
            </div>

            {postScope === "specific" && (
              <div className="mt-2 border rounded p-2 bg-light">
                {mediaLoading && (
                  <small className="text-muted">Loading posts...</small>
                )}
                {mediaError && (
                  <div className="alert alert-warning py-1 px-2 mb-2">
                    <small>{mediaError}</small>
                    <button type="button" className="btn btn-link btn-sm p-0 ms-2" onClick={fetchRecentMedia}>
                      Retry
                    </button>
                  </div>
                )}
                {!mediaLoading && !mediaError && recentMedia.length === 0 && (
                  <small className="text-muted">No recent posts found</small>
                )}
                <div className="row g-2">
                  {recentMedia.map((media) => (
                    <div key={media.id} className="col-md-6">
                      <div
                        className={`d-flex align-items-center gap-2 border rounded p-1 bg-white ${(formData.mediaIds || []).includes(media.id) ? "border-primary" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleMedia(media.id)}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input ms-1 flex-shrink-0"
                          checked={(formData.mediaIds || []).includes(media.id)}
                          onChange={() => toggleMedia(media.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {(media.media_url || media.thumbnail_url) && (
                          <img
                            src={media.media_url || media.thumbnail_url}
                            alt=""
                            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                          />
                        )}
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <small className="d-block text-truncate">
                            {media.caption ? media.caption.substring(0, 60) : `Post ${media.id}`}
                          </small>
                          <small className="text-muted">
                            {media.timestamp ? new Date(media.timestamp).toLocaleDateString() : ""}
                            {media.comments_count != null && ` • ${media.comments_count} comments`}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {(formData.mediaIds || []).length > 0 && (
                  <small className="text-muted d-block mt-2">
                    Selected: {(formData.mediaIds || []).length} post(s)
                  </small>
                )}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="messageForNonFollowers" className="form-label">
              Response for non-followers <small className="text-muted">(optional)</small>
            </label>
            <textarea
              className="form-control"
              id="messageForNonFollowers"
              rows="2"
              placeholder="If the commenter doesn't follow you — send this instead (empty = same as above)"
              value={formData.messageForNonFollowers}
              onChange={(e) => setFormData({ ...formData, messageForNonFollowers: e.target.value })}
            />
            <div className="form-text">
              Checked live via is_user_follow_business at reply time.
            </div>
          </div>

          {formData.messageForNonFollowers.trim() && (
            <div className="card bg-light mb-3 p-3 border">
              <div className="form-check form-switch mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="enableFollowCheckButton"
                  checked={formData.enableFollowCheckButton}
                  onChange={(e) => setFormData({ ...formData, enableFollowCheckButton: e.target.checked })}
                />
                <label className="form-check-label fw-bold" htmlFor="enableFollowCheckButton">
                  Attach &quot;I subscribed&quot; button in Direct (ChatPlace style)
                </label>
              </div>
              <small className="text-muted mb-2 d-block">
                User taps button in Direct &rarr; bot automatically verifies subscription and sends main response without requiring a new comment!
              </small>

              {formData.enableFollowCheckButton && (
                <div className="row g-2 mt-1">
                  <div className="col-md-6">
                    <label htmlFor="followButtonText" className="form-label small">
                      Button text <small className="text-muted">(max 20 chars)</small>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="followButtonText"
                      maxLength={20}
                      placeholder="✅ Я подписался"
                      value={formData.followButtonText}
                      onChange={(e) => setFormData({ ...formData, followButtonText: e.target.value })}
                    />
                  </div>
                  <div className="col-12 mt-2">
                    <label htmlFor="notFollowedYetMessage" className="form-label small">
                      Message if user tapped button but isn&apos;t subscribed yet <small className="text-muted">(optional)</small>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="notFollowedYetMessage"
                      placeholder="Подписка пока не найдена 🥺 Пожалуйста, подпишитесь на наш профиль и нажмите кнопку снова!"
                      value={formData.notFollowedYetMessage}
                      onChange={(e) => setFormData({ ...formData, notFollowedYetMessage: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !formData.keyword.trim() || !formData.message.trim()}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  {editingId ? "Updating..." : "Adding..."}
                </>
              ) : (
                editingId ? "Update Keyword" : "Add Keyword"
              )}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="keywords-list">
          <h6>Your Keywords ({keywords.length})</h6>
          {keywords.length === 0 ? (
            <p className="text-muted">No keywords added yet. Add your first keyword above!</p>
          ) : (
            <div className="list-group">
              {keywords.map((keyword) => (
                <div key={keyword._id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="mb-1">
                        <span className="badge bg-primary me-2">{keyword.keyword}</span>
                        {Array.isArray(keyword.mediaIds) && keyword.mediaIds.length > 0 ? (
                          <span className="badge bg-warning text-dark me-2" title={keyword.mediaIds.join(", ")}>
                            {keyword.mediaIds.length} post(s)
                          </span>
                        ) : (
                          <span className="badge bg-secondary me-2">All posts</span>
                        )}
                        {keyword.matchCount > 0 && (
                          <small className="text-muted">({keyword.matchCount} matches)</small>
                        )}
                      </h6>
                      <p className="mb-1">{keyword.message}</p>
                      {keyword.messageForNonFollowers && (
                        <p className="mb-1">
                          <small className="text-muted">Non-followers: </small>
                          <small>{keyword.messageForNonFollowers}</small>
                          {keyword.enableFollowCheckButton !== false && (
                            <span className="badge bg-info text-dark ms-2">
                              Button: {keyword.followButtonText || "✅ Я подписался"}
                            </span>
                          )}
                        </p>
                      )}
                      <small className="text-muted">
                        Created: {new Date(keyword.createdAt).toLocaleDateString()}
                        {keyword.lastUsed && (
                          <> • Last used: {new Date(keyword.lastUsed).toLocaleDateString()}</>
                        )}
                      </small>
                    </div>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handleEdit(keyword)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(keyword._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeywordManager;