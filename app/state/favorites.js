const STORAGE_KEY = "hub:fav:v1";
const listeners = new Set();

export function getFavorites() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed);
  } catch (error) {
    console.warn("Favoriten konnten nicht gelesen werden", error);
    return new Set();
  }
}

export function setFavorites(favorites) {
  try {
    const ids = Array.from(favorites);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    emitChange(new Set(ids));
  } catch (error) {
    console.warn("Favoriten konnten nicht gespeichert werden", error);
  }
}

export function toggleFavorite(id) {
  const favorites = getFavorites();
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }
  setFavorites(favorites);
}

export function isFavorite(id) {
  return getFavorites().has(id);
}

export function onFavoritesChange(callback) {
  if (typeof callback !== "function") {
    return () => {};
  }
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function listFavorites() {
  return Array.from(getFavorites());
}

function emitChange(favorites) {
  listeners.forEach((listener) => {
    try {
      listener(favorites);
    } catch (error) {
      console.error("Fehler im Favoriten-Listener", error);
    }
  });
}
