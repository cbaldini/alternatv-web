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

    function initPlayer() {
      if (playerReady) return;
      if (!window.videojs || !document.getElementById('alternatv')) return;
      playerReady = true;

      try {
        // Registrar tech de Chromecast (UMD lo expone en window.videojsChromecast)
        if (typeof window.videojsChromecast === 'function') {
          window.videojsChromecast(window.videojs);
        }

        vjsPlayer = window.videojs('alternatv', {
          autoplay: true,
          muted: false,
          playsinline: true,
          responsive: true,
          fluid: true,

          // 'chromecast' tech primero; si no hay Cast disponible cae a html5
          techOrder: ['chromecast', 'html5'],

          // VHS (sucesor de hls en Video.js 7+/8+)
          vhs: {
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            overrideNative: true,
            allowSeeksWithinUnsafeLiveWindow: true
          },
          // Compatibilidad con configuración legacy html5.hls
          html5: {
            vhs: {
              enableLowInitialPlaylist: true,
              smoothQualityChange: true,
              overrideNative: true
            },
            hls: {
              enableLowInitialPlaylist: true,
              overrideNative: true
            }
          },

          // Opciones del plugin de Chromecast
          chromecast: {
            receiverAppID: 'CC1AD845',   // Default Media Receiver (sin registro)
            isCustomReceiver: false,
            receiverDisplayName: 'AlternaTV'
          },

          // Mostrar siempre el botón de Cast en la barra de controles
          controlBar: {
            chromecastButton: true
          }
        });

        // Configurar Cast Framework v3 (Chromecast con Google TV y nuevos)
        vjsPlayer.on('ready', function () {
          try {
            if (window.cast && window.cast.framework) {
              var ctx = cast.framework.CastContext.getInstance();
              ctx.setOptions({
                receiverApplicationId: 'CC1AD845',
                autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
                resumeSavedSession: false
              });
            }
          } catch (castErr) {
            // Cast Framework v3 no disponible, continúa con SDK v2
          }
        });

        // Metadatos para el receptor Cast (aparece en TV y en la notificación)
        vjsPlayer.on('play', function () {
          try {
            if (window.cast && window.cast.framework) {
              var session = cast.framework.CastContext.getInstance().getCurrentSession();
              if (session) {
                var mediaInfo = new chrome.cast.media.MediaInfo(
                  window.location.origin + '/stream/hls/live.m3u8',
                  'application/x-mpegURL'
                );
                var meta = new chrome.cast.media.TvShowMediaMetadata();
                meta.title = 'AlternaTV';
                meta.subtitle = 'En vivo';
                meta.images = [{ url: window.location.origin + '/logoalternatv.png' }];
                mediaInfo.metadata = meta;
                mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;

                var req = new chrome.cast.media.LoadRequest(mediaInfo);
                session.loadMedia(req).catch(function () {});
              }
            }
          } catch (e) {}
        });

        vjsPlayer.on('error', function () {
          console.error('Error en el player:', vjsPlayer.error());
        });

        var playPromise = vjsPlayer.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function (err) {
            console.log('Autoplay bloqueado:', err);
          });
        }

      } catch (e) {
        console.error('Error inicializando player:', e);
      }
    }

    // Inicializar el player ahora (sin Cast) y también cuando el SDK responda
    initPlayer();

    // El callback en index.html llamará a esta función cuando Cast esté listo
    window.__castReady = function () {
      if (!playerReady) {
        initPlayer();
      }
    };
  });
})();
