(function () {
  var CORRECT_PASSWORD = "1884";
  var SESSION_KEY = "bp2026_authed";

  if (sessionStorage.getItem(SESSION_KEY) === "yes") {
    return; // already authenticated this session — let the page render normally
  }

  // Hide everything immediately so nothing flashes on screen before we can act.
  var style = document.createElement("style");
  style.id = "bp-auth-style";
  style.textContent =
    "body > *:not(#bp-auth-overlay){display:none !important;}" +
    "#bp-auth-overlay{position:fixed;inset:0;z-index:999999;background:#06091a;" +
    "display:flex;align-items:center;justify-content:center;font-family:sans-serif;}" +
    ".bp-auth-box{background:#10152b;border:1px solid #2a3358;border-radius:12px;" +
    "padding:2.5rem 2rem;max-width:380px;width:90%;text-align:center;" +
    "box-shadow:0 20px 60px rgba(0,0,0,0.5);}" +
    ".bp-auth-box h1{color:#fff;font-size:1.4rem;margin:0 0 0.5rem;}" +
    ".bp-auth-box p{color:#a9b0d4;font-size:0.9rem;margin:0 0 1.25rem;}" +
    "#bp-auth-input{width:100%;padding:0.65rem 0.75rem;border-radius:8px;" +
    "border:1px solid #384277;background:#0b0f22;color:#fff;font-size:1rem;" +
    "box-sizing:border-box;margin-bottom:0.75rem;}" +
    "#bp-auth-form button{width:100%;padding:0.65rem;border-radius:8px;border:none;" +
    "background:#ff6b1a;color:#fff;font-weight:700;font-size:1rem;cursor:pointer;}" +
    "#bp-auth-form button:hover{background:#e85e12;}" +
    "#bp-auth-error{color:#ff6b6b;display:none;margin-top:0.9rem;font-size:0.85rem;}";
  document.documentElement.appendChild(style);

  function buildOverlay() {
    var overlay = document.createElement("div");
    overlay.id = "bp-auth-overlay";
    overlay.innerHTML =
      '<div class="bp-auth-box">' +
      '<h1>Blazing Paddles 2026</h1>' +
      '<p>Committee access only. Enter the password to continue.</p>' +
      '<form id="bp-auth-form" autocomplete="off">' +
      '<input type="password" id="bp-auth-input" placeholder="Password" autofocus />' +
      '<button type="submit">Enter</button>' +
      '</form>' +
      '<p id="bp-auth-error">Incorrect password. Try again.</p>' +
      '</div>';
    document.body.appendChild(overlay);

    var form = overlay.querySelector("#bp-auth-form");
    var input = overlay.querySelector("#bp-auth-input");
    var error = overlay.querySelector("#bp-auth-error");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value === CORRECT_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, "yes");
        // Reload so the page's normal scripts/content initialize cleanly
        // instead of trying to unhide a half-blocked DOM.
        window.location.reload();
      } else {
        error.style.display = "block";
        input.value = "";
        input.focus();
      }
    });
  }

  if (document.body) {
    buildOverlay();
  } else {
    document.addEventListener("DOMContentLoaded", buildOverlay);
  }
})();
