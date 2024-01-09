import Component from '../layout/Component.js';
import { createDeepReactiveState } from '../utils/stateUtils.js';

async function initApp() {
  initGlobalState();
  //initErrorHandler();
  await renderPage();
}

function initGlobalState() {
  const { state, on, onStateChange } = createDeepReactiveState();
  Object.defineProperty(window, "state", {
    value: state,
    writable: false,
    configurable: false,
  });
  window.on = on;
  window.onStateChange = onStateChange;
}

function initErrorHandler() {
  const errorContainer = document.getElementById('error-container');
  const errorHandler = new ErrorHandler(errorContainer);
  errorHandler.listen();
}

async function renderPage() {
  const route = getLastPathSegment();
  const page = new Component(null, route);
  await page.render();
  const pageContainer = document.getElementById("page");
  pageContainer?.appendChild(page.element);
}

function getCurrentRoute() {
  return window.location.pathname;
}

function getLastPathSegment() {
  const pathSegments = window.location.pathname.split("/").filter(segment => segment !== "");
  if (pathSegments.length === 0) {
    return "/";
  }
  return pathSegments.pop();
}

initApp();
