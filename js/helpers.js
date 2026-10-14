(function () {
  var MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  var MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  var WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  var WEEKDAYS_LONG = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];
  var WEEKDAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  var PALETTE = [
    { name: "Tijolo", value: "#c6532a" },
    { name: "Verde", value: "#1d6b62" },
    { name: "Azul", value: "#2c4a6e" },
    { name: "Dourado", value: "#8a5a12" },
    { name: "Ameixa", value: "#6d3b6a" },
    { name: "Floresta", value: "#2f6b45" },
    { name: "Ardósia", value: "#3d4f5f" },
    { name: "Vinho", value: "#7c2f39" },
  ];

  var COURSE_ICONS = ["book", "code", "sigma", "database", "share", "compass", "flask", "pen"];

  var TYPES = [
    { id: "trabalho", label: "Trabalho" },
    { id: "teste", label: "Teste" },
    { id: "frequencia", label: "Frequência" },
    { id: "entrega", label: "Entrega" },
  ];

  var TERMS = [
    { id: "trabalho", label: "Trabalho", group: "tipos" },
    { id: "teste", label: "Teste", group: "tipos" },
    { id: "frequencia", label: "Frequência", group: "tipos" },
    { id: "entrega", label: "Entrega", group: "tipos" },
    { id: "cadeira", label: "Cadeira", group: "nomes" },
    { id: "cadeiras", label: "Cadeiras", group: "nomes" },
    { id: "tarefa", label: "Tarefa", group: "nomes" },
    { id: "tarefas", label: "Tarefas", group: "nomes" },
    { id: "projeto", label: "Projeto", group: "nomes" },
    { id: "projetos", label: "Projetos", group: "nomes" },
    { id: "evento", label: "Evento", group: "nomes" },
    { id: "eventos", label: "Eventos", group: "nomes" },
    { id: "arquivo", label: "Arquivo", group: "nomes" },
  ];

  var PRIORITIES = [
    { id: "baixa", label: "Baixa" },
    { id: "media", label: "Média" },
    { id: "alta", label: "Alta" },
  ];

  var CLASS_TYPES = [
    { id: "TP", short: "TP", label: "Teórica ou prática" },
    { id: "PL", short: "PL", label: "Prática laboratorial" },
    { id: "AMBAS", short: "Ambas", label: "Teórica e laboratorial" },
  ];

  var ITEM_KINDS = [
    { id: "tarefa", label: "Tarefa" },
    { id: "nota", label: "Nota" },
    { id: "checklist", label: "Checklist" },
    { id: "decisao", label: "Decisão" },
    { id: "link", label: "Link" },
    { id: "evento", label: "Evento" },
    { id: "reuniao", label: "Reunião" },
    { id: "notas", label: "Notas" },
    { id: "documento", label: "Documento" },
  ];

  var REMINDER_OPTIONS = [
    { days: 0, label: "No próprio dia" },
    { days: 1, label: "1 dia antes" },
    { days: 3, label: "3 dias antes" },
    { days: 7, label: "1 semana antes" },
  ];

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function toISODate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function parseISODate(iso) {
    var parts = String(iso || "").split("-").map(Number);
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1, 12, 0, 0, 0);
  }

  function todayISO() {
    return toISODate(new Date());
  }

  function addDays(date, days) {
    var next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    next.setDate(next.getDate() + days);
    return next;
  }

  function shiftDays(iso, days) {
    return toISODate(addDays(parseISODate(iso), days));
  }

  function daysBetween(fromISO, toISO) {
    var a = parseISODate(fromISO);
    var b = parseISODate(toISO);
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function isoWeekday(date) {
    var day = date.getDay();
    return day === 0 ? 7 : day;
  }

  function startOfWeek(date) {
    var base = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    return addDays(base, -(isoWeekday(base) - 1));
  }

  function dueMoment(task) {
    var date = parseISODate(task.dueDate);
    if (task.dueTime) {
      var parts = task.dueTime.split(":").map(Number);
      date.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
    } else {
      date.setHours(23, 59, 0, 0);
    }
    return date;
  }

  function isOverdue(task, now) {
    if (!task || task.done) return false;
    return (now || new Date()) > dueMoment(task);
  }

  function daysUntil(task) {
    return daysBetween(todayISO(), task.dueDate);
  }

  function formatLong(iso) {
    var date = parseISODate(iso);
    var weekday = WEEKDAYS_LONG[isoWeekday(date) - 1];
    return weekday + ", " + date.getDate() + " de " + MONTHS[date.getMonth()];
  }

  function formatShort(iso) {
    if (!iso) return "";
    var date = parseISODate(iso);
    return date.getDate() + " " + MONTHS_SHORT[date.getMonth()];
  }

  function formatFull(iso) {
    var date = parseISODate(iso);
    return date.getDate() + " de " + MONTHS[date.getMonth()] + " de " + date.getFullYear();
  }

  function monthTitle(date) {
    var name = MONTHS[date.getMonth()];
    return name.charAt(0).toUpperCase() + name.slice(1) + " " + date.getFullYear();
  }

  function weekTitle(start) {
    var end = addDays(start, 6);
    if (start.getMonth() === end.getMonth()) {
      return start.getDate() + "–" + end.getDate() + " " + MONTHS_SHORT[start.getMonth()] + " " + start.getFullYear();
    }
    return (
      start.getDate() + " " + MONTHS_SHORT[start.getMonth()] +
      " – " + end.getDate() + " " + MONTHS_SHORT[end.getMonth()] + " " + end.getFullYear()
    );
  }

  function taskOccursOn(task, iso) {
    if (!task || !iso) return false;
    if (task.when === "periodo") return iso >= (task.startDate || task.dueDate) && iso <= task.dueDate;
    if (task.when === "especificos") return (task.dates || []).indexOf(iso) >= 0;
    return task.dueDate === iso;
  }

  function whenText(task) {
    if (!task) return "";
    if (task.when === "periodo") return formatShort(task.startDate || task.dueDate) + " – " + formatShort(task.dueDate);
    if (task.when === "especificos" && task.dates && task.dates.length) {
      if (task.dates.length <= 3) return task.dates.map(formatShort).join(", ");
      return task.dates.slice(0, 2).map(formatShort).join(", ") + " +" + (task.dates.length - 2);
    }
    return formatShort(task.dueDate);
  }

  function reminderHits(task) {
    if (!task || task.done) return false;
    var today = todayISO();
    var marks = task.when === "especificos" && task.dates && task.dates.length ? task.dates : [task.dueDate];
    var reminders = task.reminders || [];
    return marks.some(function (iso) { return reminders.indexOf(daysBetween(today, iso)) >= 0; });
  }

  function relativeDue(task) {
    var time = task.dueTime ? " · " + task.dueTime : "";
    if (task.done) return "Concluída · " + formatShort(task.doneAt || task.dueDate);
    if (isOverdue(task)) return "Atrasada · " + whenText(task);
    if (task.when === "periodo") {
      var today = todayISO();
      var start = task.startDate || task.dueDate;
      if (start > today) return "Começa " + formatShort(start) + time;
      var left = daysUntil(task);
      if (left === 0) return "Termina hoje" + time;
      if (left === 1) return whenText(task) + " · acaba amanhã" + time;
      return whenText(task) + " · acaba em " + left + " dias" + time;
    }
    if (task.when === "especificos") {
      var upcoming = (task.dates || []).filter(function (iso) { return iso >= todayISO(); })[0];
      if (upcoming === todayISO()) return "Hoje · " + whenText(task) + time;
      return whenText(task) + time;
    }
    var days = daysUntil(task);
    if (days === 0) return "Hoje" + time;
    if (days === 1) return "Amanhã" + time;
    if (days > 1 && days < 14) return "Em " + days + " dias" + time;
    return formatShort(task.dueDate) + time;
  }

  function formatMinutes(min) {
    min = Math.round(min || 0);
    var h = Math.floor(min / 60);
    var m = min % 60;
    if (h && m) return h + " h " + m + " min";
    if (h) return h + " h";
    return m + " min";
  }

  function formatHours(min) {
    var hours = (min || 0) / 60;
    return hours.toLocaleString("pt-PT", { maximumFractionDigits: hours >= 10 ? 0 : 1 });
  }

  function formatGrade(value) {
    if (value == null || Number.isNaN(value)) return "—";
    return value.toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function formatPct(value) {
    if (value == null || Number.isNaN(value)) return "—";
    return Math.round(value) + "%";
  }

  function countLabel(n, singular, plural) {
    return n + " " + (n === 1 ? singular : plural);
  }

  function safeColor(color) {
    return /^#[0-9a-fA-F]{6}$/.test(color || "") ? color : PALETTE[0].value;
  }

  function safeIcon(icon) {
    return COURSE_ICONS.indexOf(icon) >= 0 ? icon : "book";
  }

  function courseShort(course) {
    if (!course) return "—";
    if (course.code) return course.code;
    return course.name
      .split(/\s+/)
      .filter(function (word) { return word.length > 2; })
      .slice(0, 2)
      .map(function (word) { return word[0]; })
      .join("")
      .toUpperCase() || course.name.slice(0, 3).toUpperCase();
  }

  function classTypeId(id) {
    if (id === "PL" || id === "AMBAS" || id === "TP") return id;
    return "TP";
  }

  function classType(id) {
    var found = CLASS_TYPES.filter(function (item) { return item.id === classTypeId(id); })[0];
    return found || CLASS_TYPES[0];
  }

  function term(id) {
    var custom = "";
    if (window.Store && Store.state && Store.state.settings && Store.state.settings.labels) {
      custom = Store.state.settings.labels[id];
    }
    custom = String(custom || "").trim();
    if (custom) return custom.slice(0, 40);
    var found = TERMS.filter(function (item) { return item.id === id; })[0];
    return found ? found.label : id;
  }

  function typeLabel(id) {
    var named = TERMS.filter(function (item) { return item.id === id && item.group === "tipos"; })[0];
    if (named) return term(id);
    var found = TYPES.filter(function (item) { return item.id === id; })[0];
    return found ? found.label : term("tarefa");
  }

  function priorityLabel(id) {
    var found = PRIORITIES.filter(function (item) { return item.id === id; })[0];
    return found ? found.label : "Média";
  }

  function readNumber(value) {
    var n = Number(String(value == null ? "" : value).replace(",", ".").trim());
    return n;
  }

  function greeting() {
    var hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 19) return "Boa tarde";
    return "Boa noite";
  }

  function academicYear(date) {
    var year = date.getFullYear();
    var start = date.getMonth() >= 8 ? year : year - 1;
    return start + "/" + String(start + 1).slice(-2);
  }

  function semesterName(date) {
    var month = date.getMonth();
    var term = month >= 8 || month === 0 ? "1.º semestre" : "2.º semestre";
    return term + " " + academicYear(date);
  }

  function parseHour(time) {
    var parts = String(time || "0:0").split(":").map(Number);
    return (parts[0] || 0) + (parts[1] || 0) / 60;
  }

  function dayName(index) {
    return WEEKDAYS[index - 1] || "";
  }

  function dayShort(index) {
    return WEEKDAYS_SHORT[index - 1] || "";
  }

  window.H = {
    MONTHS: MONTHS,
    MONTHS_SHORT: MONTHS_SHORT,
    WEEKDAYS: WEEKDAYS,
    WEEKDAYS_LONG: WEEKDAYS_LONG,
    WEEKDAYS_SHORT: WEEKDAYS_SHORT,
    PALETTE: PALETTE,
    COURSE_ICONS: COURSE_ICONS,
    TYPES: TYPES,
    ITEM_KINDS: ITEM_KINDS,
    TERMS: TERMS,
    term: term,
    CLASS_TYPES: CLASS_TYPES,
    classType: classType,
    classTypeId: classTypeId,
    PRIORITIES: PRIORITIES,
    REMINDER_OPTIONS: REMINDER_OPTIONS,
    esc: esc,
    uid: uid,
    toISODate: toISODate,
    parseISODate: parseISODate,
    todayISO: todayISO,
    addDays: addDays,
    shiftDays: shiftDays,
    daysBetween: daysBetween,
    isoWeekday: isoWeekday,
    startOfWeek: startOfWeek,
    isOverdue: isOverdue,
    daysUntil: daysUntil,
    formatLong: formatLong,
    formatShort: formatShort,
    formatFull: formatFull,
    monthTitle: monthTitle,
    weekTitle: weekTitle,
    relativeDue: relativeDue,
    taskOccursOn: taskOccursOn,
    whenText: whenText,
    reminderHits: reminderHits,
    formatMinutes: formatMinutes,
    formatHours: formatHours,
    formatGrade: formatGrade,
    formatPct: formatPct,
    countLabel: countLabel,
    safeColor: safeColor,
    safeIcon: safeIcon,
    courseShort: courseShort,
    typeLabel: typeLabel,
    priorityLabel: priorityLabel,
    readNumber: readNumber,
    greeting: greeting,
    semesterName: semesterName,
    parseHour: parseHour,
    dayName: dayName,
    dayShort: dayShort,
  };
})();
