export const STORAGE_KEYS = {
  playerName: "boggle:playerName",
  lastRoomId: "boggle:lastRoomId",
  playerPreferences: "boggle:playerPreferences",
  clientId: "boggle:clientId",
};

export function loadLocalSettings() {
  return {
    playerName: readLocalString(STORAGE_KEYS.playerName),
    lastRoomId: readLocalString(STORAGE_KEYS.lastRoomId),
    playerPreferences: readLocalJson(STORAGE_KEYS.playerPreferences, {}),
  };
}

export function getOrCreateClientId() {
  forgetSharedClientId();

  const savedClientId = readSessionString(STORAGE_KEYS.clientId);
  if (savedClientId) {
    return savedClientId;
  }

  const clientId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  saveSessionString(STORAGE_KEYS.clientId, clientId);
  return clientId;
}

export function saveLocalString(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local storage may be unavailable in private browsing.
  }
}

export function saveLocalJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage may be unavailable in private browsing.
  }
}

function forgetSharedClientId() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.clientId);
  } catch {
    // Local storage may be unavailable in private browsing.
  }
}

function readSessionString(key) {
  try {
    return window.sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function saveSessionString(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Session storage may be unavailable in private browsing.
  }
}

function readLocalString(key) {
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function readLocalJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
