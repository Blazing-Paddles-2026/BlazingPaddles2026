// Blazing Paddles 2026 Dashboard — sidebar nav scroll-spy & footer year

(function () {
  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Scroll-spy: highlight the sidebar link for the section currently in view
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
  var setActive = function (id) {
    if (current === id) return;
    current = id;
    navLinks.forEach(function (l) { l.classList.remove('is-active'); });
    if (byId[id]) byId[id].classList.add('is-active');
  };

  var io = new IntersectionObserver(function (entries) {
    // Pick the entry closest to the top of the viewport that is intersecting
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
