// Main application logic

const App = (function () {
  const COMPLETION_GRACE_MINUTES = 15;
  let tasks = [];
  let currentDateISO = Utils.todayISO();
  let scheduleContainer = null;
  let dateInput = null;
  let activeUser = null;
  let toastTimeoutId = null;
  let animatedTaskId = null;
  let animatedTaskTimeoutId = null;

  function generateId() {
    return (
      "t_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(16).slice(2, 8)
    );
  }

  function showToast(message) {
    const toast = document.getElementById("app-toast");
    if (!toast) return;

    if (toastTimeoutId) {
      window.clearTimeout(toastTimeoutId);
    }

    toast.textContent = message;
    toast.classList.add("toast--visible");

    toastTimeoutId = window.setTimeout(() => {
      toast.classList.remove("toast--visible");
      toastTimeoutId = null;
    }, 2000);
  }

  function animateTask(taskId) {
    animatedTaskId = taskId;

    if (animatedTaskTimeoutId) {
      window.clearTimeout(animatedTaskTimeoutId);
    }

    animatedTaskTimeoutId = window.setTimeout(() => {
      animatedTaskId = null;
      animatedTaskTimeoutId = null;
      renderAll();
    }, 900);
  }

  function initDateControls() {
    dateInput = document.getElementById("current-date");
    dateInput.value = currentDateISO;
    dateInput.addEventListener("change", () => {
      currentDateISO = dateInput.value || Utils.todayISO();
      renderAll();
    });

    const shiftButtons = document.querySelectorAll(".nav-date-btn");
    shiftButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const delta = Number(btn.dataset.shift) || 0;
        currentDateISO = Utils.shiftISODate(currentDateISO, delta);
        dateInput.value = currentDateISO;
        renderAll();
      });
    });
  }

  function refreshTasksFromStorage() {
    tasks = Storage.loadTasks();
    renderAll();
    Storage.loadTasksFromFirebase().then((firebaseTasks) => {
      if (Array.isArray(firebaseTasks)) {
        tasks = firebaseTasks;
        renderAll();
      }
    });
  }

  function initUserControls() {
    activeUser = Storage.getActiveUser();
    const userInput = document.getElementById("active-user-name");
    const switchBtn = document.getElementById("switch-user");
    if (!userInput || !switchBtn) return;

    userInput.value = activeUser.name;

    function switchUser() {
      const nextName = userInput.value.trim();
      if (!nextName) {
        window.alert("User name is required.");
        userInput.value = activeUser.name;
        return;
      }
      const nextUser = Storage.setActiveUser(nextName);
      if (activeUser && nextUser.id === activeUser.id) return;
      activeUser = nextUser;
      refreshTasksFromStorage();
      showToast("Switched to " + activeUser.name);
    }

    switchBtn.addEventListener("click", switchUser);
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        switchUser();
      }
    });
  }

  function initTabs() {
    const tabs = document.querySelectorAll(".nav-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.view;
        tabs.forEach((t) => t.classList.remove("nav-tab--active"));
        tab.classList.add("nav-tab--active");

        const views = document.querySelectorAll(".view");
        const mainLayout = document.querySelector(".main-layout");
        const analyticsSection = document.getElementById("analytics-section");
        
        views.forEach((v) => {
          if (v.dataset.viewId === target) {
            v.classList.add("view--active");
            if (target === "yearly-report") {
              renderYearlyReport();
              if (mainLayout) mainLayout.classList.add("main-layout--yearly-report");
              if (analyticsSection) analyticsSection.classList.add("main-layout__charts--hidden");
            } else {
              if (mainLayout) mainLayout.classList.remove("main-layout--yearly-report");
              if (analyticsSection) analyticsSection.classList.remove("main-layout__charts--hidden");
            }
          } else {
            v.classList.remove("view--active");
          }
        });
      });
    });
  }

  function initAnalyticsControls() {
    const mainLayout = document.querySelector(".main-layout");
    const minimizeBtn = document.getElementById("analytics-minimize");
    const maximizeBtn = document.getElementById("analytics-maximize");
    if (!mainLayout || !minimizeBtn || !maximizeBtn) return;

    function refreshCharts() {
      window.setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 220);
    }

    function updateButtons() {
      const isCollapsed = mainLayout.classList.contains(
        "main-layout--analytics-collapsed"
      );
      const isExpanded = mainLayout.classList.contains(
        "main-layout--analytics-expanded"
      );

      minimizeBtn.setAttribute("aria-pressed", String(isCollapsed));
      maximizeBtn.setAttribute("aria-pressed", String(isExpanded));
      minimizeBtn.title = isCollapsed ? "Show analytics" : "Minimize analytics";
      minimizeBtn.setAttribute(
        "aria-label",
        isCollapsed ? "Show analytics" : "Minimize analytics"
      );
      minimizeBtn.textContent = isCollapsed ? "+" : "-";
      maximizeBtn.title = isExpanded ? "Restore analytics" : "Maximize analytics";
      maximizeBtn.setAttribute(
        "aria-label",
        isExpanded ? "Restore analytics" : "Maximize analytics"
      );
    }

    minimizeBtn.addEventListener("click", () => {
      mainLayout.classList.toggle("main-layout--analytics-collapsed");
      mainLayout.classList.remove("main-layout--analytics-expanded");
      updateButtons();
      refreshCharts();
    });

    maximizeBtn.addEventListener("click", () => {
      mainLayout.classList.toggle("main-layout--analytics-expanded");
      mainLayout.classList.remove("main-layout--analytics-collapsed");
      updateButtons();
      refreshCharts();
    });

    updateButtons();
  }

  function initSchedule() {
    scheduleContainer = document.getElementById("schedule-container");
    scheduleContainer.innerHTML = "";
    const nowCtx = getNowContext();
    const isToday = Utils.isSameISODate(currentDateISO, nowCtx.nowISO);
    const currentHour = isToday ? new Date().getHours() : -1;

    for (let h = 0; h < 24; h += 1) {
      const row = document.createElement("div");
      row.className = "schedule-row";
      if (isToday && h === currentHour) {
        row.classList.add("schedule-row--current");
      }
      const hourCell = document.createElement("div");
      hourCell.className = "schedule-row__hour";
      hourCell.textContent = Utils.formatHourLabel(h);
      const tasksCell = document.createElement("div");
      tasksCell.className = "schedule-row__tasks";
      tasksCell.dataset.hour = h;
      row.appendChild(hourCell);
      row.appendChild(tasksCell);
      scheduleContainer.appendChild(row);
    }
  }

  function getNowContext() {
    const now = new Date();
    const nowISO = Utils.todayISO();
    const time =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");
    const minutes = Utils.timeToMinutes(time);
    return { nowISO, time, minutes };
  }

  function getTaskTimeBounds(task) {
    const startMinutes = Utils.timeToMinutes(task.startTime || "00:00");
    const endMinutes = Utils.timeToMinutes(task.endTime || "00:00");
    if (startMinutes === null || endMinutes === null) return null;

    return {
      startMinutes,
      endMinutes:
        endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes,
      crossesMidnight: endMinutes <= startMinutes,
    };
  }

  function getNowMinutesFromTaskDate(task, nowCtx) {
    return (
      Utils.daysBetweenISO(task.date, nowCtx.nowISO) * 24 * 60 +
      nowCtx.minutes
    );
  }

  function getCompletionDeadlineMinutes(bounds) {
    return bounds.endMinutes + COMPLETION_GRACE_MINUTES;
  }

  function minutesToTimeInput(totalMinutes) {
    const minutesInDay = 24 * 60;
    const normalized =
      ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
  }

  function getDurationFromTimes(startTime, endTime) {
    const startMinutes = Utils.timeToMinutes(startTime);
    const endMinutes = Utils.timeToMinutes(endTime);
    if (startMinutes === null || endMinutes === null) return null;
    if (startMinutes === endMinutes) return null;
    return endMinutes > startMinutes
      ? endMinutes - startMinutes
      : endMinutes + 24 * 60 - startMinutes;
  }

  function setDefaultTaskTimes(startInput, endInput, durationInput) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = currentMinutes + 10;
    const endMinutes = startMinutes + 45;

    startInput.value = minutesToTimeInput(startMinutes);
    endInput.value = minutesToTimeInput(endMinutes);
    durationInput.value = String(45);
  }

  function syncDurationFromTimes(startInput, endInput, durationInput) {
    const duration = getDurationFromTimes(startInput.value, endInput.value);
    if (duration === null) {
      durationInput.value = "";
      return;
    }
    durationInput.value = String(duration);
  }

  function recomputeStates() {
    const nowCtx = getNowContext();
    let changed = false;
    tasks.forEach((task) => {
      if (!task || !task.state) return;
      if (task.state !== "pending") return;
      if (!task.endTime || !task.startTime || !task.date) return;
      const bounds = getTaskTimeBounds(task);
      if (!bounds) return;
      const nowMinutes = getNowMinutesFromTaskDate(task, nowCtx);

      if (nowMinutes < 0) return;

      if (nowMinutes > getCompletionDeadlineMinutes(bounds)) {
        task.state = "missed";
        task.locked = true;
        changed = true;
      }
    });
    if (changed) {
      Storage.saveTasks(tasks);
    }
  }

  function canEditTask(task) {
    if (!task || task.locked) return false;
    const nowCtx = getNowContext();
    if (!task.startTime) return false;
    const bounds = getTaskTimeBounds(task);
    if (!bounds) return false;
    return getNowMinutesFromTaskDate(task, nowCtx) < bounds.startMinutes;
  }

  function canCompleteTask(task) {
    if (!task) return false;
    if (task.state !== "pending") return false;
    if (task.locked) return false;

    const nowCtx = getNowContext();
    if (!task.startTime || !task.endTime) return false;
    const bounds = getTaskTimeBounds(task);
    if (!bounds) return false;
    const nowMinutes = getNowMinutesFromTaskDate(task, nowCtx);

    return (
      nowMinutes >= bounds.startMinutes &&
      nowMinutes <= getCompletionDeadlineMinutes(bounds)
    );
  }

  function completeTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!canCompleteTask(task)) {
      window.alert("Task can only be completed during its scheduled time.");
      return;
    }
    task.state = "completed";
    task.locked = true;
    Storage.saveTasks(tasks);
    animateTask(task.id);
    renderAll();
    showToast("Task completed");
  }

  function deleteTask(taskId) {
    tasks = tasks.filter((t) => t.id !== taskId);
    Storage.saveTasks(tasks);
    renderAll();
  }

  function openEditPrompt(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!canEditTask(task)) {
      window.alert("Task cannot be edited after start time or once locked.");
      return;
    }
    const title = window.prompt("Title", task.title || "");
    if (title === null) return;
    const durationStr = window.prompt(
      "Estimated duration (minutes)",
      String(task.estimatedMinutes || "")
    );
    if (durationStr === null) return;
    const duration = Number(durationStr);
    if (!Number.isFinite(duration) || duration <= 0) {
      window.alert("Invalid duration.");
      return;
    }
    task.title = title.trim();
    task.estimatedMinutes = duration;
    Storage.saveTasks(tasks);
    renderAll();
  }

  function handleFormSubmit() {
    const form = document.getElementById("task-form");
    const titleInput = document.getElementById("task-title");
    const categoryInput = document.getElementById("task-category");
    const priorityInput = document.getElementById("task-priority");
    const startInput = document.getElementById("task-start");
    const endInput = document.getElementById("task-end");
    const durationInput = document.getElementById("task-duration");
    const criticalInput = document.getElementById("task-critical");

    setDefaultTaskTimes(startInput, endInput, durationInput);

    startInput.addEventListener("input", () => {
      syncDurationFromTimes(startInput, endInput, durationInput);
    });

    endInput.addEventListener("input", () => {
      syncDurationFromTimes(startInput, endInput, durationInput);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const title = titleInput.value.trim();
      const category = categoryInput.value;
      const priority = priorityInput.value;
      const startTime = startInput.value;
      const endTime = endInput.value;
      const estimatedMinutes = Number(durationInput.value);
      const isCritical = criticalInput.checked;

      if (!title) {
        window.alert("Title is required.");
        return;
      }
      if (!startTime || !endTime) {
        window.alert("Start and end time are required.");
        return;
      }
      if (Utils.compareTimes(startTime, endTime) === 0) {
        window.alert("Start and end time cannot be the same.");
        return;
      }
      if (!Number.isFinite(estimatedMinutes) || estimatedMinutes <= 0) {
        window.alert("Estimated duration must be positive.");
        return;
      }

      const task = {
        id: generateId(),
        title,
        category,
        priority,
        startTime,
        endTime,
        estimatedMinutes,
        isCritical,
        date: currentDateISO,
        state: "pending",
        locked: false,
      };

      tasks.push(task);
      Storage.saveTasks(tasks);
      animateTask(task.id);
      form.reset();
      setDefaultTaskTimes(startInput, endInput, durationInput);
      renderAll();
      showToast("Task added");
    });
  }

  function renderSchedule() {
    const existingEmpty = scheduleContainer.querySelector(".schedule-empty");
    if (existingEmpty) {
      existingEmpty.remove();
    }

    const rows = scheduleContainer.querySelectorAll(".schedule-row__tasks");
    rows.forEach((cell) => {
      cell.innerHTML = "";
    });

    const dailyTasks = tasks.filter((t) => t.date === currentDateISO);
    const nowCtx = getNowContext();
    const isToday = Utils.isSameISODate(currentDateISO, nowCtx.nowISO);
    const currentHour = isToday ? new Date().getHours() : -1;

    const scheduleRows = scheduleContainer.querySelectorAll(".schedule-row");
    scheduleRows.forEach((row, idx) => {
      row.classList.remove("schedule-row--current");
      row.style.display = "";
      if (isToday && idx === currentHour) {
        row.classList.add("schedule-row--current");
      }
    });
    
    if (dailyTasks.length === 0) {
      scheduleRows.forEach((row) => {
        row.style.display = "none";
      });
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "schedule-empty";
      emptyMsg.textContent = "No tasks scheduled for this date";
      scheduleContainer.appendChild(emptyMsg);
    } else {
      dailyTasks.forEach((task) => {
        const startMinutes = Utils.timeToMinutes(task.startTime || "00:00");
        if (startMinutes === null) return;
        const hour = Math.floor(startMinutes / 60);
        const cell = scheduleContainer.querySelector(
          '.schedule-row__tasks[data-hour="' + hour + '"]'
        );
        if (!cell) return;
        const pill = document.createElement("div");
        pill.className = "task-pill";
        if (task.state === "completed") {
          pill.classList.add("task-pill--completed");
        } else if (task.state === "missed") {
          pill.classList.add("task-pill--missed");
        } else {
          pill.classList.add("task-pill--pending");
        }
        if (task.id === animatedTaskId) {
          pill.classList.add("task-pill--pulse");
        }
        pill.textContent = task.title;
        cell.appendChild(pill);
      });
    }

    const helperEl = document.getElementById("schedule-helper");
    if (helperEl) {
      if (Utils.isSameISODate(currentDateISO, nowCtx.nowISO)) {
        helperEl.textContent = "Today's schedule • Current hour highlighted";
      } else if (currentDateISO < nowCtx.nowISO) {
        helperEl.textContent = "Past date • Tasks locked";
      } else {
        helperEl.textContent = "Future date • Tasks pending";
      }
    }
  }

  function renderTasksTable() {
    const tbody = document.getElementById("tasks-table-body");
    const filterSelect = document.getElementById("tasks-filter-date");
    const mode = filterSelect.value;
    tbody.innerHTML = "";

    const subset =
      mode === "today"
        ? tasks.filter((t) => t.date === currentDateISO)
        : tasks.slice();

    subset
      .slice()
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return Utils.compareTimes(a.startTime || "00:00", b.startTime || "00:00");
      })
      .forEach((task) => {
        const tr = document.createElement("tr");
        if (task.state === "missed") tr.classList.add("tasks-row--missed");
        if (task.state === "completed") tr.classList.add("tasks-row--completed");
        if (task.id === animatedTaskId) tr.classList.add("tasks-row--pulse");

        const bounds = getTaskTimeBounds(task);
        const timeRange =
          (task.startTime || "") +
          " - " +
          (task.endTime || "") +
          (bounds && bounds.crossesMidnight ? " (+1 day)" : "");

        tr.innerHTML = [
          "<td>" + (task.title || "") + "</td>",
          "<td>" + (task.category || "") + "</td>",
          "<td>" + (task.priority || "") + "</td>",
          "<td>" + (task.date || "") + "</td>",
          "<td>" + timeRange + "</td>",
          "<td>" + (task.state || "") + "</td>",
          "<td>" + (task.isCritical ? "Yes" : "No") + "</td>",
          '<td><div class="tasks-actions">' +
            '<button data-action="complete" data-id="' +
            task.id +
            '">Done</button>' +
            '<button data-action="edit" data-id="' +
            task.id +
            '">Edit</button>' +
            '<button data-action="delete" data-id="' +
            task.id +
            '">Delete</button>' +
            "</div></td>",
        ].join("");

        const completeBtn = tr.querySelector('button[data-action="complete"]');
        const editBtn = tr.querySelector('button[data-action="edit"]');

        if (!canCompleteTask(task)) {
          completeBtn.disabled = true;
        }
        if (!canEditTask(task)) {
          editBtn.disabled = true;
        }

        tbody.appendChild(tr);
      });

    tbody.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.action;
      const id = target.dataset.id;
      if (!action || !id) return;
      if (action === "complete") {
        completeTask(id);
      } else if (action === "edit") {
        openEditPrompt(id);
      } else if (action === "delete") {
        deleteTask(id);
      }
    });

    if (!tbody._boundClickHandler) {
      tbody._boundClickHandler = true;
      tbody.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;
        const id = target.dataset.id;
        if (!action || !id) return;
        if (action === "complete") {
          completeTask(id);
        } else if (action === "edit") {
          openEditPrompt(id);
        } else if (action === "delete") {
          deleteTask(id);
        }
      });

      filterSelect.addEventListener("change", () => {
        renderTasksTable();
      });
    }
  }

  function recomputeStreak() {
    const streak = Storage.loadStreak();
    const today = Utils.todayISO();

    // build a set of dates with at least one resolved (completed or missed) task
    const dates = new Set();
    tasks.forEach((t) => {
      if (!t || !t.date) return;
      if (t.state === "completed" || t.state === "missed") {
        dates.add(t.date);
      }
    });

    let currentStreak = 0;
    for (let offset = 0; ; offset += 1) {
      const day = Utils.shiftISODate(today, -offset);
      if (!dates.has(day)) break;
      currentStreak += 1;
    }

    const longestStreak = Math.max(streak.longestStreak || 0, currentStreak);
    const next = {
      currentStreak,
      longestStreak,
      lastDate: today,
    };
    Storage.saveStreak(next);
    return next;
  }

  function renderSummary() {
    const today = currentDateISO;
    const todayTasks = tasks.filter((t) => t.date === today);
    const completedToday = todayTasks.filter(
      (t) => t.state === "completed"
    ).length;
    const missedToday = todayTasks.filter((t) => t.state === "missed").length;

    const streak = recomputeStreak();

    const currentEl = document.getElementById("streak-current");
    const longestEl = document.getElementById("streak-longest");
    const completedEl = document.getElementById("completed-today");
    const missedEl = document.getElementById("missed-today");

    if (currentEl) currentEl.textContent = String(streak.currentStreak);
    if (longestEl) longestEl.textContent = String(streak.longestStreak);
    if (completedEl) completedEl.textContent = String(completedToday);
    if (missedEl) missedEl.textContent = String(missedToday);

    // 7-day report
    const end = Utils.parseISODate(today);
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startISO = Utils.toISODateString(start);

    let total7 = 0;
    let completed7 = 0;
    let missed7 = 0;

    tasks.forEach((t) => {
      if (!t || !t.date) return;
      if (Utils.daysBetweenISO(startISO, t.date) < 0) return;
      if (Utils.daysBetweenISO(t.date, today) < 0) return;
      total7 += 1;
      if (t.state === "completed") completed7 += 1;
      if (t.state === "missed") missed7 += 1;
    });

    const tasks7El = document.getElementById("report-tasks-7d");
    const completed7El = document.getElementById("report-completed-7d");
    const missed7El = document.getElementById("report-missed-7d");
    const rateEl = document.getElementById("report-completion-rate");

    const relevant = completed7 + missed7;
    const rate = relevant === 0 ? 0 : Math.round((completed7 / relevant) * 100);

    if (tasks7El) tasks7El.textContent = String(total7);
    if (completed7El) completed7El.textContent = String(completed7);
    if (missed7El) missed7El.textContent = String(missed7);
    if (rateEl) rateEl.textContent = rate + "%";
  }

  function renderYearlyReport() {
    const currentYear = Utils.getYearFromISO(Utils.todayISO());
    const yearStart = new Date(Date.UTC(currentYear, 0, 1));
    const yearEnd = new Date(Date.UTC(currentYear, 11, 31));
    const startISO = Utils.toISODateString(yearStart);
    const endISO = Utils.toISODateString(yearEnd);

    let totalPlanned = 0;
    let totalCompleted = 0;
    let missedCritical = 0;
    const monthlyStats = Array(12).fill(0).map(() => ({ completed: 0, relevant: 0 }));

    tasks.forEach((t) => {
      if (!t || !t.date) return;
      if (t.date < startISO || t.date > endISO) return;
      
      totalPlanned += 1;
      if (t.state === "completed") totalCompleted += 1;
      if (t.state === "missed" && t.isCritical) missedCritical += 1;

      const monthIdx = Utils.getMonthFromISO(t.date);
      if (monthIdx >= 0 && monthIdx < 12) {
        if (t.state === "completed" || t.state === "missed") {
          monthlyStats[monthIdx].relevant += 1;
          if (t.state === "completed") {
            monthlyStats[monthIdx].completed += 1;
          }
        }
      }
    });

    let strongestMonth = -1;
    let strongestValue = -1;
    let weakestMonth = -1;
    let weakestValue = 101;

    monthlyStats.forEach((stat, idx) => {
      if (stat.relevant === 0) return;
      const percent = Math.round((stat.completed / stat.relevant) * 100);
      if (percent > strongestValue) {
        strongestValue = percent;
        strongestMonth = idx;
      }
      if (percent < weakestValue) {
        weakestValue = percent;
        weakestMonth = idx;
      }
    });

    const avgCompletion = totalPlanned === 0 ? 0 : Math.round((totalCompleted / totalPlanned) * 100);

    const totalPlannedEl = document.getElementById("yearly-total-planned");
    const totalCompletedEl = document.getElementById("yearly-total-completed");
    const missedCriticalEl = document.getElementById("yearly-missed-critical");
    const strongestEl = document.getElementById("yearly-strongest");
    const weakestEl = document.getElementById("yearly-weakest");
    const avgCompletionEl = document.getElementById("yearly-avg-completion");

    if (totalPlannedEl) totalPlannedEl.textContent = String(totalPlanned);
    if (totalCompletedEl) totalCompletedEl.textContent = String(totalCompleted);
    if (missedCriticalEl) missedCriticalEl.textContent = String(missedCritical);
    if (strongestEl) {
      strongestEl.textContent = strongestMonth >= 0
        ? Utils.getMonthName(strongestMonth) + " (" + strongestValue + "%)"
        : "—";
    }
    if (weakestEl) {
      weakestEl.textContent = weakestMonth >= 0
        ? Utils.getMonthName(weakestMonth) + " (" + weakestValue + "%)"
        : "—";
    }
    if (avgCompletionEl) avgCompletionEl.textContent = avgCompletion + "%";

    ChartsModule.updateYearlyCharts(tasks);
  }

  function renderAll() {
    recomputeStates();
    renderSchedule();
    renderTasksTable();
    renderSummary();
    ChartsModule.updateCharts(tasks, currentDateISO);
    
    const activeView = document.querySelector(".view--active");
    if (activeView && activeView.dataset.viewId === "yearly-report") {
      renderYearlyReport();
    }
  }

  function startMissWatcher() {
    // update states once per minute
    setInterval(() => {
      const prev = JSON.stringify(tasks);
      recomputeStates();
      if (JSON.stringify(tasks) !== prev) {
        renderAll();
      }
    }, 60 * 1000);
  }

  function init() {
    initUserControls();
    tasks = Storage.loadTasks();
    initDateControls();
    initTabs();
    initAnalyticsControls();
    initSchedule();
    handleFormSubmit();
    ChartsModule.initCharts();
    ChartsModule.initYearlyCharts();
    renderAll();
    Storage.loadTasksFromFirebase().then((firebaseTasks) => {
      if (Array.isArray(firebaseTasks)) {
        tasks = firebaseTasks;
        renderAll();
      }
    });
    startMissWatcher();
  }

  return {
    init,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
