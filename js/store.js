(function () {
  var KEY = "tribalance.v1";
  var FIRED_KEY = "tribalance.fired";
  var state = blank();

  function blank() {
    var today = new Date();
    var start = H.addDays(H.startOfWeek(today), -42);
    var end = H.addDays(start, 16 * 7 - 1);
    return {
      courses: [],
      tasks: [],
      grades: [],
      sessions: [],
      settings: {
        semesterName: H.semesterName(today),
        semesterStart: H.toISODate(start),
        semesterEnd: H.toISODate(end),
        notificationsEnabled: false,
        defaultReminders: [0, 1, 7],
        demo: false,
        hideDemoNote: false,
      },
    };
  }

  function seed() {
    var today = H.todayISO();
    var data = blank();
    data.settings.demo = true;
    data.courses = [
      course("c1", "Programação Orientada a Objetos", "POO", "Ana Ribeiro", "B2.14", "#2c4a6e", "code", 6, [
        slot(1, "10:00", "12:00"), slot(3, "14:00", "16:00"),
      ]),
      course("c2", "Matemática Discreta", "MD", "Carlos Mendes", "A1.03", "#8a5a12", "sigma", 6, [
        slot(2, "09:00", "11:00"), slot(4, "09:00", "11:00"),
      ]),
      course("c3", "Bases de Dados", "BD", "Inês Carvalho", "Lab 3", "#1d6b62", "database", 6, [
        slot(2, "14:00", "16:00"), slot(5, "10:00", "12:00"),
      ]),
      course("c4", "Redes de Computadores", "RC", "João Silva", "C0.21", "#6d3b6a", "share", 6, [
        slot(3, "09:00", "11:00"), slot(5, "14:00", "16:00"),
      ]),
      course("c5", "Interface Pessoa-Máquina", "IPM", "Marta Lopes", "D1.10", "#c6532a", "compass", 6, [
        slot(4, "14:00", "17:00"),
      ]),
    ];

    data.tasks = [
      task("t1", "Entrega do protótipo", "c5", "entrega", 0, "18:00", "alta", false, [0, 1, 7], "Ecrãs principais e fluxo de navegação."),
      task("t2", "Teste prático de POO", "c1", "teste", 1, "10:00", "alta", false, [0, 1, 7], "Herança, coleções e excepções."),
      task("t3", "Relatório do projeto", "c3", "trabalho", 3, "23:59", "alta", false, [1, 3, 7], "Modelo relacional e consultas."),
      task("t4", "Frequência de Matemática", "c2", "frequencia", 6, "09:00", "alta", false, [1, 7], "Grafos e relações."),
      task("t5", "Exercícios de redes", "c4", "trabalho", -2, "23:59", "media", false, [1, 7], "Camada de transporte."),
      task("t6", "Ficha de matemática", "c2", "trabalho", -5, "18:00", "baixa", false, [1], ""),
      task("t7", "Leitura do capítulo 4", "c5", "trabalho", 10, "", "baixa", false, [1, 7], "Heurísticas de usabilidade."),
      task("t8", "Trabalho de grupo", "c4", "trabalho", 13, "23:59", "media", false, [7], "Relatório e apresentação."),
      task("t9", "Projeto intermédio", "c1", "trabalho", 20, "23:59", "media", false, [7], ""),
      task("t10", "Mini-teste de bases de dados", "c3", "teste", -8, "14:00", "media", true, [1], ""),
      task("t11", "Exercício POO 2", "c1", "trabalho", -3, "", "baixa", true, [1], ""),
      task("t12", "Frequência de IPM", "c5", "frequencia", -12, "14:00", "alta", true, [1, 7], ""),
      task("t13", "Laboratório de redes", "c4", "entrega", -15, "16:00", "media", true, [1], ""),
      task("t14", "Problemas da semana 3", "c2", "trabalho", -10, "", "baixa", true, [1], ""),
      task("t15", "Ficha de SQL", "c3", "trabalho", -1, "23:59", "media", true, [0, 1], ""),
    ].map(function (item) {
      item.dueDate = H.shiftDays(today, item._offset);
      if (item.done) item.doneAt = item.dueDate;
      delete item._offset;
      return item;
    });

    data.grades = [
      grade("g1", "c1", "Mini-teste", 15.5, 20, -20),
      grade("g2", "c1", "Trabalho 1", 16, 25, -6),
      grade("g3", "c2", "Frequência 1", 12.5, 40, -12),
      grade("g4", "c3", "Projeto — fase 1", 17, 30, -8),
      grade("g5", "c4", "Laboratório 1", 14, 15, -15),
      grade("g6", "c5", "Frequência 1", 18, 35, -12),
    ].map(function (item) {
      item.date = H.shiftDays(today, item._offset);
      delete item._offset;
      return item;
    });

    var sessionPlan = [
      [-1, "c1", 80], [-1, "c3", 40],
      [-2, "c2", 100], [-2, "c4", 50],
      [-3, "c5", 70],
      [-4, "c1", 60], [-4, "c2", 60],
      [-6, "c3", 90],
      [-7, "c4", 45], [-7, "c1", 75],
      [-8, "c2", 120],
      [-9, "c5", 50], [-9, "c3", 40],
      [-11, "c1", 90],
      [-12, "c4", 60], [-12, "c2", 30],
      [-13, "c3", 80],
      [-15, "c5", 100], [-15, "c1", 40],
      [-16, "c2", 70],
      [-18, "c4", 85],
      [-19, "c3", 55], [-19, "c1", 65],
      [-21, "c2", 90],
      [-22, "c5", 40],
      [-25, "c1", 110],
      [-26, "c4", 50], [-26, "c3", 70],
      [-28, "c2", 60],
      [-32, "c1", 45], [-32, "c5", 80],
      [-35, "c3", 60],
    ];
    data.sessions = sessionPlan.map(function (row, index) {
      return {
        id: "s" + (index + 1),
        courseId: row[1],
        date: H.shiftDays(today, row[0]),
        minutes: row[2],
      };
    });
    return data;

    function course(id, name, code, professor, room, color, icon, credits, schedule) {
      return { id: id, name: name, code: code, professor: professor, room: room, color: color, icon: icon, credits: credits, schedule: schedule };
    }
    function slot(day, start, end) {
      return { day: day, start: start, end: end };
    }
    function task(id, title, courseId, type, offset, dueTime, priority, done, reminders, notes) {
      return {
        id: id, title: title, courseId: courseId, type: type, _offset: offset,
        dueTime: dueTime, priority: priority, done: done, doneAt: null,
        reminders: reminders, notes: notes,
      };
    }
    function grade(id, courseId, title, score, weight, offset) {
      return { id: id, courseId: courseId, title: title, score: score, weight: weight, _offset: offset };
    }
  }

  function normalize(data) {
    var base = blank();
    data = data || {};
    data.courses = (data.courses || []).map(function (item) {
      return {
        id: item.id || H.uid(),
        name: item.name || "Cadeira",
        code: item.code || "",
        professor: item.professor || "",
        room: item.room || "",
        color: H.safeColor(item.color),
        icon: H.safeIcon(item.icon),
        credits: Number(item.credits) > 0 ? Number(item.credits) : 6,
        schedule: Array.isArray(item.schedule) ? item.schedule : [],
      };
    });
    data.tasks = (data.tasks || []).map(function (item) {
      return {
        id: item.id || H.uid(),
        title: item.title || "Tarefa",
        courseId: item.courseId || "",
        type: item.type || "trabalho",
        dueDate: item.dueDate || H.todayISO(),
        dueTime: item.dueTime || "",
        priority: item.priority || "media",
        done: Boolean(item.done),
        doneAt: item.done ? (item.doneAt || item.dueDate || H.todayISO()) : null,
        reminders: Array.isArray(item.reminders) ? item.reminders.map(Number) : [1, 7],
        notes: item.notes || "",
      };
    });
    data.grades = (data.grades || []).map(function (item) {
      return {
        id: item.id || H.uid(),
        courseId: item.courseId || "",
        title: item.title || "Avaliação",
        score: Number(item.score) || 0,
        weight: Number(item.weight) || 0,
        date: item.date || H.todayISO(),
      };
    });
    data.sessions = (data.sessions || []).map(function (item) {
      return {
        id: item.id || H.uid(),
        courseId: item.courseId || "",
        date: item.date || H.todayISO(),
        minutes: Math.max(0, Number(item.minutes) || 0),
      };
    });
    data.settings = Object.assign({}, base.settings, data.settings || {});
    if (!Array.isArray(data.settings.defaultReminders)) data.settings.defaultReminders = [0, 1, 7];
    return data;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.courses)) return seed();
      return normalize(parsed);
    } catch (err) {
      return seed();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.error(err);
    }
  }

  function replace(next) {
    state = normalize(next);
    save();
  }

  function courseById(id) {
    return state.courses.filter(function (item) { return item.id === id; })[0] || null;
  }

  function tasksOf(courseId) {
    return state.tasks.filter(function (item) { return item.courseId === courseId; });
  }

  function gradesOf(courseId) {
    return state.grades.filter(function (item) { return item.courseId === courseId; });
  }

  function sessionsOf(courseId) {
    return state.sessions.filter(function (item) { return item.courseId === courseId; });
  }

  function sortTasks(list) {
    var rank = { alta: 0, media: 1, baixa: 2 };
    return list.slice().sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      var ao = H.isOverdue(a) ? 0 : 1;
      var bo = H.isOverdue(b) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      return (rank[a.priority] || 1) - (rank[b.priority] || 1);
    });
  }

  function courseAverage(courseId) {
    var grades = gradesOf(courseId).filter(function (item) { return item.weight > 0; });
    if (!grades.length) return null;
    var weight = grades.reduce(function (sum, item) { return sum + item.weight; }, 0);
    if (!weight) return null;
    return grades.reduce(function (sum, item) { return sum + item.score * item.weight; }, 0) / weight;
  }

  function weightSum(courseId) {
    return gradesOf(courseId).reduce(function (sum, item) { return sum + (Number(item.weight) || 0); }, 0);
  }

  function globalAverage() {
    var rows = state.courses.map(function (item) {
      return { course: item, average: courseAverage(item.id) };
    }).filter(function (row) { return row.average != null; });
    if (!rows.length) return null;
    var weight = rows.reduce(function (sum, row) { return sum + (row.course.credits || 1); }, 0);
    return rows.reduce(function (sum, row) { return sum + row.average * (row.course.credits || 1); }, 0) / weight;
  }

  function pendingTasks() {
    return state.tasks.filter(function (item) { return !item.done; });
  }

  function overdueTasks() {
    return sortTasks(state.tasks.filter(function (item) { return H.isOverdue(item); }));
  }

  function completionRate() {
    if (!state.tasks.length) return null;
    var done = state.tasks.filter(function (item) { return item.done; }).length;
    return done / state.tasks.length;
  }

  function studyMinutes(courseId) {
    return state.sessions.reduce(function (sum, item) {
      if (courseId && item.courseId !== courseId) return sum;
      return sum + item.minutes;
    }, 0);
  }

  function studyBetween(fromISO, toISO, courseId) {
    return state.sessions.reduce(function (sum, item) {
      if (courseId && item.courseId !== courseId) return sum;
      if (item.date < fromISO || item.date > toISO) return sum;
      return sum + item.minutes;
    }, 0);
  }

  function thisWeekMinutes() {
    var start = H.toISODate(H.startOfWeek(new Date()));
    var end = H.toISODate(H.addDays(H.parseISODate(start), 6));
    return studyBetween(start, end);
  }

  function tasksDueOn(iso) {
    return sortTasks(state.tasks.filter(function (item) { return item.dueDate === iso; }));
  }

  function classesOn(date) {
    var weekday = H.isoWeekday(date);
    var blocks = [];
    state.courses.forEach(function (item) {
      (item.schedule || []).forEach(function (slot) {
        if (Number(slot.day) === weekday) {
          blocks.push({
            course: item,
            start: slot.start,
            end: slot.end,
          });
        }
      });
    });
    return blocks.sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  }

  function upcomingTasks(limit) {
    var list = sortTasks(pendingTasks().filter(function (item) { return !H.isOverdue(item); }));
    return typeof limit === "number" ? list.slice(0, limit) : list;
  }

  function activeReminders() {
    return sortTasks(state.tasks.filter(function (item) {
      if (item.done || H.isOverdue(item)) return false;
      var days = H.daysUntil(item);
      return (item.reminders || []).indexOf(days) >= 0;
    }));
  }

  function alertCount() {
    return overdueTasks().length + activeReminders().length;
  }

  function weekdayStudy() {
    var totals = [0, 0, 0, 0, 0, 0, 0];
    state.sessions.forEach(function (item) {
      var index = H.isoWeekday(H.parseISODate(item.date)) - 1;
      totals[index] += item.minutes;
    });
    return totals.map(function (minutes, index) {
      return { day: index + 1, label: H.WEEKDAYS[index], short: H.WEEKDAYS_SHORT[index], minutes: minutes };
    });
  }

  function averageSession() {
    if (!state.sessions.length) return null;
    return studyMinutes() / state.sessions.length;
  }

  function averagePerStudyDay() {
    var days = {};
    state.sessions.forEach(function (item) { days[item.date] = true; });
    var count = Object.keys(days).length;
    if (!count) return null;
    return studyMinutes() / count;
  }

  function averagePerWeek() {
    var start = H.parseISODate(state.settings.semesterStart);
    var today = H.parseISODate(H.todayISO());
    var end = H.parseISODate(state.settings.semesterEnd);
    var last = today < end ? today : end;
    if (last < start) return null;
    var weeks = Math.max(1, Math.round((last.getTime() - start.getTime()) / (7 * 86400000)));
    return studyMinutes() / weeks;
  }

  function weeklyEvolution() {
    var start = H.parseISODate(state.settings.semesterStart);
    var endLimit = H.parseISODate(state.settings.semesterEnd);
    var today = H.parseISODate(H.todayISO());
    var last = today < endLimit ? today : endLimit;
    if (last < start) return [];
    var cursor = H.startOfWeek(start);
    var limit = H.startOfWeek(last);
    var weeks = [];
    var guard = 0;
    while (cursor.getTime() <= limit.getTime() && guard < 28) {
      var from = H.toISODate(cursor);
      var to = H.toISODate(H.addDays(cursor, 6));
      var minutes = studyBetween(from, to);
      var done = state.tasks.filter(function (item) {
        return item.done && item.doneAt && item.doneAt >= from && item.doneAt <= to;
      }).length;
      weeks.push({ from: from, label: H.formatShort(from), minutes: minutes, done: done });
      cursor = H.addDays(cursor, 7);
      guard += 1;
    }
    return weeks;
  }

  function completionByPriority() {
    return H.PRIORITIES.map(function (priority) {
      var all = state.tasks.filter(function (item) { return item.priority === priority.id; });
      var done = all.filter(function (item) { return item.done; }).length;
      return { id: priority.id, label: priority.label, total: all.length, done: done };
    });
  }

  function upsert(list, item) {
    var index = -1;
    list.forEach(function (current, i) {
      if (current.id === item.id) index = i;
    });
    if (index >= 0) list[index] = item;
    else list.push(item);
  }

  state = load();
  save();

  window.Store = {
    get state() { return state; },
    course: courseById,
    tasksOf: tasksOf,
    gradesOf: gradesOf,
    sessionsOf: sessionsOf,
    sortTasks: sortTasks,
    courseAverage: courseAverage,
    weightSum: weightSum,
    globalAverage: globalAverage,
    pendingTasks: pendingTasks,
    overdueTasks: overdueTasks,
    completionRate: completionRate,
    studyMinutes: studyMinutes,
    studyBetween: studyBetween,
    thisWeekMinutes: thisWeekMinutes,
    tasksDueOn: tasksDueOn,
    classesOn: classesOn,
    upcomingTasks: upcomingTasks,
    activeReminders: activeReminders,
    alertCount: alertCount,
    weekdayStudy: weekdayStudy,
    averageSession: averageSession,
    averagePerStudyDay: averagePerStudyDay,
    averagePerWeek: averagePerWeek,
    weeklyEvolution: weeklyEvolution,
    completionByPriority: completionByPriority,
    saveCourse: function (item) { upsert(state.courses, item); save(); },
    deleteCourse: function (id) {
      state.courses = state.courses.filter(function (item) { return item.id !== id; });
      state.tasks = state.tasks.filter(function (item) { return item.courseId !== id; });
      state.grades = state.grades.filter(function (item) { return item.courseId !== id; });
      state.sessions = state.sessions.filter(function (item) { return item.courseId !== id; });
      save();
    },
    saveTask: function (item) { upsert(state.tasks, item); save(); },
    deleteTask: function (id) {
      state.tasks = state.tasks.filter(function (item) { return item.id !== id; });
      save();
    },
    toggleTask: function (id) {
      var item = state.tasks.filter(function (task) { return task.id === id; })[0];
      if (!item) return null;
      item.done = !item.done;
      item.doneAt = item.done ? H.todayISO() : null;
      save();
      return item;
    },
    saveGrade: function (item) { upsert(state.grades, item); save(); },
    deleteGrade: function (id) {
      state.grades = state.grades.filter(function (item) { return item.id !== id; });
      save();
    },
    saveSession: function (item) { upsert(state.sessions, item); save(); },
    deleteSession: function (id) {
      state.sessions = state.sessions.filter(function (item) { return item.id !== id; });
      save();
    },
    updateSettings: function (patch) {
      state.settings = Object.assign({}, state.settings, patch);
      save();
    },
    resetDemo: function () { replace(seed()); },
    clearAll: function () {
      var settings = Object.assign({}, state.settings, { demo: false, hideDemoNote: true, notificationsEnabled: false });
      var next = blank();
      next.settings = settings;
      replace(next);
    },
    firedKey: FIRED_KEY,
  };
})();
