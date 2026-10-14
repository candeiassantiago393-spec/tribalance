(function () {
  function courseDot(course) {
    if (!course) return '<span class="dot" style="--c:#b9b1a6"></span>';
    return '<span class="dot" style="--c:' + H.safeColor(course.color) + '"></span>';
  }

  function courseIcon(course, className) {
    return '<span class="' + className + '" style="--c:' + H.safeColor(course.color) + '">' + Icons.course(course.icon) + "</span>";
  }

  function empty(title, text, action, label) {
    return (
      '<div class="empty">' +
      "<h3>" + H.esc(title) + "</h3>" +
      "<p>" + H.esc(text) + "</p>" +
      (action ? '<button type="button" class="btn btn-primary" data-action="' + action + '">' + H.esc(label) + "</button>" : "") +
      "</div>"
    );
  }

  function taskRow(task) {
    var course = Store.course(task.courseId);
    var overdue = H.isOverdue(task);
    var classes = ["task"];
    if (task.done) classes.push("is-done");
    if (overdue) classes.push("is-overdue");
    return (
      '<article class="' + classes.join(" ") + '">' +
      '<button type="button" class="check' + (task.done ? " is-on" : "") + '" data-action="toggle-task" data-id="' + task.id + '" aria-label="' + (task.done ? "Marcar como pendente" : "Marcar como concluída") + '">' + Icons.ui("check") + "</button>" +
      '<div class="task-main">' +
      '<div class="task-line"><h3 class="task-title">' + H.esc(task.title) + "</h3>" +
      '<span class="badge badge-' + H.esc(task.priority) + '">' + H.esc(H.priorityLabel(task.priority)) + "</span></div>" +
      '<p class="task-meta">' + courseDot(course) + "<span>" + H.esc(course ? course.name : "Sem cadeira") + "</span><span>·</span><span>" + H.esc(H.typeLabel(task.type)) + "</span><span>·</span><span class=\"" + (overdue ? "danger" : "") + '">' + H.esc(H.relativeDue(task)) + "</span></p>" +
      "</div>" +
      '<div class="task-actions">' +
      '<button type="button" class="icon-btn" data-action="open-task" data-id="' + task.id + '" aria-label="Editar tarefa">' + Icons.ui("edit") + "</button>" +
      '<button type="button" class="icon-btn" data-action="ask-delete" data-entity="task" data-id="' + task.id + '" aria-label="Eliminar tarefa">' + Icons.ui("trash") + "</button>" +
      "</div></article>"
    );
  }

  function deadlineItem(task) {
    var course = Store.course(task.courseId);
    var overdue = H.isOverdue(task);
    return (
      '<button type="button" class="deadline' + (overdue ? " is-overdue" : "") + '" data-action="open-task" data-id="' + task.id + '">' +
      '<span class="deadline-date">' + H.esc(overdue ? "Atraso" : H.relativeDue(task).split(" · ")[0]) + "</span>" +
      "<strong>" + H.esc(task.title) + "</strong>" +
      "<small>" + H.esc((course ? course.code || course.name : "Sem cadeira") + " · " + H.typeLabel(task.type)) + "</small>" +
      "</button>"
    );
  }

  function dashboard() {
    var settings = Store.state.settings;
    var pending = Store.pendingTasks();
    var overdue = Store.overdueTasks();
    var rate = Store.completionRate();
    var doneCount = Store.state.tasks.filter(function (item) { return item.done; }).length;
    var weekMinutes = Store.thisWeekMinutes();
    var upcoming = Store.upcomingTasks(5);
    var todayClasses = Store.classesOn(new Date());
    var reminders = Store.activeReminders().slice(0, 4);
    var average = Store.globalAverage();
    var maxMinutes = Store.state.courses.reduce(function (max, course) {
      return Math.max(max, Store.studyMinutes(course.id));
    }, 0);

    var hours = Store.state.courses.length
      ? Store.state.courses.map(function (course) {
        var minutes = Store.studyMinutes(course.id);
        var width = maxMinutes ? Math.max(4, Math.round((minutes / maxMinutes) * 100)) : 0;
        return (
          '<div class="bar-row">' +
          '<div class="bar-label"><span class="dot" style="--c:' + H.safeColor(course.color) + '"></span><span>' + H.esc(course.code || course.name) + "</span></div>" +
          '<div class="bar"><span style="width:' + (minutes ? width : 0) + "%;background:" + H.safeColor(course.color) + '"></span></div>' +
          '<strong>' + H.esc(H.formatHours(minutes)) + " h</strong></div>"
        );
      }).join("")
      : '<p class="muted">Adiciona cadeiras e regista estudo para veres a distribuição.</p>';

    var summary = "Tens " + H.countLabel(pending.length, "tarefa pendente", "tarefas pendentes");
    if (overdue.length) summary += " e " + H.countLabel(overdue.length, "atrasada", "atrasadas");
    summary += ".";

    return (
      '<section class="page">' +
      (settings.demo && !settings.hideDemoNote
        ? '<div class="demo-note"><p>Estás a ver um semestre de exemplo. Podes editá-lo ou começar do zero nas definições.</p><button type="button" class="btn btn-ghost btn-sm" data-action="dismiss-demo">Ocultar</button></div>'
        : "") +
      (overdue.length
        ? '<button type="button" class="alert-banner" data-action="show-overdue">' + Icons.ui("alert") + "<span>" + H.esc(H.countLabel(overdue.length, "tarefa atrasada precisa", "tarefas atrasadas precisam") + " de atenção") + '</span><em>Ver</em></button>'
        : "") +
      '<header class="page-head"><div><p class="eyebrow">' + H.esc(settings.semesterName) + "</p><h1>" + H.esc(H.greeting()) + '</h1><p class="lede">' + H.esc(H.formatLong(H.todayISO())) + ". " + H.esc(summary) + "</p></div>" +
      '<div class="page-actions"><button type="button" class="btn btn-ghost" data-action="open-session">' + Icons.ui("study") + "Registar estudo</button>" +
      '<button type="button" class="btn btn-primary" data-action="open-task">' + Icons.ui("plus") + "Nova tarefa</button></div></header>" +
      '<div class="kpis">' +
      kpi("Pendentes", String(pending.length), pending.length ? "por concluir" : "em dia", "") +
      kpi("Atrasadas", String(overdue.length), overdue.length ? "fora do prazo" : "nenhuma", overdue.length ? " is-alert" : "", "show-overdue") +
      kpi("Conclusão", H.formatPct(rate == null ? null : rate * 100), Store.state.tasks.length ? doneCount + " de " + Store.state.tasks.length + " tarefas" : "sem tarefas", "") +
      kpi("Estudo esta semana", H.formatHours(weekMinutes) + " h", "desde segunda-feira", "") +
      "</div>" +
      '<div class="cols">' +
      '<section class="card"><header class="card-head"><h2>Próximos prazos</h2><button type="button" class="text-btn" data-action="nav" data-view="tasks">Ver tarefas</button></header>' +
      (upcoming.length ? '<div class="deadlines">' + upcoming.map(deadlineItem).join("") + "</div>" : empty("Sem prazos próximos", "As tarefas por concluir aparecem aqui por ordem de entrega.")) +
      "</section>" +
      '<section class="card"><header class="card-head"><h2>Horas estudadas</h2><span class="muted">no semestre</span></header><div class="bars">' + hours + "</div>" +
      '<p class="average-line">Média global <strong>' + H.esc(H.formatGrade(average)) + "</strong></p></section></div>" +
      '<div class="cols">' +
      '<section class="card"><header class="card-head"><h2>Horário de hoje</h2></header>' +
      (todayClasses.length
        ? '<div class="today-list">' + todayClasses.map(function (block) {
          return classItem(block);
        }).join("") + "</div>"
        : '<p class="muted">Sem aulas hoje.</p>') +
      "</section>" +
      '<section class="card"><header class="card-head"><h2>Lembretes de hoje</h2><button type="button" class="text-btn" data-action="nav" data-view="reminders">Abrir</button></header>' +
      (reminders.length
        ? '<div class="deadlines">' + reminders.map(deadlineItem).join("") + "</div>"
        : '<p class="muted">Nenhum alerta configurado coincide com o dia de hoje.</p>') +
      "</section></div></section>"
    );
  }

  function kpi(label, value, hint, extra, action) {
    var tag = action ? "button" : "article";
    return (
      "<" + tag + ' class="kpi' + (extra || "") + '"' + (action ? ' type="button" data-action="' + action + '"' : "") + ">" +
      '<span class="kpi-label">' + H.esc(label) + "</span>" +
      '<strong class="kpi-value">' + H.esc(value) + "</strong>" +
      '<span class="kpi-hint">' + H.esc(hint) + "</span></" + tag + ">"
    );
  }

  function classItem(block) {
    var kind = H.classType(block.type);
    var who = block.teacher ? kind.short + " · " + block.teacher : kind.label;
    var room = block.room || "Sala por definir";
    return '<div class="today-item" style="--c:' + H.safeColor(block.course.color) + '"><strong>' + H.esc(block.start) + "–" + H.esc(block.end) + "</strong><span>" + H.esc(block.course.name) + "</span><small>" + H.esc(who + " · " + room) + "</small></div>";
  }

  function typeRank(a, b) {
    var rank = { TP: 0, PL: 1, AMBAS: 2 };
    return (rank[a.type] || 0) - (rank[b.type] || 0) || String(a.name).localeCompare(String(b.name), "pt");
  }

  function courses() {
    var list = Store.state.courses;
    var cards = list.map(function (course) {
      var average = Store.courseAverage(course.id);
      var pending = Store.tasksOf(course.id).filter(function (item) { return !item.done; }).length;
      var minutes = Store.studyMinutes(course.id);
      var slots = (course.schedule || []).slice().sort(function (a, b) {
        return a.day - b.day || (a.start < b.start ? -1 : 1);
      });
      return (
        '<article class="course-card">' +
        '<div class="stripe" style="background:' + H.safeColor(course.color) + '"></div>' +
        '<div class="body">' +
        '<div class="course-top">' + courseIcon(course, "course-icon") +
        '<div class="task-actions">' +
        '<button type="button" class="icon-btn" data-action="open-course" data-id="' + course.id + '" aria-label="Editar cadeira">' + Icons.ui("edit") + "</button>" +
        '<button type="button" class="icon-btn" data-action="ask-delete" data-entity="course" data-id="' + course.id + '" aria-label="Eliminar cadeira">' + Icons.ui("trash") + "</button>" +
        "</div></div>" +
        "<h3>" + H.esc(course.name) + "</h3>" +
        ((course.staff && course.staff.length)
          ? '<div class="staff-lines">' + course.staff.slice().sort(typeRank).map(function (person) {
            var kind = H.classType(person.type);
            return '<p class="staff-line"><span class="type-pill type-' + kind.id.toLowerCase() + '">' + kind.short + "</span><span>" + H.esc(person.name) + "</span></p>";
          }).join("") + "</div>"
          : '<p class="muted">Professores por definir</p>') +
        ((course.rooms && course.rooms.length)
          ? '<div class="staff-lines">' + course.rooms.slice().sort(typeRank).map(function (room) {
            var kind = H.classType(room.type);
            return '<p class="staff-line"><span class="type-pill type-' + kind.id.toLowerCase() + '">' + kind.short + "</span><span>" + H.esc(room.name) + "</span></p>";
          }).join("") + "</div>"
          : "") +
        '<div class="chips">' + (slots.length
          ? slots.map(function (slot) {
            var kind = H.classType(slot.type);
            var room = slot.room ? " · " + slot.room : "";
            return '<span class="chip"><span class="type-pill type-' + kind.id.toLowerCase() + '">' + kind.short + "</span>" + H.esc(H.dayShort(Number(slot.day)) + " " + slot.start + "–" + slot.end + room) + "</span>";
          }).join("")
          : '<span class="chip">Horário por definir</span>') + "</div>" +
        '<footer class="course-meta"><span>Média ' + H.esc(H.formatGrade(average)) + "</span><span>" + H.esc(H.countLabel(pending, "pendente", "pendentes")) + "</span><span>" + H.esc(H.formatHours(minutes)) + " h</span></footer>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-action="open-session" data-course="' + course.id + '">Registar estudo</button>' +
        "</div></article>"
      );
    }).join("");

    return (
      '<section class="page"><header class="page-head"><div><p class="eyebrow">Organização</p><h1>Cadeiras</h1><p class="lede">Vários professores e salas, de teórica ou prática, prática laboratorial, ou ambas.</p></div>' +
      '<div class="page-actions"><button type="button" class="btn btn-primary" data-action="open-course">' + Icons.ui("plus") + "Nova cadeira</button></div></header>" +
      (list.length ? '<div class="cards">' + cards + "</div>" : empty("Ainda não há cadeiras", "Adiciona a primeira para organizar horários, tarefas e notas.", "open-course", "Nova cadeira")) +
      "</section>"
    );
  }

  function tasks() {
    var filter = UI.taskFilter;
    var filtered = Store.sortTasks(Store.state.tasks.filter(function (task) {
      if (filter.status === "pendentes" && task.done) return false;
      if (filter.status === "concluidas" && !task.done) return false;
      if (filter.status === "atrasadas" && !H.isOverdue(task)) return false;
      if (filter.courseId !== "all" && task.courseId !== filter.courseId) return false;
      if (filter.priority !== "all" && task.priority !== filter.priority) return false;
      if (filter.type !== "all" && task.type !== filter.type) return false;
      if (filter.q) {
        var hay = (task.title + " " + (task.notes || "")).toLowerCase();
        if (hay.indexOf(filter.q.toLowerCase()) < 0) return false;
      }
      return true;
    }));

    var courseOptions = '<option value="all"' + (filter.courseId === "all" ? " selected" : "") + ">Todas as cadeiras</option>" + Store.state.courses.map(function (course) {
      return '<option value="' + course.id + '"' + (filter.courseId === course.id ? " selected" : "") + ">" + H.esc(course.name) + "</option>";
    }).join("");

    return (
      '<section class="page"><header class="page-head"><div><p class="eyebrow">Trabalho</p><h1>Tarefas</h1><p class="lede">Trabalhos, testes, frequências e entregas, com prazo e prioridade.</p></div>' +
      '<div class="page-actions"><button type="button" class="btn btn-primary" data-action="open-task">' + Icons.ui("plus") + "Nova tarefa</button></div></header>" +
      '<div class="filters">' +
      '<label class="search">' + Icons.ui("search") + '<input id="task-search" type="search" placeholder="Procurar tarefa" value="' + H.esc(filter.q || "") + '"></label>' +
      select("status", filter.status, '<option value="pendentes">Pendentes</option><option value="atrasadas">Atrasadas</option><option value="concluidas">Concluídas</option><option value="todas">Todas</option>') +
      '<select data-filter="courseId">' + courseOptions + "</select>" +
      select("priority", filter.priority, '<option value="all">Todas as prioridades</option><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>') +
      select("type", filter.type, '<option value="all">Todos os tipos</option>' + H.TYPES.map(function (type) {
        return '<option value="' + type.id + '">' + H.esc(type.label) + "</option>";
      }).join("")) +
      "</div>" +
      (filtered.length ? '<div class="task-list">' + filtered.map(taskRow).join("") + "</div>" : empty("Nada para mostrar", "Não há tarefas com estes filtros. Cria uma nova ou alarga a pesquisa.")) +
      "</section>"
    );
  }

  function select(name, current, options) {
    return '<select data-filter="' + name + '">' + options.replace(
      'value="' + current + '"',
      'value="' + current + '" selected'
    ) + "</select>";
  }

  function calendar() {
    var mode = UI.calMode;
    var cursor = UI.calDate;
    var title = mode === "week" ? H.weekTitle(H.startOfWeek(cursor)) : H.monthTitle(cursor);
    var body = mode === "week" ? weekView(cursor) : monthView(cursor);
    return (
      '<section class="page"><header class="page-head"><div><p class="eyebrow">Agenda</p><h1>Calendário</h1><p class="lede">Aulas na semana e prazos de testes, frequências, trabalhos e entregas.</p></div>' +
      '<div class="page-actions"><button type="button" class="btn btn-primary" data-action="open-task">' + Icons.ui("plus") + "Nova tarefa</button></div></header>" +
      '<div class="cal-toolbar"><div class="segment" data-segment="cal">' +
      '<button type="button" data-action="cal-mode" data-mode="week"' + (mode === "week" ? ' class="is-selected"' : "") + ">Semana</button>" +
      '<button type="button" data-action="cal-mode" data-mode="month"' + (mode === "month" ? ' class="is-selected"' : "") + ">Mês</button></div>" +
      '<div class="cal-nav"><button type="button" class="icon-btn flip" data-action="cal-prev" aria-label="Anterior">' + Icons.ui("chevron") + '</button><strong>' + H.esc(title) + '</strong><button type="button" class="icon-btn" data-action="cal-next" aria-label="Seguinte">' + Icons.ui("chevron") + '</button><button type="button" class="btn btn-ghost btn-sm" data-action="cal-today">Hoje</button></div></div>' +
      body + "</section>"
    );
  }

  function monthView(cursor) {
    var cells = [];
    var first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    var pad = (first.getDay() + 6) % 7;
    var start = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - pad, 12);
    for (var i = 0; i < 42; i++) cells.push(H.addDays(start, i));
    var heads = H.WEEKDAYS_SHORT.map(function (day) { return "<span>" + day + "</span>"; }).join("");
    var days = cells.map(function (date) {
      var iso = H.toISODate(date);
      var inMonth = date.getMonth() === cursor.getMonth();
      var tasks = Store.tasksDueOn(iso).slice(0, 3);
      var extra = Store.tasksDueOn(iso).length - tasks.length;
      var pills = tasks.map(function (task) {
        var course = Store.course(task.courseId);
        var color = course ? H.safeColor(course.color) : "#3d4f5f";
        return '<button type="button" class="pill' + (H.isOverdue(task) ? " is-overdue" : "") + (task.done ? " is-done" : "") + '" style="--c:' + color + '" data-action="open-task" data-id="' + task.id + '">' + H.esc(task.title) + "</button>";
      }).join("");
      return (
        '<div class="cell' + (inMonth ? "" : " is-out") + (iso === H.todayISO() ? " is-today" : "") + '" data-action="open-day" data-date="' + iso + '" role="button" tabindex="0">' +
        "<header><span>" + date.getDate() + "</span></header>" + pills +
        (extra > 0 ? '<span class="more">+' + extra + "</span>" : "") +
        "</div>"
      );
    }).join("");
    return '<div class="month"><div class="month-head">' + heads + "</div>" + days + "</div>";
  }

  function weekView(cursor) {
    var start = H.startOfWeek(cursor);
    var days = [];
    for (var i = 0; i < 7; i++) days.push(H.addDays(start, i));
    var blocks = [];
    days.forEach(function (date) {
      Store.classesOn(date).forEach(function (block) { blocks.push(block); });
    });
    var boundStart = 8;
    var boundEnd = 20;
    blocks.forEach(function (block) {
      boundStart = Math.min(boundStart, Math.floor(H.parseHour(block.start)));
      boundEnd = Math.max(boundEnd, Math.ceil(H.parseHour(block.end)));
    });
    var hours = [];
    for (var hour = boundStart; hour < boundEnd; hour++) hours.push(hour);
    var height = hours.length * 52;

    var head = days.map(function (date) {
      var iso = H.toISODate(date);
      return '<div class="week-h' + (iso === H.todayISO() ? " is-today" : "") + '"><span>' + H.WEEKDAYS_SHORT[H.isoWeekday(date) - 1] + "</span><strong>" + date.getDate() + "</strong></div>";
    }).join("");

    var allday = days.map(function (date) {
      var iso = H.toISODate(date);
      var tasks = Store.tasksDueOn(iso);
      return '<div class="week-all" data-action="open-day" data-date="' + iso + '">' + tasks.map(function (task) {
        var course = Store.course(task.courseId);
        return '<button type="button" class="pill' + (H.isOverdue(task) ? " is-overdue" : "") + (task.done ? " is-done" : "") + '" style="--c:' + (course ? H.safeColor(course.color) : "#3d4f5f") + '" data-action="open-task" data-id="' + task.id + '">' + H.esc(task.title) + "</button>";
      }).join("") + "</div>";
    }).join("");

    var cols = days.map(function (date) {
      var classBlocks = Store.classesOn(date).map(function (block) {
        var top = (H.parseHour(block.start) - boundStart) * 52;
        var blockHeight = Math.max(28, (H.parseHour(block.end) - H.parseHour(block.start)) * 52 - 4);
        return '<button type="button" class="block" style="top:' + top + "px;height:" + blockHeight + "px;background:" + H.safeColor(block.course.color) + '" data-action="open-course" data-id="' + block.course.id + '"><strong>' + H.esc((block.course.code || block.course.name) + " · " + H.classType(block.type).short) + "</strong><span>" + H.esc(block.start) + "–" + H.esc(block.end) + "</span></button>";
      }).join("");
      return '<div class="week-col" style="height:' + height + 'px">' + classBlocks + "</div>";
    }).join("");

    var gutter = hours.map(function (hour) {
      return '<div style="height:52px">' + String(hour).padStart(2, "0") + ":00</div>";
    }).join("");

    return (
      '<div class="week"><div class="week-head"><div class="week-gutter"></div>' + head + "</div>" +
      '<div class="week-allday"><div class="week-gutter">Prazos</div>' + allday + "</div>" +
      '<div class="week-body"><div class="week-hours">' + gutter + "</div>" + cols + "</div></div>"
    );
  }

  function grades() {
    var average = Store.globalAverage();
    var counted = Store.state.courses.filter(function (course) { return Store.courseAverage(course.id) != null; }).length;
    var blocks = Store.state.courses.map(function (course) {
      var rows = Store.gradesOf(course.id).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var avg = Store.courseAverage(course.id);
      var weights = Store.weightSum(course.id);
      var table = rows.length
        ? '<table class="grade-table"><thead><tr><th>Avaliação</th><th>Nota</th><th>Peso</th><th>Data</th><th></th></tr></thead><tbody>' +
          rows.map(function (grade) {
            return "<tr><td>" + H.esc(grade.title) + "</td><td>" + H.esc(H.formatGrade(grade.score)) + "</td><td>" + H.esc(String(grade.weight).replace(".", ",")) + '%</td><td>' + H.esc(H.formatShort(grade.date)) + '</td><td class="row-actions"><button type="button" class="icon-btn" data-action="open-grade" data-id="' + grade.id + '" aria-label="Editar nota">' + Icons.ui("edit") + '</button><button type="button" class="icon-btn" data-action="ask-delete" data-entity="grade" data-id="' + grade.id + '" aria-label="Eliminar nota">' + Icons.ui("trash") + "</button></td></tr>";
          }).join("") + "</tbody></table>"
        : '<p class="muted">Sem classificações nesta cadeira.</p>';
      return (
        '<section class="card grade-card"><header class="card-head"><div class="who">' + courseIcon(course, "mini-icon") +
        "<div><h3>" + H.esc(course.name) + "</h3><p class=\"muted\">Média atual " + H.esc(H.formatGrade(avg)) + " · " + H.esc(String(course.credits)) + " ECTS" + (weights ? " · pesos " + H.esc(String(weights).replace(".", ",")) + "%" : "") + "</p></div></div>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-action="open-grade" data-course="' + course.id + '">Adicionar nota</button></header>' + table + "</section>"
      );
    }).join("");

    return (
      '<section class="page"><header class="page-head"><div><p class="eyebrow">Classificações</p><h1>Notas</h1><p class="lede">A média da cadeira usa os pesos indicados. A média global pondera pelos créditos.</p></div>' +
      '<div class="page-actions"><button type="button" class="btn btn-primary" data-action="open-grade"' + (Store.state.courses.length ? "" : " disabled") + ">" + Icons.ui("plus") + "Registar nota</button></div></header>" +
      '<section class="global-grade"><div><p class="eyebrow">Média do semestre</p><strong>' + H.esc(H.formatGrade(average)) + '</strong><p class="muted">' + (counted ? H.esc(H.countLabel(counted, "cadeira com notas", "cadeiras com notas")) + ". Escala de 0 a 20." : "Regista classificações para calcular a média.") + "</p></div></section>" +
      (Store.state.courses.length ? '<div class="stack">' + blocks + "</div>" : empty("Ainda não há cadeiras", "Cria uma cadeira antes de registar classificações.", "open-course", "Nova cadeira")) +
      "</section>"
    );
  }

  function stats() {
    var rate = Store.completionRate();
    var days = Store.weekdayStudy().slice().sort(function (a, b) { return b.minutes - a.minutes; });
    var maxDay = days.reduce(function (max, day) { return Math.max(max, day.minutes); }, 0);
    var top = days[0] && days[0].minutes ? days[0] : null;
    var weeks = Store.weeklyEvolution();
    var maxWeek = weeks.reduce(function (max, week) { return Math.max(max, week.minutes); }, 0);
    var priorities = Store.completionByPriority();
    var recent = Store.state.sessions.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 8);
    var circ = 2 * Math.PI * 42;
    var pct = rate == null ? 0 : rate;
    var dash = circ * pct;

    var dayBars = Store.state.sessions.length
      ? days.map(function (day) {
        var width = maxDay ? Math.round((day.minutes / maxDay) * 100) : 0;
        return '<div class="bar-row"><div class="bar-label">' + H.esc(day.label) + '</div><div class="bar"><span style="width:' + width + '%"></span></div><strong>' + H.esc(H.formatMinutes(day.minutes)) + "</strong></div>";
      }).join("")
      : "";

    var evolution = weeks.length && maxWeek
      ? '<div class="evo">' + weeks.map(function (week) {
        var height = Math.max(week.minutes ? 8 : 0, Math.round((week.minutes / maxWeek) * 100));
        return '<div class="evo-col"><span class="evo-count">' + week.done + '</span><div class="evo-bar-wrap"><div class="evo-bar" style="height:' + height + '%"></div></div><span>' + H.esc(week.label) + "</span></div>";
      }).join("") + "</div>"
      : '<p class="muted">A evolução aparece quando houver sessões de estudo no semestre.</p>';

    var courseShare = Store.state.courses.map(function (course) {
      var minutes = Store.studyMinutes(course.id);
      var total = Store.studyMinutes();
      var width = total ? Math.round((minutes / total) * 100) : 0;
      return '<div class="bar-row"><div class="bar-label"><span class="dot" style="--c:' + H.safeColor(course.color) + '"></span>' + H.esc(course.code || course.name) + '</div><div class="bar"><span style="width:' + width + "%;background:" + H.safeColor(course.color) + '"></span></div><strong>' + width + "%</strong></div>";
    }).join("");

    return (
      '<section class="page"><header class="page-head"><div><p class="eyebrow">Produtividade</p><h1>Estatísticas</h1><p class="lede">Como o estudo e a conclusão de tarefas evoluem ao longo do semestre.</p></div>' +
      '<div class="page-actions"><button type="button" class="btn btn-primary" data-action="open-session">' + Icons.ui("study") + "Registar estudo</button></div></header>" +
      '<div class="kpis">' +
      kpi("Tempo médio por sessão", Store.averageSession() == null ? "—" : H.formatMinutes(Store.averageSession()), Store.state.sessions.length ? H.countLabel(Store.state.sessions.length, "sessão registada", "sessões registadas") : "sem sessões", "") +
      kpi("Por dia de estudo", Store.averagePerStudyDay() == null ? "—" : H.formatMinutes(Store.averagePerStudyDay()), "média nos dias com registo", "") +
      kpi("Por semana", Store.averagePerWeek() == null ? "—" : H.formatMinutes(Store.averagePerWeek()), "desde o início do semestre", "") +
      kpi("Taxa de conclusão", H.formatPct(rate == null ? null : rate * 100), Store.state.tasks.length ? "de todas as tarefas" : "sem tarefas", "") +
      "</div>" +
      '<div class="cols">' +
      '<section class="card"><header class="card-head"><h2>Dias mais produtivos</h2></header>' +
      (top ? '<p class="lede tight">' + H.esc(H.WEEKDAYS_LONG[top.day - 1].charAt(0).toUpperCase() + H.WEEKDAYS_LONG[top.day - 1].slice(1)) + " concentra a maior parte do estudo.</p>" + '<div class="bars">' + dayBars + "</div>" : empty("Sem sessões de estudo", "Regista tempo de estudo para descobrires os dias em que rendes mais.", "open-session", "Registar estudo")) +
      "</section>" +
      '<section class="card completion-card"><header class="card-head"><h2>Taxa de conclusão</h2></header><div class="completion">' +
      '<svg class="donut" viewBox="0 0 120 120"><circle class="donut-track" cx="60" cy="60" r="42"></circle><circle class="donut-value" cx="60" cy="60" r="42" stroke-dasharray="' + dash.toFixed(2) + " " + (circ - dash).toFixed(2) + '" transform="rotate(-90 60 60)"></circle><text x="60" y="66" text-anchor="middle">' + H.esc(H.formatPct(rate == null ? null : rate * 100)) + "</text></svg>" +
      '<div class="priority-split">' + priorities.map(function (item) {
        return "<p><span class=\"badge badge-" + item.id + '">' + H.esc(item.label) + "</span> " + item.done + " de " + item.total + "</p>";
      }).join("") + "</div></div></section></div>" +
      '<section class="card"><header class="card-head"><h2>Evolução ao longo do semestre</h2><span class="muted">barras: horas · número: tarefas concluídas</span></header>' + evolution + "</section>" +
      '<div class="cols"><section class="card"><header class="card-head"><h2>Distribuição do estudo</h2></header>' +
      (Store.studyMinutes() ? '<div class="bars">' + courseShare + "</div>" : '<p class="muted">Ainda sem horas registadas.</p>') +
      '</section><section class="card"><header class="card-head"><h2>Sessões recentes</h2></header>' +
      (recent.length ? '<div class="session-list">' + recent.map(function (session) {
        var course = Store.course(session.courseId);
        return '<div class="session-row"><div>' + courseDot(course) + "<strong>" + H.esc(course ? course.name : "Cadeira removida") + "</strong><small>" + H.esc(H.formatShort(session.date)) + "</small></div><span>" + H.esc(H.formatMinutes(session.minutes)) + '</span><button type="button" class="icon-btn" data-action="ask-delete" data-entity="session" data-id="' + session.id + '" aria-label="Eliminar sessão">' + Icons.ui("trash") + "</button></div>";
      }).join("") + "</div>" : '<p class="muted">As sessões que registares ficam listadas aqui.</p>') +
      "</section></div></section>"
    );
  }

  function reminders() {
    var settings = Store.state.settings;
    var overdue = Store.overdueTasks();
    var active = Store.activeReminders();
    var soon = Store.sortTasks(Store.pendingTasks().filter(function (task) {
      if (H.isOverdue(task)) return false;
      var days = H.daysUntil(task);
      return days >= 0 && days <= 14 && (task.reminders || []).indexOf(days) < 0;
    }));

    function block(task) {
      var course = Store.course(task.courseId);
      var overdueTask = H.isOverdue(task);
      var days = H.daysUntil(task);
      var reason = overdueTask ? "Fora do prazo" : days === 0 ? "Entrega hoje" : days === 1 ? "Falta 1 dia" : "Faltam " + days + " dias";
      return (
        '<article class="remind' + (overdueTask ? " is-overdue" : "") + '">' +
        '<div class="remind-main"><div class="task-line"><h3>' + H.esc(task.title) + "</h3><span class=\"badge badge-" + H.esc(task.priority) + '">' + H.esc(H.priorityLabel(task.priority)) + "</span></div>" +
        "<p class=\"task-meta\">" + courseDot(course) + "<span>" + H.esc(course ? course.name : "Sem cadeira") + "</span><span>·</span><span>" + H.esc(reason) + "</span><span>·</span><span>" + H.esc(H.formatShort(task.dueDate) + (task.dueTime ? " " + task.dueTime : "")) + "</span></p></div>" +
        '<div class="task-actions"><button type="button" class="btn btn-ghost btn-sm" data-action="toggle-task" data-id="' + task.id + '">Concluir</button><button type="button" class="icon-btn" data-action="open-task" data-id="' + task.id + '" aria-label="Editar tarefa">' + Icons.ui("edit") + "</button></div></article>"
      );
    }

    var checks = H.REMINDER_OPTIONS.map(function (option) {
      var on = settings.defaultReminders.indexOf(option.days) >= 0;
      return '<label class="checkline"><input type="checkbox" data-default-reminder="' + option.days + '"' + (on ? " checked" : "") + "><span>" + H.esc(option.label) + "</span></label>";
    }).join("");

    var permission = "Notification" in window ? Notification.permission : "unsupported";
    var notifyText = settings.notificationsEnabled && permission === "granted"
      ? "As notificações do browser estão ativas enquanto a aplicação estiver aberta."
      : "Podes receber um aviso do browser no dia do alerta, com a aplicação aberta.";

    return (
      '<section class="page"><header class="page-head"><div><p class="eyebrow">Prazos</p><h1>Lembretes</h1><p class="lede">Alertas para entregas próximas e destaque para o que já está atrasado.</p></div></header>' +
      (overdue.length ? '<div class="stack-tight"><h2 class="section-title">Atrasadas</h2>' + overdue.map(block).join("") + "</div>" : "") +
      '<div class="cols">' +
      '<section class="card"><header class="card-head"><h2>Alertas predefinidos</h2></header><p class="muted">Aplicados quando crias uma tarefa nova. Cada tarefa pode ter os seus.</p><div class="check-grid">' + checks + "</div></section>" +
      '<section class="card"><header class="card-head"><h2>Notificações</h2></header><p class="muted">' + H.esc(notifyText) + '</p><button type="button" class="btn btn-primary" data-action="enable-notifications">' + (settings.notificationsEnabled && permission === "granted" ? "Notificações ativas" : "Ativar notificações") + "</button></section></div>" +
      '<div class="stack-tight"><h2 class="section-title">A acontecer agora</h2>' +
      (active.length ? active.map(block).join("") : '<p class="muted card quiet">Nenhum alerta coincide com o dia de hoje.</p>') +
      "</div>" +
      (soon.length ? '<div class="stack-tight"><h2 class="section-title">Próximos 14 dias</h2>' + soon.map(block).join("") + "</div>" : "") +
      "</section>"
    );
  }

  window.Views = {
    classItem: classItem,
    dashboard: dashboard,
    courses: courses,
    tasks: tasks,
    calendar: calendar,
    grades: grades,
    stats: stats,
    reminders: reminders,
  };
})();
