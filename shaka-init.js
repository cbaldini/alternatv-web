// Inicialización de Shaka Player con soporte Chromecast y controles pro

function showCastStatus(msg, color) {
  var container = document.getElementById('shaka-player-container');
  var diag = document.getElementById('cast-diagnose-msg');
  if (!diag) {
    diag = document.createElement('div');
    diag.id = 'cast-diagnose-msg';
    diag.style.margin = '8px 0 0 0';
    diag.style.fontSize = '15px';
    diag.style.textAlign = 'center';
    diag.style.color = color || '#fff';
    container.parentNode.appendChild(diag);
  }
  diag.textContent = msg;
}

function addUniversalCastButton(player, video, container, streamUrl, retries) {
  var bar = container.querySelector('.shaka-controls-container .shaka-control-bar');
  if (!bar) {
    // Si la barra no está lista, reintentar hasta 10 veces
    if ((retries || 0) < 10) setTimeout(function() {
      addUniversalCastButton(player, video, container, streamUrl, (retries || 0) + 1);
    }, 300);
    return;
  }
  if (bar.querySelector('.universal-cast-btn')) return;
  var btn = document.createElement('button');
  btn.className = 'universal-cast-btn';
  btn.title = 'Enviar a TV (Chromecast)';
  btn.setAttribute('aria-label', 'Enviar a TV (Chromecast)');
  btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm18-7H5v1.63c3.96 1.28 7.09 4.41 8.37 8.37H19V7zM1 10v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3C1.9 3 1 3.9 1 5v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>';
  bar.appendChild(btn);

  // Estado visual
  function setActive(active) {
    btn.style.color = active ? '#4fc3f7' : '#fff';
  }

  // Click: abrir diálogo Cast y enviar stream
  btn.addEventListener('click', function () {
    if (window.cast && window.cast.framework) {
      var ctx = cast.framework.CastContext.getInstance();
      ctx.requestSession().then(function () {
        var session = ctx.getCurrentSession();
        if (!session) return;
        var mediaInfo = new chrome.cast.media.MediaInfo(streamUrl, 'application/x-mpegURL');
        mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;
        var meta = new chrome.cast.media.GenericMediaMetadata();
        meta.title = 'AlternaTV · En vivo';
        meta.images = [{ url: 'https://tv.alterna.ar/logoalternatv.png' }];
        mediaInfo.metadata = meta;
        var req = new chrome.cast.media.LoadRequest(mediaInfo);
        req.autoplay = true;
        session.loadMedia(req).then(function () {
          setActive(true);
          if (player) player.pause && player.pause();
        });
      });
    } else {
      alert('No se detectó el SDK de Google Cast. Usá Chrome o Chromium.');
    }
  });

  // Cambiar color si hay sesión activa
  if (window.cast && window.cast.framework) {
    var ctx = cast.framework.CastContext.getInstance();
    ctx.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, function (e) {
      setActive(e.sessionState === cast.framework.SessionState.SESSION_STARTED || e.sessionState === cast.framework.SessionState.SESSION_RESUMED);
      if (e.sessionState === cast.framework.SessionState.SESSION_ENDED && player) player.play && player.play();
    });
  }
}

function injectFloatingCastButton(streamUrl) {
  var container = document.getElementById('shaka-player-container');
  if (!container || document.getElementById('floating-cast-btn')) return;
  var btn = document.createElement('button');
  btn.id = 'floating-cast-btn';
  btn.title = 'Enviar a TV (Chromecast)';
  btn.setAttribute('aria-label', 'Enviar a TV (Chromecast)');
  btn.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm18-7H5v1.63c3.96 1.28 7.09 4.41 8.37 8.37H19V7zM1 10v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3C1.9 3 1 3.9 1 5v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>';
  btn.style.position = 'absolute';
  btn.style.top = '12px';
  btn.style.right = '12px';
  btn.style.zIndex = '100';
  btn.style.background = 'rgba(0,0,0,0.7)';
  btn.style.border = 'none';
  btn.style.borderRadius = '50%';
  btn.style.width = '44px';
  btn.style.height = '44px';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.color = '#fff';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
  btn.style.opacity = '0.95';
  btn.style.transition = 'color 0.2s, opacity 0.2s';
  container.style.position = 'relative';
  container.appendChild(btn);

  btn.addEventListener('click', function () {
    if (window.cast && window.cast.framework) {
      var ctx = cast.framework.CastContext.getInstance();
      ctx.requestSession().then(function () {
        var session = ctx.getCurrentSession();
        if (!session) return;
        var mediaInfo = new chrome.cast.media.MediaInfo(streamUrl, 'application/x-mpegURL');
        mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;
        var meta = new chrome.cast.media.GenericMediaMetadata();
        meta.title = 'AlternaTV · En vivo';
        meta.images = [{ url: 'https://tv.alterna.ar/logoalternatv.png' }];
        mediaInfo.metadata = meta;
        var req = new chrome.cast.media.LoadRequest(mediaInfo);
        req.autoplay = true;
        session.loadMedia(req);
      });
    } else {
      alert('No se detectó el SDK de Google Cast. Usá Chrome o Chromium.');
    }
  });
}

