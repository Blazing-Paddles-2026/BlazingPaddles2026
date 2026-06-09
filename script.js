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
   * 4) Sidebar scroll-spy
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
