// Centralized storage for tasks, logs, and streaks using localStorage

const Storage = (function () {
  const KEYS = {
    ACTIVE_USER: "RES_ACTIVE_USER_V1",
    DEVICE_USER_NAME: "RES_DEVICE_USER_NAME_V1",
    TASKS: "RES_TASKS_V1",
    STREAK: "RES_STREAK_V1",
  };

  function safeParse(json, fallback) {
    if (!json) return fallback;
    try {
      const value = JSON.parse(json);
      if (value && typeof value === "object") {
        return value;
      }
      return fallback;
    } catch (_e) {
      // corrupted data, return fallback
      return fallback;
    }
  }

  function normalizeUserName(name) {
    const value = String(name || "").trim();
    return value || "Guest";
  }

  function makeUserId(name) {
    return normalizeUserName(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "guest";
  }

  function getDefaultUserName() {
    const existing = window.localStorage.getItem(KEYS.DEVICE_USER_NAME);
    if (existing) return existing;
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const name = "User " + suffix;
    window.localStorage.setItem(KEYS.DEVICE_USER_NAME, name);
    return name;
  }

  function getActiveUser() {
    const stored = safeParse(window.localStorage.getItem(KEYS.ACTIVE_USER), null);
    if (stored && stored.id && stored.name) {
      return {
        id: String(stored.id),
        name: normalizeUserName(stored.name),
      };
    }

    const fallbackName = normalizeUserName(
      window.prompt("Enter your name to load your own tasks", getDefaultUserName())
    );
    return setActiveUser(fallbackName);
  }

  function setActiveUser(name) {
    const user = {
      id: makeUserId(name),
      name: normalizeUserName(name),
    };
    window.localStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(user));
    return user;
  }

  function userKey(baseKey) {
    return baseKey + "_" + getActiveUser().id;
  }

  function loadTasks() {
    const raw = window.localStorage.getItem(userKey(KEYS.TASKS));
    const value = safeParse(raw, []);
    if (!Array.isArray(value)) return [];
    return value;
  }

  function saveTasks(tasks) {
    const user = getActiveUser();
    window.localStorage.setItem(userKey(KEYS.TASKS), JSON.stringify(tasks));
    if (!window.navigator.onLine) {
      return;
    }
    if (window.FirebaseServices && window.FirebaseServices.saveTasks) {
      window.FirebaseServices.saveTasks(tasks, user).catch((error) => {
        console.warn("Could not save tasks to Firebase.", error);
      });
    }
  }

  async function loadTasksFromFirebase() {
    if (!window.navigator.onLine) {
      return null;
    }
    if (!window.FirebaseServices || !window.FirebaseServices.loadTasks) {
      return null;
    }

    try {
      const tasks = await window.FirebaseServices.loadTasks(getActiveUser().id);
      if (Array.isArray(tasks)) {
        window.localStorage.setItem(userKey(KEYS.TASKS), JSON.stringify(tasks));
        return tasks;
      }
      return null;
    } catch (error) {
      console.warn("Could not load tasks from Firebase.", error);
      return null;
    }
  }

  function loadStreak() {
    const raw = window.localStorage.getItem(userKey(KEYS.STREAK));
    const value = safeParse(raw, null);
    if (!value) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastDate: null,
      };
    }
    return {
      currentStreak: Number(value.currentStreak) || 0,
      longestStreak: Number(value.longestStreak) || 0,
      lastDate: typeof value.lastDate === "string" ? value.lastDate : null,
    };
  }

  function saveStreak(streak) {
    window.localStorage.setItem(userKey(KEYS.STREAK), JSON.stringify(streak));
  }

  return {
    getActiveUser,
    setActiveUser,
    loadTasks,
    loadTasksFromFirebase,
    saveTasks,
    loadStreak,
    saveStreak,
  };
})();
