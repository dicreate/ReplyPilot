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
    mediaIds: [],
    buttons: [],
    steps: []
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

  // Неисчезающие кнопки начального ответа (button template): max 3.
  const updateButton = (index, field, value) => {
    const buttons = [...(formData.buttons || [])];
    buttons[index] = { ...buttons[index], [field]: value };
    setFormData({ ...formData, buttons });
  };

  const addButton = () => {
    if ((formData.buttons || []).length >= 3) return;
    setFormData({
      ...formData,
      buttons: [...(formData.buttons || []), { title: "", type: "url", url: "", payload: "" }]
    });
  };

  const removeButton = (index) => {
    setFormData({ ...formData, buttons: (formData.buttons || []).filter((_, i) => i !== index) });
  };

  // Управление шагами воронки (Funnel Steps)
  const addStep = () => {
    const steps = [...(formData.steps || [])];
    const newIndex = steps.length + 1;
    steps.push({
      id: `step_${Date.now()}_${newIndex}`,
      name: `Шаг ${newIndex}`,
      message: "",
      buttons: []
    });
    setFormData({ ...formData, steps });
  };

  const updateStep = (index, field, value) => {
    const steps = [...(formData.steps || [])];
    steps[index] = { ...steps[index], [field]: value };
    setFormData({ ...formData, steps });
  };

  const removeStep = (index) => {
    const steps = (formData.steps || []).filter((_, i) => i !== index);
    setFormData({ ...formData, steps });
  };

  const addStepButton = (stepIndex) => {
    const steps = [...(formData.steps || [])];
    const currentBtns = steps[stepIndex].buttons || [];
    if (currentBtns.length >= 3) return;
    steps[stepIndex] = {
      ...steps[stepIndex],
      buttons: [...currentBtns, { title: "", type: "url", url: "", payload: "" }]
    };
    setFormData({ ...formData, steps });
  };

  const updateStepButton = (stepIndex, btnIndex, field, value) => {
    const steps = [...(formData.steps || [])];
    const currentBtns = [...(steps[stepIndex].buttons || [])];
    currentBtns[btnIndex] = { ...currentBtns[btnIndex], [field]: value };
    steps[stepIndex] = { ...steps[stepIndex], buttons: currentBtns };
    setFormData({ ...formData, steps });
  };

  const removeStepButton = (stepIndex, btnIndex) => {
    const steps = [...(formData.steps || [])];
    const currentBtns = (steps[stepIndex].buttons || []).filter((_, i) => i !== btnIndex);
    steps[stepIndex] = { ...steps[stepIndex], buttons: currentBtns };
    setFormData({ ...formData, steps });
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
      mediaIds: ids,
      buttons: Array.isArray(keyword.buttons)
        ? keyword.buttons.map((b) => ({
            title: b.title || '',
            type: b.type === 'postback' ? 'postback' : 'url',
            url: b.url || '',
            payload: b.payload || ''
          }))
        : [],
      steps: Array.isArray(keyword.steps)
        ? keyword.steps.map((s, idx) => ({
            id: s.id || `step_${idx + 1}`,
            name: s.name || `Шаг ${idx + 1}`,
            message: s.message || '',
            buttons: Array.isArray(s.buttons)
              ? s.buttons.map((b) => ({
                  title: b.title || '',
                  type: b.type === 'postback' ? 'postback' : 'url',
                  url: b.url || '',
                  payload: b.payload || ''
                }))
              : []
          }))
        : []
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

  // Список шагов, доступных для перехода
  const availableSteps = (formData.steps || []).map((s, idx) => ({
    id: s.id,
    name: s.name ? `${s.name}` : `Шаг ${idx + 1}`
  }));

  // Компонент отрисовки полей кнопки (для начального сообщения или шага)
  const renderButtonEditor = (btn, i, onUpdate, onRemove, currentStepId = null) => {
    const targetSteps = availableSteps.filter((s) => s.id !== currentStepId);
    const isKnownStep = targetSteps.some((s) => s.id === btn.payload);

    return (
      <div key={i} className="border rounded p-2 mb-2 bg-white shadow-sm">
        <div className="row g-2">
          <div className="col-md-4">
            <select
              className="form-select form-select-sm"
              value={btn.type}
              onChange={(e) => onUpdate(i, "type", e.target.value)}
            >
              <option value="url">🔗 Ссылка (URL)</option>
              <option value="postback">➡️ Этап (Следующее сообщение)</option>
            </select>
          </div>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Текст на кнопке (до 20 симв.)"
              maxLength={20}
              value={btn.title}
              onChange={(e) => onUpdate(i, "title", e.target.value)}
            />
          </div>
          <div className="col-12">
            {btn.type === "postback" ? (
              targetSteps.length > 0 ? (
                <div className="d-flex gap-2">
                  <select
                    className="form-select form-select-sm"
                    value={isKnownStep ? btn.payload : (btn.payload ? "__custom__" : "")}
                    onChange={(e) => {
                      if (e.target.value !== "__custom__") {
                        onUpdate(i, "payload", e.target.value);
                      }
                    }}
                  >
                    <option value="">-- Выберите следующий шаг воронки --</option>
                    {targetSteps.map((s) => (
                      <option key={s.id} value={s.id}>
                        ➡️ {s.name}
                      </option>
                    ))}
                    <option value="__custom__">⚙️ Ввести свой код вручную...</option>
                  </select>
                  {(!isKnownStep && btn.payload) && (
                    <input
                      type="text"
                      className="form-control form-control-sm w-50"
                      placeholder="Код шага (напр. STEP_2)"
                      value={btn.payload}
                      onChange={(e) => onUpdate(i, "payload", e.target.value)}
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Добавьте шаги ниже или укажите код (напр. STEP_DETAILS)"
                  value={btn.payload}
                  onChange={(e) => onUpdate(i, "payload", e.target.value)}
                />
              )
            ) : (
              <input
                type="url"
                className="form-control form-control-sm"
                placeholder="https://... (ссылка на сайт, Telegram-канал и т.д.)"
                value={btn.url}
                onChange={(e) => onUpdate(i, "url", e.target.value)}
              />
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-link btn-sm text-danger p-0 mt-1"
          onClick={() => onRemove(i)}
        >
          Удалить кнопку
        </button>
      </div>
    );
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
        <h5 className="card-title mb-0">Keyword Management & Funnels</h5>
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
            <label htmlFor="keyword" className="form-label fw-bold">
              Ключевое слово (триггер в комментариях)
            </label>
            <input
              type="text"
              className="form-control"
              id="keyword"
              placeholder="Например: vitest, консультация, зубы, чек-лист"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              required
            />
          </div>

          {/* Начальное сообщение (Шаг 1) */}
          <div className="border rounded p-3 mb-3 bg-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label htmlFor="message" className="form-label fw-bold mb-0">
                Первое сообщение в Директ (Ответ на комментарий)
              </label>
              <button
                type="button"
                className="btn btn-link btn-sm p-0"
                onClick={() => setShowPlaceholders(!showPlaceholders)}
              >
                {showPlaceholders ? "Скрыть переменные" : "Вставить {username}"}
              </button>
            </div>
            <textarea
              className="form-control mb-2"
              id="message"
              rows="3"
              placeholder="Привет, {username}! Держи первое сообщение..."
              value={formData.message}
              onChange={(e) => handleMessageChange(e.target.value)}
              required
            />
            
            {showPlaceholders && (
              <div className="mb-2">
                <small className="text-muted">Доступные переменные:</small>
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
              <div className="mb-2">
                <small className="text-muted">Предпросмотр:</small>
                <div className="border rounded p-2 bg-white">
                  <small>{messagePreview}</small>
                </div>
              </div>
            )}

            {/* Кнопки первого сообщения */}
            <div className="mt-3">
              <label className="form-label small fw-bold text-muted">
                Кнопки под первым сообщением <small>(до 3 кнопок: Ссылка или переход к следующему шагу)</small>
              </label>
              {(formData.buttons || []).map((btn, i) =>
                renderButtonEditor(btn, i, updateButton, removeButton)
              )}
              {(formData.buttons || []).length < 3 && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mt-1"
                  onClick={addButton}
                >
                  + Добавить кнопку к первому сообщению
                </button>
              )}
            </div>
          </div>

          {/* Цепочка шагов воронки (ChatPlace style) */}
          <div className="card mb-3 border-primary">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2">
              <span className="fw-bold">
                🔄 Цепочка шагов воронки (Автоворонка без Canvas)
              </span>
              <span className="badge bg-white text-primary">
                {(formData.steps || []).length} {(formData.steps || []).length === 1 ? 'шаг' : 'шагов'}
              </span>
            </div>
            <div className="card-body bg-light">
              <p className="small text-muted mb-3">
                Когда пользователь нажимает кнопку типа &laquo;Этап&raquo; в Директе, бот автоматически присылает следующий шаг с новыми кнопками. Так создаются интерактивные воронки, как в ChatPlace!
              </p>

              {(formData.steps || []).map((step, sIdx) => (
                <div key={step.id || sIdx} className="card mb-3 border shadow-sm">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
                    <div className="d-flex align-items-center gap-2 flex-grow-1 me-2">
                      <span className="badge bg-secondary">Шаг {sIdx + 2}</span>
                      <input
                        type="text"
                        className="form-control form-control-sm fw-bold"
                        placeholder="Название шага (напр. Что входит в консультацию)"
                        value={step.name}
                        onChange={(e) => updateStep(sIdx, "name", e.target.value)}
                        style={{ maxWidth: 350 }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeStep(sIdx)}
                      title="Удалить этот шаг"
                    >
                      &times; Удалить шаг
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <label className="form-label small fw-bold">
                        Текст сообщения этого шага <small className="text-muted">(до 640 символов)</small>
                      </label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Текст сообщения для этого этапа..."
                        maxLength={640}
                        value={step.message}
                        onChange={(e) => updateStep(sIdx, "message", e.target.value)}
                        required
                      />
                    </div>

                    <div className="mt-2">
                      <label className="form-label small text-muted fw-bold">
                        Кнопки шага <small>(до 3 кнопок: ссылки на мессенджеры или переход к следующему шагу)</small>
                      </label>
                      {(step.buttons || []).map((btn, bIdx) =>
                        renderButtonEditor(
                          btn,
                          bIdx,
                          (idx, f, val) => updateStepButton(sIdx, idx, f, val),
                          (idx) => removeStepButton(sIdx, idx),
                          step.id
                        )
                      )}
                      {(step.buttons || []).length < 3 && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => addStepButton(sIdx)}
                        >
                          + Добавить кнопку к Шагу {sIdx + 2}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={addStep}
              >
                + Добавить следующий шаг воронки
              </button>
            </div>
          </div>

          {/* Скоуп постов */}
          <div className="mb-3">
            <label className="form-label fw-bold">
              Под какими постами отслеживать комментарии
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
                Все посты <small className="text-muted">(срабатывает под любым постом или Reels)</small>
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
                Только выбранные посты
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
                            {new Date(media.timestamp).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Сообщение для неподписанных (Follow gate) */}
          <div className="mb-3">
            <label htmlFor="messageForNonFollowers" className="form-label">
              Отдельное сообщение для НЕподписанных <small className="text-muted">(опционально)</small>
            </label>
            <textarea
              className="form-control"
              id="messageForNonFollowers"
              rows="2"
              placeholder="Оставьте пустым, если проверка подписки не нужна. Если заполнено — бот проверит подписку и попросит подписаться."
              value={formData.messageForNonFollowers}
              onChange={(e) => setFormData({ ...formData, messageForNonFollowers: e.target.value })}
            />
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
                  Кнопка &laquo;Я подписался&raquo; в Директ (быстрая проверка)
                </label>
              </div>
              <small className="text-muted mb-2 d-block">
                Пользователь нажимает кнопку в Директ &rarr; бот автоматически проверяет подписку и выдает воронку!
              </small>

              {formData.enableFollowCheckButton && (
                <div className="row g-2 mt-1">
                  <div className="col-md-6">
                    <label htmlFor="followButtonText" className="form-label small">
                      Текст кнопки проверки <small className="text-muted">(макс. 20)</small>
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
                      Сообщение, если пользователь нажал кнопку, но так и не подписался
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
                  {editingId ? "Сохранение..." : "Добавление..."}
                </>
              ) : (
                editingId ? "Сохранить изменения" : "Добавить ключевое слово"
              )}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Отмена
              </button>
            )}
          </div>
        </form>

        {/* Список ключевых слов */}
        <div className="keywords-list">
          <h6>Ваши правила и воронки ({keywords.length})</h6>
          {keywords.length === 0 ? (
            <p className="text-muted">Пока нет добавленных ключевых слов.</p>
          ) : (
            <div className="list-group">
              {keywords.map((keyword) => (
                <div key={keyword._id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <h6 className="mb-1">
                        <span className="badge bg-primary me-2">{keyword.keyword}</span>
                        {Array.isArray(keyword.mediaIds) && keyword.mediaIds.length > 0 ? (
                          <span className="badge bg-warning text-dark me-2" title={keyword.mediaIds.join(", ")}>
                            {keyword.mediaIds.length} пост(ов)
                          </span>
                        ) : (
                          <span className="badge bg-secondary me-2">Все посты</span>
                        )}
                        {Array.isArray(keyword.steps) && keyword.steps.length > 0 && (
                          <span className="badge bg-info text-dark me-2">
                            🔄 {keyword.steps.length + 1} сообщения в воронке
                          </span>
                        )}
                        {keyword.matchCount > 0 && (
                          <small className="text-muted">({keyword.matchCount} срабатываний)</small>
                        )}
                      </h6>
                      <p className="mb-1 text-break">{keyword.message}</p>
                      {Array.isArray(keyword.buttons) && keyword.buttons.length > 0 && (
                        <div className="mb-1">
                          {keyword.buttons.map((b, bi) => (
                            <span
                              key={bi}
                              className="badge bg-dark me-1 mb-1"
                              title={b.type === "postback" ? `Этап: ${b.payload}` : b.url}
                            >
                              {b.type === "postback" ? "➡️" : "🔗"} {b.title}
                            </span>
                          ))}
                        </div>
                      )}
                      {Array.isArray(keyword.steps) && keyword.steps.length > 0 && (
                        <div className="mb-1 text-muted small">
                          Следующие шаги: {keyword.steps.map((s, si) => s.name || `Шаг ${si + 2}`).join(' &rarr; ')}
                        </div>
                      )}
                      {keyword.messageForNonFollowers && (
                        <p className="mb-1">
                          <small className="text-muted">Для неподписанных: </small>
                          <small className="text-break">{keyword.messageForNonFollowers}</small>
                          {keyword.enableFollowCheckButton !== false && (
                            <span className="badge bg-info text-dark ms-2">
                              Кнопка: {keyword.followButtonText || "✅ Я подписался"}
                            </span>
                          )}
                        </p>
                      )}
                      <small className="text-muted">
                        Создано: {new Date(keyword.createdAt).toLocaleDateString()}
                        {keyword.lastUsed && (
                          <> • Последнее использование: {new Date(keyword.lastUsed).toLocaleDateString()}</>
                        )}
                      </small>
                    </div>
                    <div className="btn-group btn-group-sm flex-shrink-0" role="group">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handleEdit(keyword)}
                      >
                        Редактировать
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(keyword._id)}
                      >
                        Удалить
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
