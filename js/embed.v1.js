(function () {
  "use strict";
  if (window.__ASKVAULT_RUNNING__) return;
  window.__ASKVAULT_RUNNING__ = true;

  /* =========================================================
   * Global bootstrap & queue handling
   * ========================================================= */

  var w = window;
  var d = document;

  var AskVault = (w.AskVault = w.AskVault || []);
  var queue = AskVault.slice();
  AskVault.length = 0;

  var CONFIG = {
    apiBase: "https://app.askaivault.com/api/v1/tracking",
    clientKey: null,
    visitorId: null,
    sessionId: null,
    initialized: false,
  };

  /* =========================================================
   * Utilities
   * ========================================================= */

  function uuidv4() {
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function canStore() {
    try {
      localStorage.setItem("__av_test", "1");
      localStorage.removeItem("__av_test");
      return true;
    } catch (e) {
      return false;
    }
  }

  function getStore(key) {
    return canStore() ? localStorage.getItem(key) : null;
  }

  function setStore(key, val) {
    if (canStore()) {
      localStorage.setItem(key, val);
    }
  }

  function removeStore(key) {
    if (canStore()) {
      localStorage.removeItem(key);
    }
  }

  function send(endpoint, payload) {
    var body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
    }).catch(function () {});
  }

  function dntEnabled() {
    return (
      navigator.doNotTrack === "1" ||
      window.doNotTrack === "1" ||
      navigator.msDoNotTrack === "1"
    );
  }

  /* =========================================================
   * Visitor & Session
   * ========================================================= */

  function initVisitor() {
    var vid = getStore("askvault_vid");

    if (!vid) {
      vid = uuidv4();
      setStore("askvault_vid", vid);
    }

    CONFIG.visitorId = vid;
  }

  function startSession() {
    var params = new URLSearchParams(window.location.search);

    send(CONFIG.apiBase + "/sessions/start", {
      client_key: CONFIG.clientKey,
      visitor_id: CONFIG.visitorId,
      session_id: CONFIG.sessionId,
      entry_url: location.href,
      referrer: document.referrer || null,

      // 🔑 UTMs
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),

      gclid: params.get('gclid'),
      gbraid: params.get('gbraid'),
      gad_campaignid: params.get('gad_campaignid'),

      occurred_at: nowISO(),
    });
  }

  var sessionEnded = false;

  function endSession() {
    if (!CONFIG.sessionId || sessionEnded) return;
    sessionEnded = true;

    var payload = JSON.stringify({
      client_key: CONFIG.clientKey,
      session_id: CONFIG.sessionId,
      exit_url: location.href,
      occurred_at: nowISO(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(CONFIG.apiBase + "/sessions/end", payload);
    }
  }

  /* =========================================================
   * Core tracking
   * ========================================================= */

  function track(eventType, metadata) {
    if (!CONFIG.initialized) return;
    ensureSession();

    send(CONFIG.apiBase + "/events", {
      client_key: CONFIG.clientKey,
      visitor_id: CONFIG.visitorId,
      session_id: CONFIG.sessionId,
      event_type: eventType,

      // ✅ ADD THESE
      url: location.href,
      referrer: document.referrer || null,

      metadata: metadata || {},
      occurred_at: nowISO(),
    });
  }

  function identify(traits) {
    if (!traits) return;

    if (!CONFIG.initialized) {
      AskVault.push({ method: "identify", args: [traits] });
      return;
    }

    ensureSession();

    send(CONFIG.apiBase + "/identify", {
      client_key: CONFIG.clientKey,
      visitor_id: CONFIG.visitorId,
      traits: traits,
    });
  }

  function getSessionId() {
    var sid = getStore("askvault_sid");
    var last = getStore("askvault_last_activity");
    var now = Date.now();

    var SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min

    // expire inactive session
    if (sid && last && now - last > SESSION_TIMEOUT) {
      removeStore("askvault_sid");
      sid = null;
    }

    if (!sid) {
      sid = uuidv4();
      setStore("askvault_sid", sid);
      setStore("askvault_session_started", "1");
    }

    setStore("askvault_last_activity", now);

    return sid;
  }
  function ensureSession() {
    if (!CONFIG.sessionId) {
      CONFIG.sessionId = getSessionId();

      if (getStore("askvault_session_started") === "1") {
        startSession();
        removeStore("askvault_session_started");
      }
    }
  }



  /* =========================================================
   * Public API
   * ========================================================= */

  AskVault.init = function (options) {
    if (window.__ASKVAULT_INITIALIZED__) return;
    window.__ASKVAULT_INITIALIZED__ = true;

    if (!options || !options.key) return;
    if (dntEnabled()) return;

    CONFIG.clientKey = options.key;

    initVisitor();

    CONFIG.initialized = true;

    // Automatic page view
    track("page_view", {
      title: d.title,
      referrer: d.referrer || null,
    });

    // Close session
    w.addEventListener("beforeunload", endSession);
    w.addEventListener("pagehide", endSession);
  };

  AskVault.track = track;
  AskVault.identify = identify;

  /* =========================================================
   * Replay queued calls
   * ========================================================= */

  for (var i = 0; i < queue.length; i++) {
    var item = queue[i];
    if (!item || !item.method) continue;

    if (AskVault[item.method]) {
      AskVault[item.method].apply(null, item.args || []);
    }
  }
})();
