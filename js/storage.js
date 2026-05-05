// Centralized storage for tasks, logs, and streaks using localStorage

const Storage = (function () {
  const KEYS = {
    ACTIVE_USER: "RES_ACTIVE_USER_V1",
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

  function getActiveUser() {
    const stored = safeParse(window.localStorage.getItem(KEYS.ACTIVE_USER), null);
    if (stored && stored.id && stored.name) {
      return {
        id: String(stored.id),
        name: String(stored.name),
        email: typeof stored.email === "string" ? stored.email : "",
      };
    }
    return null;
  }

  function setActiveUser(nextUser) {
    if (!nextUser || !nextUser.id) return null;
    const user = {
      id: String(nextUser.id),
      name: String(nextUser.name || nextUser.email || "Signed in user"),
      email: String(nextUser.email || ""),
    };
    window.localStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(user));
    return user;
  }

  function clearActiveUser() {
    window.localStorage.removeItem(KEYS.ACTIVE_USER);
  }

  function userKey(baseKey) {
    const user = getActiveUser();
    return baseKey + "_" + (user ? user.id : "signed-out");
  }

  function loadTasks() {
    const raw = window.localStorage.getItem(userKey(KEYS.TASKS));
    const value = safeParse(raw, []);
    if (!Array.isArray(value)) return [];
    return value;
  }

  function saveTasks(tasks) {
    const user = getActiveUser();
    if (!user) return;
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
    const user = getActiveUser();
    if (!user) {
      return null;
    }
    if (!window.navigator.onLine) {
      return null;
    }
    if (!window.FirebaseServices || !window.FirebaseServices.loadTasks) {
      return null;
    }

    try {
      const tasks = await window.FirebaseServices.loadTasks(user.id);
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
    clearActiveUser,
    loadTasks,
    loadTasksFromFirebase,
    saveTasks,
    loadStreak,
    saveStreak,
  };
})();
