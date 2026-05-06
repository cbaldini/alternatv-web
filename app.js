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
    var STREAM_URL = window.location.origin + '/stream/hls/live.m3u8';
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
    }

    // ── Remote Playback API (Chrome Mobile / Android) ──────────────────────
    // En mobile, google-cast-launcher no funciona. Usamos la Remote Playback API
    // que Chrome Mobile sí soporta y muestra el diálogo de selección de dispositivos.
    (function () {
      var videoEl = document.getElementById('alternatv');
      var btn = document.getElementById('cast-btn-manual');
      if (!videoEl || !btn) return;

      // Verificar soporte de Remote Playback API
      if (
        typeof videoEl.remote !== 'undefined' &&
        typeof videoEl.remote.watchAvailability === 'function'
      ) {
        // Mostrar el botón solo cuando hay dispositivos disponibles
        videoEl.remote.watchAvailability(function (available) {
          btn.style.display = available ? 'inline-flex' : 'none';
          console.log('[RemotePlayback] Dispositivos disponibles:', available);
        }).catch(function () {
          // watchAvailability no disponible en este contexto (ej. HTTP sin HTTPS)
          // Mostramos el botón igual para que el usuario pueda intentarlo
          btn.style.display = 'inline-flex';
        });

        btn.addEventListener('click', function () {
          videoEl.remote.prompt()
            .then(function () {
              console.log('[RemotePlayback] Conectado al dispositivo remoto');
            })
            .catch(function (err) {
              console.warn('[RemotePlayback] Cancelado o error:', err);
            });
        });

        // Sincronizar estado del player local con el dispositivo remoto
        videoEl.remote.addEventListener('connecting', function () {
          console.log('[RemotePlayback] Conectando...');
        });
        videoEl.remote.addEventListener('connect', function () {
          console.log('[RemotePlayback] Reproduciendo en dispositivo remoto');
        });
        videoEl.remote.addEventListener('disconnect', function () {
          console.log('[RemotePlayback] Desconectado — reanudando local');
          if (vjsPlayer) vjsPlayer.play();
        });
      }
    })();

    // ── Chromecast Desktop (Cast Framework API v3 nativa) ──────────────────
    window.__castReady = function (isAvailable) {
      if (!isAvailable) return;
      console.log('[Cast] Framework listo');

      var ctx = cast.framework.CastContext.getInstance();

      // Escuchar cambios de estado de sesión
      ctx.addEventListener(
        cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        function (e) {
          var state = e.sessionState;
          console.log('[Cast] Estado de sesión:', state);

          if (
            state === cast.framework.SessionState.SESSION_STARTED ||
            state === cast.framework.SessionState.SESSION_RESUMED
          ) {
            // Pausar el player local
            if (vjsPlayer && !vjsPlayer.paused()) vjsPlayer.pause();

            // Cargar el stream HLS en el Chromecast
            var session = ctx.getCurrentSession();
            if (!session) return;

            var mediaInfo = new chrome.cast.media.MediaInfo(STREAM_URL, 'application/x-mpegURL');
            mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;

            var meta = new chrome.cast.media.GenericMediaMetadata();
            meta.title = 'AlternaTV · En vivo';
            meta.images = [{ url: window.location.origin + '/logoalternatv.png' }];
            mediaInfo.metadata = meta;

            var req = new chrome.cast.media.LoadRequest(mediaInfo);
            req.autoplay = true;

            session.loadMedia(req)
              .then(function () { console.log('[Cast] Stream enviado al Chromecast'); })
              .catch(function (err) { console.error('[Cast] Error al cargar en Chromecast:', err); });
          }

          if (state === cast.framework.SessionState.SESSION_ENDED) {
            // Reanudar el player local cuando se desconecta
            console.log('[Cast] Sesión terminada — reanudando player local');
            if (vjsPlayer) vjsPlayer.play();
          }
        }
      );
    };
  });
})();
