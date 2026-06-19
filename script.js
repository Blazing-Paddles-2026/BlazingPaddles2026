// Blazing Paddles 2026 Dashboard — interactivity
// - Live T-minus countdown to tournament day
// - Auto-updating "Updated" date
// - Mobile sidebar toggle (hamburger)
// - Sidebar scroll-spy

(function () {
  /* -------------------------------------------------------------
   * 1) Live T-minus countdown + "Updated" stamp
   * ------------------------------------------------------------- */
  // Tournament: Saturday, October 10, 2026 (local Central Time)
  // We compare day-by-day from "today" in the viewer's local time.
  function startOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function formatTMinus() {
    var event = startOfDay(new Date(2026, 9, 10)); // months are 0-indexed: 9 = October
    var today = startOfDay(new Date());
    var msPerDay = 86400000;
    var days = Math.round((event - today) / msPerDay);
    if (days > 14) {
      var weeks = Math.floor(days / 7);
      return 'T-' + weeks + ' weeks';
    }
    if (days > 1) return 'T-' + days + ' days';
    if (days === 1) return 'T-1 day · Tomorrow';
    if (days === 0) return 'Event Day · Live';
    return 'Post-event · ' + Math.abs(days) + ' days ago';
  }

  function formatUpdated() {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var d = new Date();
    return 'Updated ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  var statusMeta = document.querySelector('[data-status-meta]');
  if (statusMeta) {
    statusMeta.textContent = formatTMinus() + ' · ' + formatUpdated();
  }

  /* -------------------------------------------------------------
   * 1b) Reliable internal hash navigation
   * ------------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    var target = document.getElementById(hash.slice(1));
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', hash);
    } else {
      window.location.hash = hash;
    }
  });

  /* -------------------------------------------------------------
   * 2) Footer year
   * ------------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------------------------------------------------
   * 3) Mobile sidebar toggle (hamburger)
   * ------------------------------------------------------------- */
  var toggleBtn = document.querySelector('[data-sidebar-toggle]');
  var sidebar = document.querySelector('.sidebar');
  var backdrop = document.querySelector('[data-sidebar-backdrop]');
  var body = document.body;

  function closeSidebar() {
    body.classList.remove('sidebar-open');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  }
  function openSidebar() {
    body.classList.add('sidebar-open');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
  }
  function toggleSidebar() {
    if (body.classList.contains('sidebar-open')) closeSidebar();
    else openSidebar();
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  // Close sidebar when a nav link is tapped on mobile
  if (sidebar) {
    sidebar.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      // Only close if we're in the mobile state (sidebar is overlaying content)
      if (window.matchMedia('(max-width: 900px)').matches) {
        closeSidebar();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSidebar();
  });

  // If we resize from mobile to desktop, close the overlay state to avoid stuck classes
  var mq = window.matchMedia('(min-width: 901px)');
  if (mq.addEventListener) {
    mq.addEventListener('change', function (e) { if (e.matches) closeSidebar(); });
  } else if (mq.addListener) {
    mq.addListener(function (e) { if (e.matches) closeSidebar(); });
  }

  /* -------------------------------------------------------------
   * 4) Live dashboard updates
   * ------------------------------------------------------------- */
  var updateForm = document.querySelector('[data-update-form]');
  var updatesFeed = document.querySelector('[data-updates-feed]');
  var updateStatus = document.querySelector('[data-update-status]');
  var refreshedEl = document.querySelector('[data-updates-refreshed]');
  var refreshButton = document.querySelector('[data-refresh-updates]');
  var supabaseUrl = 'https://zdbxsfswdjjieqkgyyid.supabase.co';
  var supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYnhzZnN3ZGpqaWVxa2d5eWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjAwNjgsImV4cCI6MjA5NzEzNjA2OH0.QNRdX8x2Vb-uGgomC44SidcziynT0xrKu7wu9hzN1Tc';
  var updatesEndpoint = supabaseUrl + '/rest/v1/dashboard_updates';

  function updateHeaders(extra) {
    var headers = {
      apikey: supabaseAnonKey,
      Authorization: 'Bearer ' + supabaseAnonKey
    };
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        headers[key] = extra[key];
      });
    }
    return headers;
  }

  function setFormStatus(message, state) {
    if (!updateStatus) return;
    updateStatus.textContent = message;
    updateStatus.dataset.state = state || '';
  }

  function formatUpdateDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function makeUpdateCard(update) {
    var card = document.createElement('article');
    card.className = 'update-card';

    var meta = document.createElement('p');
    meta.className = 'update-meta';

    var category = document.createElement('span');
    category.className = 'update-category';
    category.textContent = update.category || 'Update';
    meta.appendChild(category);

    var dateText = formatUpdateDate(update.created_at);
    var details = document.createElement('span');
    details.textContent = [dateText, update.submitted_by].filter(Boolean).join(' · ');
    meta.appendChild(details);

    var title = document.createElement('h3');
    title.textContent = update.title || 'Dashboard update';

    var message = document.createElement('p');
    message.textContent = update.message || '';

    card.appendChild(meta);
    card.appendChild(title);
    card.appendChild(message);

    if (update.link_url) {
      var link = document.createElement('a');
      link.className = 'btn btn-ghost btn-small';
      link.href = update.link_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = update.link_text || 'Open link';
      card.appendChild(link);
    }

    return card;
  }

  function renderUpdates(updates) {
    if (!updatesFeed) return;
    clearElement(updatesFeed);

    if (!updates.length) {
      var empty = document.createElement('article');
      empty.className = 'update-card';
      var emptyText = document.createElement('p');
      emptyText.textContent = 'No updates yet. Post the first committee note when something changes.';
      empty.appendChild(emptyText);
      updatesFeed.appendChild(empty);
      return;
    }

    updates.forEach(function (update) {
      updatesFeed.appendChild(makeUpdateCard(update));
    });
  }

  function loadDashboardUpdates() {
    if (!updatesFeed) return Promise.resolve();

    var query = '?select=id,created_at,submitted_by,category,title,message,link_text,link_url&is_visible=eq.true&order=created_at.desc&limit=10';
    return fetch(updatesEndpoint + query, {
      method: 'GET',
      headers: updateHeaders()
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Updates could not be loaded.');
        return response.json();
      })
      .then(function (updates) {
        renderUpdates(Array.isArray(updates) ? updates : []);
        if (refreshedEl) {
          refreshedEl.textContent = 'Last refreshed ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }
      })
      .catch(function () {
        clearElement(updatesFeed);
        var error = document.createElement('article');
        error.className = 'update-card';
        var text = document.createElement('p');
        text.textContent = 'Updates are temporarily unavailable. Please refresh the page in a moment.';
        error.appendChild(text);
        updatesFeed.appendChild(error);
        if (refreshedEl) refreshedEl.textContent = 'Unable to refresh updates';
      });
  }

  function isValidHttpUrl(value) {
    if (!value) return true;
    try {
      var url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  if (updatesFeed) {
    loadDashboardUpdates();
    window.setInterval(loadDashboardUpdates, 45000);
  }

  if (refreshButton) {
    refreshButton.addEventListener('click', function () {
      loadDashboardUpdates();
    });
  }

  if (updateForm) {
    updateForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var formData = new FormData(updateForm);
      var linkUrl = String(formData.get('link_url') || '').trim();
      var linkText = String(formData.get('link_text') || '').trim();

      if (!isValidHttpUrl(linkUrl)) {
        setFormStatus('Please use a full link that starts with http:// or https://.', 'error');
        return;
      }

      var payload = {
        submitted_by: String(formData.get('submitted_by') || '').trim(),
        category: String(formData.get('category') || 'General').trim(),
        title: String(formData.get('title') || '').trim(),
        message: String(formData.get('message') || '').trim(),
        link_text: linkUrl ? (linkText || 'Open link') : null,
        link_url: linkUrl || null,
        is_visible: true
      };

      if (!payload.submitted_by || !payload.title || !payload.message) {
        setFormStatus('Please add your name, a title, and the update details.', 'error');
        return;
      }

      setFormStatus('Posting update…', 'working');
      updateForm.querySelector('button[type="submit"]').disabled = true;

      fetch(updatesEndpoint, {
        method: 'POST',
        headers: updateHeaders({
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }),
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Update could not be posted.');
          return response.json();
        })
        .then(function () {
          updateForm.reset();
          setFormStatus('Posted. Everyone who opens the dashboard can see it.', 'success');
          return loadDashboardUpdates();
        })
        .catch(function () {
          setFormStatus('The update did not post. Please check the fields and try again.', 'error');
        })
        .finally(function () {
          updateForm.querySelector('button[type="submit"]').disabled = false;
        });
    });
  }

  /* -------------------------------------------------------------
   * 4b) Copy-to-clipboard buttons for ready-to-send scripts
   * ------------------------------------------------------------- */
  function showCopyToast(message) {
    var toast = document.querySelector('.copy-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'copy-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message || 'Copied';
    toast.classList.add('is-visible');
    window.clearTimeout(showCopyToast._timer);
    showCopyToast._timer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 1600);
  }

  document.addEventListener('click', function (e) {
    var button = e.target.closest('[data-copy]');
    if (!button) return;

    var target = document.getElementById(button.getAttribute('data-copy'));
    if (!target) return;

    var text = target.textContent.trim();
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showCopyToast('Copied to clipboard');
      }).catch(function () {
        showCopyToast('Select and copy the script manually');
      });
    } else {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showCopyToast('Copied to clipboard');
      } catch (err) {
        showCopyToast('Select and copy the script manually');
      }
      document.body.removeChild(textarea);
    }
  });

  /* -------------------------------------------------------------
   * 5) Sidebar scroll-spy
   * ------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.sidebar-nav a[href^="#"]'));
  if (!navLinks.length || !('IntersectionObserver' in window)) return;

  var byId = {};
  var sections = [];
  navLinks.forEach(function (link) {
    var id = link.getAttribute('href').slice(1);
    var section = document.getElementById(id);
    if (section) {
      byId[id] = link;
      sections.push(section);
    }
  });

  var current = null;
  function setActive(id) {
    if (current === id) return;
    current = id;
    navLinks.forEach(function (l) { l.classList.remove('is-active'); });
    if (byId[id]) byId[id].classList.add('is-active');
  }

  var io = new IntersectionObserver(function (entries) {
    var visible = entries
      .filter(function (e) { return e.isIntersecting; })
      .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
    if (visible.length) setActive(visible[0].target.id);
  }, {
    rootMargin: '-20% 0px -65% 0px',
    threshold: 0
  });

  sections.forEach(function (s) { io.observe(s); });
})();
