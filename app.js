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
    var STREAM_URL = 'https://tv.alterna.ar/stream/hls/live.m3u8';
    var vjsPlayer = null;

    if (window.videojs && document.getElementById('alternatv')) {
      vjsPlayer = window.videojs('alternatv', {
        autoplay: true,
        muted: false,
        playsinline: true,
        responsive: true,
        fluid: true,
        techOrder: ['html5'],
        html5: {
          vhs: {
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            overrideNative: true,
            allowSeeksWithinUnsafeLiveWindow: true
          }
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

      // --- Botón Cast dentro de la barra de controles ---
      function createCastControl(player) {
        var bar = player && player.controlBar && player.controlBar.el && player.controlBar.el();
        if (!bar) return null;
        var btn = document.createElement('button');
        btn.className = 'vjs-cast-control vjs-control vjs-button';
        btn.type = 'button';
        btn.title = 'Enviar a TV';
        btn.setAttribute('aria-label', 'Enviar a TV');
        btn.style.display = 'none';
        btn.innerHTML =
          '<span class="vjs-icon-placeholder" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm18-7H5v1.63c3.96 1.28 7.09 4.41 8.37 8.37H19V7zM1 10v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3C1.9 3 1 3.9 1 5v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>' +
          '</span>';
        bar.appendChild(btn);
        return btn;
      }

      var castBtn = createCastControl(vjsPlayer);
      function setCastVisible(visible) {
        if (castBtn) castBtn.style.display = visible ? 'inline-flex' : 'none';
      }
      function castWithFramework() {
        if (!(window.cast && window.cast.framework)) return Promise.reject(new Error('Cast framework unavailable'));
        var ctx = cast.framework.CastContext.getInstance();
        return ctx.requestSession().then(function () {
          var session = ctx.getCurrentSession();
          if (!session) throw new Error('No active cast session');
          var mediaInfo = new chrome.cast.media.MediaInfo(STREAM_URL, 'application/x-mpegURL');
          mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;
          var req = new chrome.cast.media.LoadRequest(mediaInfo);
          req.autoplay = true;
          return session.loadMedia(req).then(function () {
            if (vjsPlayer && !vjsPlayer.paused()) vjsPlayer.pause();
            if (castBtn) castBtn.classList.add('vjs-cast-control--active');
          });
        });
      }
      function castWithRemotePlayback() {
        var videoEl = document.getElementById('alternatv');
        if (videoEl && videoEl.remote && typeof videoEl.remote.prompt === 'function') {
          return videoEl.remote.prompt();
        }
        return Promise.reject(new Error('Remote playback unavailable'));
      }
      if (castBtn) {
        castBtn.addEventListener('click', function () {
          castWithFramework()
            .catch(function () { return castWithRemotePlayback(); })
            .catch(function () {
              alert('No se encontraron dispositivos para compartir en este momento.');
            });
        });
      }
      // Cast SDK (desktop)
      window.__castReady = function (isAvailable) {
        if (!isAvailable || !(window.cast && window.cast.framework)) return;
        setCastVisible(true);
        var ctx = cast.framework.CastContext.getInstance();
        ctx.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, function (e) {
          if (e.sessionState === cast.framework.SessionState.SESSION_ENDED) {
            if (castBtn) castBtn.classList.remove('vjs-cast-control--active');
            if (vjsPlayer) vjsPlayer.play();
          }
        });
      };
      // Remote Playback (mobile)
      (function () {
        var videoEl = document.getElementById('alternatv');
        if (!videoEl || !videoEl.remote || typeof videoEl.remote.watchAvailability !== 'function') return;
        videoEl.remote.watchAvailability(function (available) {
          setCastVisible(!!available);
        }).catch(function () {});
      })();
    }
  });
})();
