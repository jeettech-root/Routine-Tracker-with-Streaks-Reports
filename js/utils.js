// Utility functions for dates and time calculations

const Utils = (function () {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function toISODateString(date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    return d.toISOString().slice(0, 10);
  }

  function todayISO() {
    return toISODateString(new Date());
  }

  function shiftISODate(isoDate, deltaDays) {
    const [y, m, d] = isoDate.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + deltaDays));
    return toISODateString(date);
  }

  function parseISODate(isoDate) {
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function formatHourLabel(hour) {
    const h = hour.toString().padStart(2, "0");
    return h + ":00";
  }

  function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  function compareTimes(a, b) {
    const ma = timeToMinutes(a);
    const mb = timeToMinutes(b);
    if (ma === null || mb === null) return 0;
    if (ma < mb) return -1;
    if (ma > mb) return 1;
    return 0;
  }

  function isSameISODate(a, b) {
    return a === b;
  }

  function daysBetweenISO(a, b) {
    const da = parseISODate(a);
    const db = parseISODate(b);
    return Math.round((db - da) / MS_PER_DAY);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toISODateString(date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    return d.toISOString().slice(0, 10);
  }

  function getMonthName(monthIndex) {
    const names = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return names[monthIndex] || "";
  }

  function getYearFromISO(isoDate) {
    return parseInt(isoDate.split("-")[0], 10);
  }

  function getMonthFromISO(isoDate) {
    return parseInt(isoDate.split("-")[1], 10) - 1;
  }

  return {
    todayISO,
    shiftISODate,
    parseISODate,
    formatHourLabel,
    timeToMinutes,
    compareTimes,
    isSameISODate,
    daysBetweenISO,
    clamp,
    toISODateString,
    getMonthName,
    getYearFromISO,
    getMonthFromISO,
  };
})();


