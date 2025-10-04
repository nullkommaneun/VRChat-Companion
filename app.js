import { bootstrapEventsSection } from "./app/events/bootstrapEvents.js";

const ROUTES = new Set(["home", "events", "calendar", "admin"]);

const main = document.getElementById("app");
const yearEl = document.getElementById("year");
const navButtons = document.querySelectorAll(".nav-list [data-route]");
const themeButtons = document.querySelectorAll(".theme-toggle [data-theme]");
const root = document.documentElement;

const storedTheme = readStoredTheme();
if (storedTheme && [...themeButtons].some((btn) => btn.dataset.theme === storedTheme)) {
  applyTheme(storedTheme, { updateStorage: false });
} else {
  applyTheme(root.dataset.theme || "mixed", { updateStorage: false });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const route = button.dataset.route;
    if (!route) return;
    if (window.location.hash.replace("#", "") !== route) {
      window.location.hash = route;
    } else {
      renderRoute(route);
    }
  });
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const theme = button.dataset.theme;
    applyTheme(theme, { updateStorage: true });
  });
});

window.addEventListener("hashchange", () => {
  renderRoute(window.location.hash.replace("#", ""));
});

window.addEventListener("load", () => {
  const initialRoute = window.location.hash.replace("#", "") || "home";
  renderRoute(initialRoute);
  yearEl.textContent = new Date().getFullYear();
  registerServiceWorker();
  bootstrapEventsSection();
});

function renderRoute(route) {
  const targetRoute = ROUTES.has(route) ? route : "home";
  document.title = `Community Hub — ${targetRoute.charAt(0).toUpperCase()}${targetRoute.slice(1)}`;
  const views = document.querySelectorAll(".view");
  views.forEach((section) => {
    const isActive = section.dataset.view === targetRoute;
    section.hidden = !isActive;
    section.setAttribute("aria-hidden", String(!isActive));
  });
  navButtons.forEach((btn) => {
    const isActive = btn.dataset.route === targetRoute;
    btn.classList.toggle("is-active", isActive);
    if (isActive) {
      btn.setAttribute("aria-current", "page");
    } else {
      btn.removeAttribute("aria-current");
    }
  });
  requestAnimationFrame(() => {
    try {
      main.focus({ preventScroll: false });
    } catch (error) {
      main.focus();
    }
  });
  if (window.location.hash.replace("#", "") !== targetRoute) {
    window.location.hash = targetRoute;
  }
}

function applyTheme(theme, { updateStorage } = { updateStorage: true }) {
  if (!theme) return;
  root.setAttribute("data-theme", theme);
  themeButtons.forEach((btn) => {
    const isActive = btn.dataset.theme === theme;
    btn.setAttribute("aria-pressed", String(isActive));
    btn.classList.toggle("is-active", isActive);
  });
  if (updateStorage) {
    try {
      localStorage.setItem("community-hub-theme", theme);
    } catch (error) {
      console.warn("Theme preference could not be saved", error);
    }
  }
}

function readStoredTheme() {
  try {
    return localStorage.getItem("community-hub-theme");
  } catch (error) {
    console.warn("Theme preference could not be read", error);
    return null;
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((error) => {
        console.error("Service Worker registration failed", error);
      });
  }
}
