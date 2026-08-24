import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

const zoomShortcutKeys = new Set(['+', '=', '-', '_']);

function preventBrowserZoom(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && zoomShortcutKeys.has(event.key)) {
    event.preventDefault();
  }
}

function preventWheelZoom(event: WheelEvent) {
  if (event.ctrlKey) event.preventDefault();
}

document.addEventListener('keydown', preventBrowserZoom);
document.addEventListener('wheel', preventWheelZoom, { passive: false });
document.addEventListener('gesturestart', (event) => event.preventDefault());
document.addEventListener('gesturechange', (event) => event.preventDefault());
document.addEventListener('gestureend', (event) => event.preventDefault());

createApp(App).mount('#app');
