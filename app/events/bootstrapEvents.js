import { parseISODate, formatDateTime, isToday, isThisWeek, compareAsc } from "../utils/date.js";
import { createSkeletonList } from "../components/Skeleton.js";
import { createEventCard } from "../components/EventCard.js";
import { getFavorites, toggleFavorite, onFavoritesChange } from "../state/favorites.js";

const DATA_ENDPOINTS = {
  events: "./data/events.sample.json",
  news: "./data/news.sample.json"
};

const SCHEMA_ENDPOINTS = {
  events: "./media/schemas/events.schema.json",
  news: "./media/schemas/news.schema.json"
};

const schemaCache = new Map();

const EVENT_TABS = [
  {
    id: "today",
    label: "Heute",
    filter: (event) => isToday(parseISODate(event.startsAt))
  },
  {
    id: "week",
    label: "Diese Woche",
    filter: (event) => {
      const date = parseISODate(event.startsAt);
      return !isToday(date) && isThisWeek(date);
    }
  },
  {
    id: "upcoming",
    label: "Bald",
    filter: (event) => {
      const date = parseISODate(event.startsAt);
      return date && date > endOfWeek();
    }
  }
];

export function bootstrapEventsSection() {
  const eventsSection = document.querySelector('[data-view="events"]');
  if (!eventsSection) return;

  const contentContainer = document.createElement("div");
  contentContainer.className = "events-layout";
  contentContainer.setAttribute("role", "region");
  contentContainer.setAttribute("aria-live", "polite");
  eventsSection.replaceChildren(createEventsHeader(), contentContainer);

  const tablist = document.createElement("div");
  tablist.className = "tablist";
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", "Event-Zeiträume");

  EVENT_TABS.forEach((tab, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-button";
    button.textContent = tab.label;
    button.id = `events-tab-${tab.id}`;
    button.setAttribute("role", "tab");
    button.setAttribute("data-tab", tab.id);
    button.setAttribute("aria-selected", String(index === 0));
    button.setAttribute("tabindex", index === 0 ? "0" : "-1");
    button.addEventListener("click", () => activateTab(tab.id));
    button.addEventListener("keydown", (event) => handleTabKeydown(event, tab.id));
    tablist.appendChild(button);
  });

  const favoritesToggle = document.createElement("button");
  favoritesToggle.type = "button";
  favoritesToggle.className = "favorites-filter";
  favoritesToggle.textContent = "Nur Favoriten";
  favoritesToggle.setAttribute("aria-pressed", "false");
  favoritesToggle.addEventListener("click", () => {
    const pressed = favoritesToggle.getAttribute("aria-pressed") === "true";
    favoritesToggle.setAttribute("aria-pressed", String(!pressed));
    renderEvents(currentEvents, { force: true });
  });

  const tabsWrapper = document.createElement("div");
  tabsWrapper.className = "tabs-wrapper";
  tabsWrapper.append(tablist, favoritesToggle);

  contentContainer.appendChild(tabsWrapper);

  const panelsContainer = document.createElement("div");
  panelsContainer.className = "tab-panels";
  EVENT_TABS.forEach((tab, index) => {
    const panel = document.createElement("div");
    panel.id = `events-panel-${tab.id}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `events-tab-${tab.id}`);
    panel.hidden = index !== 0;
    panel.setAttribute("tabindex", "-1");
    panel.dataset.tabPanel = tab.id;
    panel.appendChild(createSkeletonList({ count: 3, variant: "event" }));
    panelsContainer.appendChild(panel);
  });

  contentContainer.appendChild(panelsContainer);

  let currentEvents = [];
  const offlineNotice = createOfflineNotice();
  contentContainer.appendChild(offlineNotice);

  const cache = new Map();

  const loadData = async () => {
    const cacheKey = "events";
    let fromCache = false;

    try {
      const cached = cache.get(cacheKey);
      if (cached) {
        currentEvents = cached;
        renderEvents(cached);
        fromCache = true;
      }

      const { data, stale } = await fetchWithCache(DATA_ENDPOINTS.events, {
        cacheKey,
        cache,
        schemaType: "events"
      });
      currentEvents = data;
      renderEvents(data, { force: stale });
      toggleOfflineNotice(false);
    } catch (error) {
      console.error("Events konnten nicht geladen werden", error);
      toggleOfflineNotice(!navigator.onLine);
      showErrorOverlay(error, { context: "Events laden" });
      if (!fromCache) {
        renderEmptyState();
      }
    }
  };

  loadData();

  window.addEventListener("online", () => {
    toggleOfflineNotice(false);
    loadData();
  });

  window.addEventListener("offline", () => {
    toggleOfflineNotice(true);
  });

  onFavoritesChange(() => renderEvents(currentEvents, { force: true }));

  function createEventsHeader() {
    const header = document.createElement("header");
    header.className = "events-header";

    const heading = document.createElement("h2");
    heading.textContent = "Kommende Events";
    heading.id = "events-heading";

    const description = document.createElement("p");
    description.className = "section-description";
    description.textContent =
      "Behalte die nächsten Community-Termine im Blick und markiere deine Favoriten.";

    header.append(heading, description);
    return header;
  }

  function activateTab(tabId) {
    const buttons = tablist.querySelectorAll("[role='tab']");
    const panels = panelsContainer.querySelectorAll("[role='tabpanel']");
    buttons.forEach((btn) => {
      const isActive = btn.dataset.tab === tabId;
      btn.setAttribute("aria-selected", String(isActive));
      btn.setAttribute("tabindex", isActive ? "0" : "-1");
    });
    panels.forEach((panel) => {
      const isActive = panel.dataset.tabPanel === tabId;
      panel.hidden = !isActive;
      if (isActive) {
        requestAnimationFrame(() => panel.focus());
      }
    });
    renderEvents(currentEvents, { force: true });
  }

  function handleTabKeydown(event, tabId) {
    const buttons = [...tablist.querySelectorAll("[role='tab']")];
    const currentIndex = buttons.findIndex((btn) => btn.dataset.tab === tabId);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % buttons.length;
      buttons[nextIndex].click();
      buttons[nextIndex].focus();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      buttons[prevIndex].click();
      buttons[prevIndex].focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      buttons[0].click();
      buttons[0].focus();
    } else if (event.key === "End") {
      event.preventDefault();
      buttons[buttons.length - 1].click();
      buttons[buttons.length - 1].focus();
    }
  }

  function renderEvents(events, { force = false } = {}) {
    if (!Array.isArray(events) || events.length === 0) {
      renderEmptyState();
      return;
    }

    const favoritesSet = getFavorites();
    const favoritesOnly = contentContainer
      .querySelector(".favorites-filter")
      ?.getAttribute("aria-pressed") === "true";

    EVENT_TABS.forEach((tab) => {
      const panel = panelsContainer.querySelector(`[data-tab-panel='${tab.id}']`);
      if (!panel) return;

      const filtered = events
        .filter((event) => isValidEvent(event))
        .filter((event) => (favoritesOnly ? favoritesSet.has(event.id) : true))
        .filter(tab.filter)
        .sort((a, b) => compareAsc(parseISODate(a.startsAt), parseISODate(b.startsAt)));

      const renderedIds = JSON.stringify(filtered.map((event) => event.id));
      if (!force && panel.dataset.rendered === renderedIds) {
        return;
      }

      panel.dataset.rendered = renderedIds;
      panel.replaceChildren();

      if (filtered.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = favoritesOnly
          ? "Keine Favoriten in diesem Zeitraum."
          : "Keine Events in diesem Zeitraum geplant.";
        panel.appendChild(empty);
        return;
      }

      const list = document.createElement("ul");
      list.className = "event-list";
      list.setAttribute("role", "list");

      filtered.forEach((event) => {
        const card = createEventCard({
          event,
          onToggleFavorite: () => toggleFavorite(event.id),
          favorite: favoritesSet.has(event.id),
          formatDate: formatDateTime
        });
        list.appendChild(card);
      });

      panel.appendChild(list);
    });
  }

  function renderEmptyState() {
    EVENT_TABS.forEach((tab) => {
      const panel = panelsContainer.querySelector(`[data-tab-panel='${tab.id}']`);
      if (!panel) return;
      panel.replaceChildren(createSkeletonList({ count: 3, variant: "event" }));
      delete panel.dataset.rendered;
    });
  }

  function toggleOfflineNotice(visible) {
    offlineNotice.hidden = !visible;
  }

  function createOfflineNotice() {
    const banner = document.createElement("div");
    banner.className = "offline-banner";
    banner.hidden = true;
    banner.setAttribute("role", "status");
    banner.textContent = "Offline: Zeige zuletzt gespeicherte Daten.";
    return banner;
  }
}

async function fetchWithCache(url, { cacheKey, signal, cache, schemaType }) {
  const cacheStore = cache instanceof Map ? cache : new Map();
  const mergedSignal = mergeSignals([signal]);
  let stale = false;

  try {
    if (cacheStore.has(cacheKey)) {
      stale = true;
    }

    const response = await fetch(url, { cache: "no-cache", signal: mergedSignal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} beim Laden von ${url}`);
    }

    const json = await response.json();
    await validateData(schemaType, json);
    cacheStore.set(cacheKey, json);
    return { data: json, stale };
  } catch (error) {
    if (cacheStore.has(cacheKey)) {
      return { data: cacheStore.get(cacheKey), stale: true };
    }
    throw error;
  }
}

