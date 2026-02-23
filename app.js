(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function ensureOverlay() {
    var overlay = document.querySelector('.nav-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.hidden = true;
    document.body.appendChild(overlay);
    return overlay;
  }

  ready(function () {
    // Menú hamburguesa
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    var overlay = ensureOverlay();

    function setOpenState(isOpen) {
      if (!toggle) return;
      toggle.classList.toggle('is-open', !!isOpen);
    }

    function openNav() {
      if (!nav || !toggle) return;
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      setOpenState(true);
      overlay.hidden = false;
      document.body.classList.add('nav-open');
    }

    function closeNav() {
      if (!nav || !toggle) return;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      setOpenState(false);
      overlay.hidden = true;
      document.body.classList.remove('nav-open');
    }

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var isOpen = nav.classList.contains('is-open');
        if (isOpen) closeNav();
        else openNav();
      });

      // Cerrar al hacer click en un link (mobile)
      nav.addEventListener('click', function (e) {
        if (e.target && e.target.matches && e.target.matches('a')) closeNav();
      });

      // Cerrar tocando fuera
      overlay.addEventListener('click', function () {
        closeNav();
      });

      // Cerrar con Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeNav();
      });

      // Cerrar si se pasa a desktop
      window.addEventListener('resize', function () {
        if (window.innerWidth > 720) closeNav();
      });
    }

    // Switch de logo (index y también el resto)
    var a = document.getElementById('site-logo-a');
    var b = document.getElementById('site-logo-b');
    if (a && b) {
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        var preload = new Image();
        preload.src = b.getAttribute('src');

        var showingB = false;
        window.setInterval(function () {
          showingB = !showingB;
          if (showingB) {
            b.classList.add('is-active');
            a.classList.remove('is-active');
          } else {
            a.classList.add('is-active');
            b.classList.remove('is-active');
          }
        }, 5000);
      }
    }

    // Autoplay live (solo si existe el player)
    if (window.videojs && document.getElementById('alternatv')) {
      try {
        var options = { autoplay: true, muted: false };
        var player = window.videojs('alternatv', options);
        var playPromise = player.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () {});
      } catch (e) {
        // noop
      }
    }
  });
})();
