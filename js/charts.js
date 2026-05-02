// Chart initialization and updates

const ChartsModule = (function () {
  let categoryChart = null;
  let weeklyChart = null;
  let monthlyChart = null;
  let yearlyCategoryChart = null;

  function buildTimeByCategory(tasks, todayISO) {
    const end = Utils.parseISODate(todayISO);
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startISO = Utils.toISODateString(start);

    const totals = {
      Study: 0,
      Health: 0,
      Coding: 0,
      Personal: 0,
    };

    tasks.forEach((t) => {
      if (!t || !t.date || !t.category) return;
      if (Utils.daysBetweenISO(startISO, t.date) < 0) return;
      if (Utils.daysBetweenISO(t.date, todayISO) < 0) return;
      const duration = Number(t.estimatedMinutes) || 0;
      if (totals[t.category] !== undefined) {
        totals[t.category] += duration;
      }
    });

    return {
      labels: Object.keys(totals),
      values: Object.values(totals),
    };
  }

  function buildWeeklyConsistency(tasks, todayISO) {
    const labels = [];
    const values = [];

    for (let i = 6; i >= 0; i -= 1) {
      const dayISO = Utils.shiftISODate(todayISO, -i);
      labels.push(dayISO.slice(5)); // MM-DD
      const forDay = tasks.filter((t) => t.date === dayISO);
      const completed = forDay.filter((t) => t.state === "completed").length;
      const relevant = forDay.filter(
        (t) => t.state === "completed" || t.state === "missed"
      ).length;
      const percent =
        relevant === 0 ? 0 : Math.round((completed / relevant) * 100);
      values.push(percent);
    }

    return { labels, values };
  }

  function initCharts() {
    const categoryCtx = document
      .getElementById("chart-category-time")
      .getContext("2d");
    const weeklyCtx = document
      .getElementById("chart-weekly-consistency")
      .getContext("2d");

    categoryChart = new Chart(categoryCtx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Minutes",
            data: [],
            backgroundColor: "#3b82f6",
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: "#1f2937",
            titleColor: "#e5e7eb",
            bodyColor: "#d1d5db",
            borderColor: "#374151",
            borderWidth: 1,
            padding: 6,
            titleFont: { size: 10 },
            bodyFont: { size: 10 },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#6b7280",
              font: { size: 9 },
            },
            grid: {
              display: false,
            },
          },
          y: {
            ticks: {
              color: "#6b7280",
              font: { size: 9 },
            },
            grid: {
              color: "#1a1d26",
              drawBorder: false,
            },
          },
        },
      },
    });

    weeklyChart = new Chart(weeklyCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Completion %",
            data: [],
            borderColor: "#22c55e",
            borderWidth: 1,
            pointRadius: 2,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: "#1f2937",
            titleColor: "#e5e7eb",
            bodyColor: "#d1d5db",
            borderColor: "#374151",
            borderWidth: 1,
            padding: 6,
            titleFont: { size: 10 },
            bodyFont: { size: 10 },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#9ca3af",
              font: { size: 10 },
            },
            grid: { display: false },
          },
          y: {
            min: 0,
            max: 100,
            ticks: {
              color: "#6b7280",
              font: { size: 9 },
              callback: (v) => v + "%",
            },
            grid: { color: "#1a1d26", drawBorder: false },
          },
        },
      },
    });
  }

  function buildMonthlyConsistency(tasks, currentYear) {
    const months = [];
    const values = [];

    for (let m = 0; m < 12; m += 1) {
      const monthStart = new Date(Date.UTC(currentYear, m, 1));
      const monthEnd = new Date(Date.UTC(currentYear, m + 1, 0));
      const startISO = Utils.toISODateString(monthStart);
      const endISO = Utils.toISODateString(monthEnd);

      let completed = 0;
      let relevant = 0;

      tasks.forEach((t) => {
        if (!t || !t.date) return;
        if (t.date < startISO || t.date > endISO) return;
        if (t.state === "completed" || t.state === "missed") {
          relevant += 1;
          if (t.state === "completed") completed += 1;
        }
      });

      months.push(Utils.getMonthName(m));
      const percent = relevant === 0 ? 0 : Math.round((completed / relevant) * 100);
      values.push(percent);
    }

    return { labels: months, values };
  }

  function buildYearlyCategoryDistribution(tasks, currentYear) {
    const totals = {
      Study: 0,
      Health: 0,
      Coding: 0,
      Personal: 0,
    };

    const yearStart = new Date(Date.UTC(currentYear, 0, 1));
    const yearEnd = new Date(Date.UTC(currentYear, 11, 31));
    const startISO = Utils.toISODateString(yearStart);
    const endISO = Utils.toISODateString(yearEnd);

    tasks.forEach((t) => {
      if (!t || !t.date || !t.category) return;
      if (t.date < startISO || t.date > endISO) return;
      const duration = Number(t.estimatedMinutes) || 0;
      if (totals[t.category] !== undefined) {
        totals[t.category] += duration;
      }
    });

    return {
      labels: Object.keys(totals),
      values: Object.values(totals),
    };
  }

  function initYearlyCharts() {
    const monthlyCtx = document
      .getElementById("chart-monthly-consistency")
      ?.getContext("2d");
    const yearlyCatCtx = document
      .getElementById("chart-yearly-category")
      ?.getContext("2d");

    if (monthlyCtx) {
      monthlyChart = new Chart(monthlyCtx, {
        type: "bar",
        data: {
          labels: [],
          datasets: [
            {
              label: "Completion %",
              data: [],
              backgroundColor: "#4b7bec",
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              backgroundColor: "#1f2937",
              titleColor: "#e5e7eb",
              bodyColor: "#d1d5db",
              borderColor: "#374151",
              borderWidth: 1,
              padding: 6,
              titleFont: { size: 10 },
              bodyFont: { size: 10 },
              callbacks: {
                label: (ctx) => ctx.parsed.y + "%",
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#6b7280",
                font: { size: 9 },
              },
              grid: { display: false },
            },
            y: {
              min: 0,
              max: 100,
              ticks: {
                color: "#6b7280",
                font: { size: 9 },
                callback: (v) => v + "%",
              },
              grid: { color: "#1a1d26", drawBorder: false },
            },
          },
        },
      });
    }

    if (yearlyCatCtx) {
      yearlyCategoryChart = new Chart(yearlyCatCtx, {
        type: "doughnut",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
              backgroundColor: [
                "#3b82f6",
                "#22c55e",
                "#f59e0b",
                "#8b5cf6",
              ],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                color: "#9ca3af",
                font: { size: 9 },
                padding: 8,
                usePointStyle: true,
                pointStyle: "circle",
              },
            },
            tooltip: {
              enabled: true,
              backgroundColor: "#1f2937",
              titleColor: "#e5e7eb",
              bodyColor: "#d1d5db",
              borderColor: "#374151",
              borderWidth: 1,
              padding: 6,
              titleFont: { size: 10 },
              bodyFont: { size: 10 },
              callbacks: {
                label: (ctx) => {
                  const label = ctx.label || "";
                  const value = ctx.parsed || 0;
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const percent = total === 0 ? 0 : Math.round((value / total) * 100);
                  return label + ": " + value + " min (" + percent + "%)";
                },
              },
            },
          },
        },
      });
    }
  }

  function updateCharts(tasks, todayISO) {
    if (!categoryChart || !weeklyChart) return;

    const categoryData = buildTimeByCategory(tasks, todayISO);
    categoryChart.data.labels = categoryData.labels;
    categoryChart.data.datasets[0].data = categoryData.values;
    categoryChart.update("none");

    const weeklyData = buildWeeklyConsistency(tasks, todayISO);
    weeklyChart.data.labels = weeklyData.labels;
    weeklyChart.data.datasets[0].data = weeklyData.values;
    weeklyChart.update("none");
  }

  function updateYearlyCharts(tasks) {
    const currentYear = Utils.getYearFromISO(Utils.todayISO());

    if (monthlyChart) {
      const monthlyData = buildMonthlyConsistency(tasks, currentYear);
      monthlyChart.data.labels = monthlyData.labels;
      monthlyChart.data.datasets[0].data = monthlyData.values;
      monthlyChart.update("none");
    }

    if (yearlyCategoryChart) {
      const categoryData = buildYearlyCategoryDistribution(tasks, currentYear);
      yearlyCategoryChart.data.labels = categoryData.labels;
      yearlyCategoryChart.data.datasets[0].data = categoryData.values;
      yearlyCategoryChart.update("none");
    }
  }

  return {
    initCharts,
    updateCharts,
    initYearlyCharts,
    updateYearlyCharts,
  };
})();


