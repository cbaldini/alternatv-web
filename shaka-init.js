// Inicialización de Shaka Player con soporte Chromecast y controles pro

function initShakaPlayer() {
  if (!window.shaka) {
    alert('No se pudo cargar el reproductor de video.');
    return;
  }
  var manifestUri = 'https://tv.alterna.ar/stream/hls/live.m3u8';
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
  if (!container.classList.contains('shaka-initialized')) {
    var ui = new shaka.ui.Overlay(player, container, video);
    container.classList.add('shaka-initialized');
    ui.configure({
      addBigPlayButton: true,
      controlPanelElements: [
        'play_pause', 'time_and_duration', 'mute', 'volume', 'spacer',
        'cast', 'fullscreen', 'overflow_menu'
      ],
      castReceiverAppId: 'CC1AD845',
      seekBarColors: {
        base: 'rgba(255,255,255,0.2)',
        buffered: 'rgba(255,255,255,0.4)',
        played: '#d20000'
      }
    });
  }

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
