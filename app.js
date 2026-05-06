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

    // ── Player ─────────────────────────────────────────────────────────────
    var vjsPlayer = null;
    var playerReady = false;
    var castInitTimeout = null;

    function initPlayer() {
      if (playerReady) return;
      playerReady = true;
      clearTimeout(castInitTimeout);

      if (!window.videojs || !document.getElementById('alternatv')) return;

      try {
        // Registrar el tech de Chromecast ANTES de crear el player
        if (typeof window.videojsChromecast === 'function') {
          window.videojsChromecast(window.videojs);
          console.log('[Cast] Plugin de Chromecast registrado');
        } else {
          console.warn('[Cast] Plugin de Chromecast NO encontrado');
        }

        vjsPlayer = window.videojs('alternatv', {
          autoplay: true,
          muted: false,
          playsinline: true,
          responsive: true,
          fluid: true,
          techOrder: ['chromecast', 'html5'],
          vhs: {
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            overrideNative: true,
            allowSeeksWithinUnsafeLiveWindow: true
          },
          html5: {
            vhs: { enableLowInitialPlaylist: true, smoothQualityChange: true, overrideNative: true },
            hls: { enableLowInitialPlaylist: true, overrideNative: true }
          },
          chromecast: {
            receiverAppID: 'CC1AD845',
            isCustomReceiver: false,
            receiverDisplayName: 'AlternaTV'
          },
          controlBar: {
            chromecastButton: true
          }
        });

        vjsPlayer.on('error', function () {
          console.error('[Player] Error:', vjsPlayer.error());
        });

        var playPromise = vjsPlayer.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function (err) {
            console.log('[Player] Autoplay bloqueado:', err);
          });
        }

      } catch (e) {
        console.error('[Player] Error inicializando:', e);
      }
    }

    // Callback que llama el SDK de Cast cuando está listo
    window.__castReady = function (isAvailable) {
      console.log('[Cast] __castReady, isAvailable:', isAvailable);
      initPlayer();
    };

    // Fallback: si el SDK no responde en 2 s (browser sin Cast o bloqueado),
    // iniciar igual el player sin Chromecast
    castInitTimeout = setTimeout(function () {
      if (!playerReady) {
        console.log('[Cast] Timeout — iniciando player sin Cast');
        initPlayer();
      }
    }, 2000);
  });
})();