function mergeSignals(signals) {
  const filtered = signals.filter(Boolean);
  if (filtered.length === 0) return undefined;
  const controller = new AbortController();
  filtered.forEach((signal) => {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener(
        "abort",
        () => {
          controller.abort(signal.reason);
        },
        { once: true }
      );
    }
  });
  return controller.signal;
}

async function validateData(type, data) {
  if (!type) return;
  if (!Array.isArray(data)) {
    throw new Error(`Erwartete Array-Daten für ${type}`);
  }

  const schema = await loadSchema(type);
  const definition = schema?.items || schema;
  if (!definition) {
    throw new Error(`Kein Schema für ${type} hinterlegt`);
  }

  data.forEach((item, index) => {
    const errors = validateAgainstSchema(definition, item);
    if (errors.length > 0) {
      const error = new Error(`Schema-Fehler in ${type}[${index}]: ${errors.join(", ")}`);
      error.source = type;
      error.index = index;
      throw error;
    }
  });
}

async function loadSchema(type) {
  const url = SCHEMA_ENDPOINTS[type];
  if (!url) {
    throw new Error(`Unbekannter Schema-Typ: ${type}`);
  }

  if (schemaCache.has(type)) {
    return schemaCache.get(type);
  }

  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} beim Laden des ${type}-Schemas`);
    }
    const schema = await response.json();
    schemaCache.set(type, schema);
    return schema;
  } catch (error) {
    if (schemaCache.has(type)) {
      return schemaCache.get(type);
    }
    throw error;
  }
}

function validateAgainstSchema(schema, item) {
  const errors = [];
  const { properties = {}, required = [] } = schema;
  required.forEach((field) => {
    if (!(field in item)) {
      errors.push(`Feld ${field} fehlt`);
    }
  });
  Object.entries(properties).forEach(([key, definition]) => {
    const value = item[key];
    if (value === undefined || value === null) return;
    if (definition.type === "string" && typeof value !== "string") {
      errors.push(`Feld ${key} muss string sein`);
    }
    if (definition.type === "boolean" && typeof value !== "boolean") {
      errors.push(`Feld ${key} muss boolean sein`);
    }
    if (definition.type === "array") {
      if (!Array.isArray(value)) {
        errors.push(`Feld ${key} muss array sein`);
      } else if (definition.items?.type === "string" && value.some((entry) => typeof entry !== "string")) {
        errors.push(`Feld ${key} darf nur Strings enthalten`);
      }
    }
    if (definition.format === "date-time" && !isISODateTime(value)) {
      errors.push(`Feld ${key} muss ISO-8601 UTC sein`);
    }
  });
  return errors;
}

function isISODateTime(value) {
  if (typeof value !== "string") return false;
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  return isoPattern.test(value);
}

function endOfWeek(baseDate = new Date()) {
  const date = new Date(
    Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate())
  );
  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : 6 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

function isValidEvent(event) {
  if (!event) return false;
  const start = parseISODate(event.startsAt);
  const end = parseISODate(event.endsAt);
  if (!start || !end) return false;
  return end >= start;
}

function showErrorOverlay(error, { context } = {}) {
  const existing = document.querySelector(".error-overlay");
  if (existing) {
    existing.remove();
  }
  const overlay = document.createElement("div");
  overlay.className = "error-overlay";
  overlay.setAttribute("role", "alert");
  overlay.setAttribute("aria-live", "assertive");

  const heading = document.createElement("h3");
  heading.textContent = "Es ist ein Fehler aufgetreten";

  const message = document.createElement("p");
  message.textContent = error.message || String(error);

  const metaList = document.createElement("dl");
  metaList.className = "error-meta";

  if (context) {
    const dt = document.createElement("dt");
    dt.textContent = "Kontext";
    const dd = document.createElement("dd");
    dd.textContent = context;
    metaList.append(dt, dd);
  }

  if (error.source) {
    const dt = document.createElement("dt");
    dt.textContent = "Quelle";
    const dd = document.createElement("dd");
    dd.textContent = error.source;
    metaList.append(dt, dd);
  }

  if (error.line || error.lineno) {
    const dt = document.createElement("dt");
    dt.textContent = "Zeile";
    const dd = document.createElement("dd");
    dd.textContent = error.line || error.lineno;
    metaList.append(dt, dd);
  }

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "error-close";
  closeButton.textContent = "Schließen";
  closeButton.addEventListener("click", () => overlay.remove());

  overlay.append(heading, message, metaList, closeButton);

  document.body.appendChild(overlay);
}
