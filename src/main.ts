import { App } from './ui/app';

const ui = document.getElementById('ui');
const canvas = document.getElementById('scene');

if (!ui) throw new Error('No se encontró la capa de interfaz (#ui).');
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('No se encontró el lienzo (#scene).');

const app = new App(ui, canvas);

declare global {
  interface Window {
    __energyGame?: App;
  }
}

// Útil para depurar desde la consola del navegador.
window.__energyGame = app;