function setCastButtonVisibility(visible) {
  var btn = document.getElementById('floating-cast-btn');
  if (btn) btn.style.display = visible ? 'flex' : 'none';
  var barBtn = document.querySelector('.universal-cast-btn');
  if (barBtn) barBtn.style.display = visible ? 'inline-flex' : 'none';
}

// Escuchar cambios de disponibilidad de dispositivos Cast
function monitorCastAvailability() {
  if (window.cast && window.cast.framework) {
    var ctx = cast.framework.CastContext.getInstance();
    function update() {
      var state = ctx.getCastState();
      setCastButtonVisibility(state === cast.framework.CastState.NOT_CONNECTED || state === cast.framework.CastState.CONNECTING || state === cast.framework.CastState.CONNECTED);
    }
    ctx.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, update);
    update();
  } else {
    setCastButtonVisibility(false);
  }
}

function initShakaPlayer() {
  if (!window.shaka) {
    alert('No se pudo cargar el reproductor de video.');
    return;
  }
  // Usar URL absoluta para el manifest HLS en el directorio superior
  var manifestUri = '/stream/hls/live.m3u8';
  var video = document.getElementById('shaka-player');
  var container = document.getElementById('shaka-player-container');

  // Quitar controles nativos si los hubiera
  video.removeAttribute('controls');

  // Inicializar Shaka Player (nuevo método)
  shaka.polyfill.installAll();
  if (!shaka.Player.isBrowserSupported()) {
    alert('Tu navegador no soporta video streaming moderno.');
    return;
  }

  // Crear el player y la UI Overlay
  var player = new shaka.Player();
  player.attach(video);

  // Solo una instancia de UI Overlay
  var ui;
  if (!container.classList.contains('shaka-initialized')) {
    ui = new shaka.ui.Overlay(player, container, video);
    container.classList.add('shaka-initialized');
    ui.configure({
      addBigPlayButton: true,
      controlPanelElements: [
        'play_pause', 'time_and_duration', 'mute', 'volume', 'spacer',
        'fullscreen', 'overflow_menu' // quitamos 'cast' nativo
      ],
      seekBarColors: {
        base: 'rgba(255,255,255,0.2)',
        buffered: 'rgba(255,255,255,0.4)',
        played: '#d20000'
      }
    });
  } else {
    ui = container.querySelector('.shaka-controls-container');
  }

  // Inyectar botón Cast universal SIEMPRE visible
  addUniversalCastButton(player, video, container, manifestUri, 0);

  // Inyectar botón Cast flotante arriba a la derecha del reproductor
  injectFloatingCastButton(manifestUri);

  // Monitor de disponibilidad de dispositivos Cast
  setTimeout(monitorCastAvailability, 1200);

  // Diagnóstico Cast (opcional)
  setTimeout(function() {
    var castBtn = container.querySelector('.universal-cast-btn');
    if (castBtn) {
      castBtn.title = 'Enviar a TV (Chromecast)';
    }
  }, 2000);

  // Cargar el stream
  player.load(manifestUri).then(function() {
    video.style.background = 'black';
  }).catch(function(error) {
    video.style.background = '#300';
    alert('No se pudo cargar el stream en vivo.\n\nVerificá tu conexión o intentá más tarde.');
    console.error('Error cargando el stream:', error);
  });
}

document.addEventListener('DOMContentLoaded', initShakaPlayer);
