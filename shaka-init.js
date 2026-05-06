// Inicialización de Shaka Player con soporte Chromecast y controles pro

function initShakaPlayer() {
  if (!window.shaka) {
    console.error('Shaka Player no cargado');
    return;
  }
  var manifestUri = 'https://tv.alterna.ar/stream/hls/live.m3u8';
  var video = document.getElementById('shaka-player');
  var container = document.getElementById('shaka-player-container');

  // Configuración de la UI
  var ui = new shaka.ui.Overlay(
    new shaka.Player(video),
    container,
    video
  );
  var controls = ui.getControls();

  // Opciones de la UI: mostrar botón de Cast
  ui.configure({
    addBigPlayButton: true,
    controlPanelElements: [
      'play_pause', 'time_and_duration', 'mute', 'volume', 'spacer',
      'cast', 'fullscreen', 'overflow_menu'
    ],
    castReceiverAppId: 'CC1AD845', // Default Media Receiver
    seekBarColors: {
      base: 'rgba(255,255,255,0.2)',
      buffered: 'rgba(255,255,255,0.4)',
      played: '#d20000'
    }
  });

  // Inicializar Shaka Player
  shaka.polyfill.installAll();
  if (!shaka.Player.isBrowserSupported()) {
    alert('Tu navegador no soporta video streaming moderno.');
    return;
  }

  // Cargar el stream
  ui.getPlayer().load(manifestUri).catch(function(error) {
    console.error('Error cargando el stream:', error);
  });
}

document.addEventListener('DOMContentLoaded', initShakaPlayer);

