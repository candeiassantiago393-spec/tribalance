(function () {
  function field(label, control, hint) {
    return '<label class="field"><span>' + label + "</span>" + control + (hint ? '<small class="hint">' + hint + "</small>" : "") + "</label>";
  }

  function segment(name, options, selected) {
    return '<div class="segment" data-segment="' + name + '">' + options.map(function (option) {
      var on = option.id === selected;
      return '<button type="button" data-action="segment" data-value="' + option.id + '"' + (on ? ' class="is-selected"' : "") + ">" + H.esc(option.label) + "</button>";
    }).join("") + "</div>";
  }

  function linkedOptions(list, selected, emptyLabel) {
    var rows = (list || []).filter(function (item) { return !item.archived || item.id === selected; });
    var html = emptyLabel ? '<option value="">' + H.esc(emptyLabel) + "</option>" : "";
    return html + rows.map(function (item) {
      return '<option value="' + item.id + '"' + (item.id === selected ? " selected" : "") + ">" + H.esc(item.name) + "</option>";
    }).join("");
  }

  function courseOptions(selected, withEmpty) {
    return linkedOptions(Store.state.courses, selected, withEmpty ? "Nenhuma" : "");
  }

  function projectOptions(selected, withEmpty) {
    return linkedOptions(Store.state.projects, selected, withEmpty ? "Nenhum" : "");
  }

  function typeOptions(selected) {
    return H.CLASS_TYPES.map(function (kind) {
      return '<option value="' + kind.id + '"' + (selected === kind.id ? " selected" : "") + ">" + H.esc(kind.short + " · " + kind.label) + "</option>";
    }).join("");
  }

  function staffRow(person) {
    person = person || { type: "TP", name: "" };
    return (
      '<div class="staff-row"><select name="staffType">' + typeOptions(H.classTypeId(person.type)) + '</select><input name="staffName" maxlength="80" value="' + H.esc(person.name || "") + '" placeholder="Nome do professor"><button type="button" class="icon-btn" data-action="remove-staff" aria-label="Remover professor">' + Icons.ui("close") + "</button></div>"
    );
  }

  function roomRow(room) {
    room = room || { type: "TP", name: "" };
    return (
      '<div class="room-row"><select name="roomType">' + typeOptions(H.classTypeId(room.type)) + '</select><input name="roomName" maxlength="40" value="' + H.esc(room.name || "") + '" placeholder="Ex.: Lab 3"><button type="button" class="icon-btn" data-action="remove-room" aria-label="Remover sala">' + Icons.ui("close") + "</button></div>"
    );
  }

  function scheduleRow(slot) {
    slot = slot || { day: 1, start: "09:00", end: "11:00", type: "TP", room: "" };
    var days = [1, 2, 3, 4, 5, 6, 7].map(function (day) {
      return '<option value="' + day + '"' + (Number(slot.day) === day ? " selected" : "") + ">" + H.esc(H.dayName(day)) + "</option>";
    }).join("");
    return (
      '<div class="schedule-row"><select name="slotType">' + typeOptions(H.classTypeId(slot.type)) + '</select><select name="day">' + days + '</select><input type="time" name="start" value="' + H.esc(slot.start || "09:00") + '" required><span>às</span><input type="time" name="end" value="' + H.esc(slot.end || "11:00") + '" required><input name="slotRoom" maxlength="40" value="' + H.esc(slot.room || "") + '" placeholder="Sala"><button type="button" class="icon-btn" data-action="remove-slot" aria-label="Remover horário">' + Icons.ui("close") + "</button></div>"
    );
  }

  function swatches(selected) {
    return '<div class="swatches">' + H.PALETTE.map(function (color) {
      var on = color.value.toLowerCase() === String(selected).toLowerCase();
      return '<button type="button" class="swatch' + (on ? " is-selected" : "") + '" style="--c:' + color.value + '" data-action="pick-color" data-color="' + color.value + '" aria-label="' + H.esc(color.name) + '"></button>';
    }).join("") + "</div>";
  }

  function iconPicks(selected) {
    var labels = { book: "Livro", code: "Código", sigma: "Matemática", database: "Base de dados", share: "Rede", compass: "Bússola", flask: "Laboratório", pen: "Caneta" };
    return '<div class="icon-picks">' + H.COURSE_ICONS.map(function (icon) {
      return '<button type="button" class="icon-opt' + (icon === selected ? " is-selected" : "") + '" data-action="pick-icon" data-icon="' + icon + '" aria-label="' + labels[icon] + '">' + Icons.course(icon) + "</button>";
    }).join("") + "</div>";
  }

  function shell(title, body, wide) {
    return (
      '<div class="modal-back" data-action="close-modal"><div class="modal' + (wide ? " is-wide" : "") + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<header class="modal-head"><h2 id="modal-title">' + H.esc(title) + '</h2><button type="button" class="icon-btn" data-action="close-modal" data-dismiss aria-label="Fechar">' + Icons.ui("close") + "</button></header>" +
      '<div class="modal-body">' + body + "</div></div></div>"
    );
  }

  function courseForm() {
    var existing = UI.modal.id ? Store.course(UI.modal.id) : null;
    var course = existing || {
      id: "",
      name: "",
      code: "",
      color: H.PALETTE[0].value,
      icon: "book",
      credits: 6,
      staff: [{ type: "TP", name: "" }, { type: "PL", name: "" }],
      rooms: [{ type: "TP", name: "" }, { type: "PL", name: "" }],
      schedule: [{ day: 1, start: "09:00", end: "11:00", type: "TP", room: "" }],
    };
    var people = course.staff && course.staff.length ? course.staff : [{ type: "TP", name: "" }, { type: "PL", name: "" }];
    var rooms = course.rooms && course.rooms.length ? course.rooms : [{ type: "TP", name: "" }, { type: "PL", name: "" }];
    var slots = course.schedule && course.schedule.length ? course.schedule : [{ day: 1, start: "09:00", end: "11:00", type: "TP", room: "" }];
    var body = (
      '<form id="form-course">' +
      field("Nome", '<input name="name" required maxlength="80" value="' + H.esc(course.name) + '" placeholder="Ex.: Bases de Dados">') +
      '<div class="form-grid">' +
      field("Sigla", '<input name="code" maxlength="8" value="' + H.esc(course.code || "") + '" placeholder="BD">') +
      field("Créditos ECTS", '<input name="credits" type="number" min="1" max="30" step="0.5" value="' + H.esc(course.credits || 6) + '">', "Ponderam a média global.") +
      "</div>" +
      '<div class="field"><span>Professores</span><div id="staff-list">' + people.map(staffRow).join("") + '</div><button type="button" class="btn btn-ghost btn-sm" data-action="add-staff">Adicionar professor</button><small class="hint">Cada um pode ser de teórica ou prática, de prática laboratorial, ou de ambas.</small></div>' +
      '<div class="field"><span>Salas</span><div id="room-list">' + rooms.map(roomRow).join("") + '</div><button type="button" class="btn btn-ghost btn-sm" data-action="add-room">Adicionar sala</button><small class="hint">Podes ter várias salas, por exemplo uma de TP e outra de PL.</small></div>' +
      field("Cor", swatches(course.color)) +
      field("Ícone", iconPicks(course.icon)) +
      '<div class="field"><span>Horário</span><div id="schedule-list">' + slots.map(scheduleRow).join("") + '</div><button type="button" class="btn btn-ghost btn-sm" data-action="add-slot">Adicionar horário</button><small class="hint">Cada horário pode ser de teórica ou prática, de prática laboratorial, ou de ambas, e tem a sua sala.</small></div>' +
      '<div class="modal-actions"><div>' + (existing ? '<button type="button" class="btn btn-danger btn-sm" data-action="ask-delete" data-entity="course" data-id="' + existing.id + '">Eliminar</button>' : "") + '</div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div></div></form>'
    );
    return shell(existing ? "Editar cadeira" : "Nova cadeira", body, true);
  }

  function dateRow(iso) {
    return (
      '<div class="date-row"><input type="date" name="extraDate" value="' + H.esc(iso || "") + '"><button type="button" class="icon-btn" data-action="remove-date" aria-label="Remover dia">' + Icons.ui("close") + "</button></div>"
    );
  }

  function taskForm() {
    var existing = UI.modal.id ? Store.state.tasks.filter(function (item) { return item.id === UI.modal.id; })[0] : null;
    if (!existing && !Store.activeCourses().length && !Store.activeProjects().length) {
      return shell("Nova " + H.term("tarefa").toLowerCase(), '<p>Cria primeiro uma ' + H.esc(H.term("cadeira").toLowerCase()) + " ou um " + H.esc(H.term("projeto").toLowerCase()) + '.</p><div class="modal-actions"><div></div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Fechar</button><button type="button" class="btn btn-primary" data-action="open-course">Nova ' + H.esc(H.term("cadeira").toLowerCase()) + '</button><button type="button" class="btn btn-ghost" data-action="open-project">Novo ' + H.esc(H.term("projeto").toLowerCase()) + "</button></div></div>");
    }
    var task = existing || {
      title: "",
      courseId: UI.modal.courseId || "",
      projectId: UI.modal.projectId || "",
      etapaId: UI.modal.etapaId || "",
      type: "trabalho",
      priority: "media",
      dueDate: UI.modal.due || H.todayISO(),
      startDate: UI.modal.due || H.todayISO(),
      dates: UI.modal.due ? [UI.modal.due] : [H.todayISO()],
      when: "unico",
      dueTime: "",
      notes: "",
      done: false,
      reminders: Store.state.settings.defaultReminders.slice(),
    };
    var checks = H.REMINDER_OPTIONS.map(function (option) {
      var on = (task.reminders || []).indexOf(option.days) >= 0;
      return '<label class="checkline"><input type="checkbox" name="reminder" value="' + option.days + '"' + (on ? " checked" : "") + "><span>" + H.esc(option.label) + "</span></label>";
    }).join("");
    var when = task.when === "periodo" || task.when === "especificos" ? task.when : "unico";
    var dates = task.dates && task.dates.length ? task.dates : [task.dueDate];
    var whenOptions = [
      { id: "unico", label: "Dia único" },
      { id: "periodo", label: "Período" },
      { id: "especificos", label: "Dias específicos" },
    ];
    var typeChoices = H.TYPES.map(function (type) { return { id: type.id, label: H.term(type.id) }; });
    var body = (
      '<form id="form-task">' +
      field("Título", '<input name="title" required maxlength="100" value="' + H.esc(task.title) + '" placeholder="Ex.: Frequência de Matemática">') +
      '<div class="form-grid">' +
      field(H.term("cadeira"), '<select name="courseId">' + courseOptions(task.courseId, true) + "</select>") +
      field(H.term("projeto"), '<select name="projectId">' + projectOptions(task.projectId, true) + "</select>") +
      "</div>" +
      '<div class="field" id="etapa-field"><span>Etapa</span><select name="etapaId">' + etapaOptions(task.projectId, task.etapaId || "") + '</select><small class="hint">As etapas criam-se ao editar o projeto. A tarefa fica só nessa etapa.</small></div>' +
      '<p class="hint">Podes ligar a uma ' + H.esc(H.term("cadeira").toLowerCase()) + ", a um " + H.esc(H.term("projeto").toLowerCase()) + ", ou às duas.</p>" +
      '<div class="field"><span>Tipo</span>' + segment("type", typeChoices, task.type) + "</div>" +
      '<div class="field"><span>Prioridade</span>' + segment("priority", H.PRIORITIES, task.priority) + "</div>" +
      '<div class="field"><span>Quando</span>' + segment("when", whenOptions, when) + '<small class="hint">Dia único, um período de um dia a outro, ou vários dias à escolha.</small></div>' +
      '<div class="when-panel' + (when === "unico" ? " is-on" : "") + '" data-when="unico">' +
      field("Dia", '<input type="date" name="dueDate" value="' + H.esc(task.dueDate) + '">') +
      "</div>" +
      '<div class="when-panel' + (when === "periodo" ? " is-on" : "") + '" data-when="periodo"><div class="form-grid">' +
      field("De", '<input type="date" name="startDate" value="' + H.esc(task.startDate || task.dueDate) + '">') +
      field("Até", '<input type="date" name="endDate" value="' + H.esc(task.dueDate) + '">') +
      "</div></div>" +
      '<div class="when-panel' + (when === "especificos" ? " is-on" : "") + '" data-when="especificos"><div class="field"><span>Dias</span><div id="date-list">' + dates.map(dateRow).join("") + '</div><button type="button" class="btn btn-ghost btn-sm" data-action="add-date">Adicionar dia</button></div></div>' +
      field("Hora", '<input type="time" name="dueTime" value="' + H.esc(task.dueTime || "") + '">', "Opcional. Sem hora, o prazo acaba no fim do dia.") +
      '<div class="field"><span>Alertas</span><div class="check-grid">' + checks + "</div></div>" +
      field("Notas", '<textarea name="notes" maxlength="500" placeholder="Detalhes, capítulos, colegas de grupo…">' + H.esc(task.notes || "") + "</textarea>") +
      '<label class="checkline"><input type="checkbox" name="done"' + (task.done ? " checked" : "") + "><span>Marcar como concluída</span></label>" +
      '<div class="modal-actions"><div>' + (existing ? '<button type="button" class="btn btn-danger btn-sm" data-action="ask-delete" data-entity="task" data-id="' + existing.id + '">Eliminar</button>' : "") + '</div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div></div></form>'
    );
    return shell(existing ? "Editar tarefa" : "Nova tarefa", body, true);
  }

  function gradeForm() {
    if (!Store.activeCourses().length && !(UI.modal.id)) {
      return shell("Registar nota", '<p>Cria uma cadeira ativa antes de registar classificações.</p><div class="modal-actions"><div></div><div class="right"><button type="button" class="btn btn-primary" data-action="open-course">Nova cadeira</button></div></div>');
    }
    var existing = UI.modal.id ? Store.state.grades.filter(function (item) { return item.id === UI.modal.id; })[0] : null;
    var grade = existing || {
      courseId: UI.modal.courseId || (Store.activeCourses()[0] ? Store.activeCourses()[0].id : ""),
      title: "",
      score: "",
      weight: "",
      date: H.todayISO(),
    };
    var body = (
      '<form id="form-grade">' +
      field("Cadeira", '<select name="courseId">' + courseOptions(grade.courseId) + "</select>") +
      field("Avaliação", '<input name="title" required maxlength="80" value="' + H.esc(grade.title) + '" placeholder="Ex.: Frequência 1">') +
      '<div class="form-grid">' +
      field("Nota (0–20)", '<input name="score" required inputmode="decimal" value="' + H.esc(grade.score === "" ? "" : String(grade.score).replace(".", ",")) + '" placeholder="14,5">') +
      field("Peso (%)", '<input name="weight" required inputmode="decimal" value="' + H.esc(grade.weight === "" ? "" : String(grade.weight).replace(".", ",")) + '" placeholder="40">', "A média usa a soma dos pesos registados.") +
      "</div>" +
      field("Data", '<input type="date" name="date" required value="' + H.esc(grade.date) + '">') +
      '<div class="modal-actions"><div>' + (existing ? '<button type="button" class="btn btn-danger btn-sm" data-action="ask-delete" data-entity="grade" data-id="' + existing.id + '">Eliminar</button>' : "") + '</div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div></div></form>'
    );
    return shell(existing ? "Editar nota" : "Registar nota", body, false);
  }

  function sessionForm() {
    if (!Store.activeCourses().length) {
      return shell("Registar estudo", '<p>Cria uma cadeira para associares o tempo de estudo.</p><div class="modal-actions"><div></div><div class="right"><button type="button" class="btn btn-primary" data-action="open-course">Nova cadeira</button></div></div>');
    }
    var courseId = UI.modal.courseId || Store.activeCourses()[0].id;
    var now = new Date();
    var nowTime = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    var body = (
      '<form id="form-session">' +
      field("Cadeira", '<select name="courseId">' + courseOptions(courseId) + "</select>") +
      field("Data", '<input type="date" name="date" required value="' + H.todayISO() + '">') +
      field("Hora", '<input type="time" name="time" required value="' + nowTime + '">', "A hora em que estudaste, para ficar no histórico.") +
      field("Duração (minutos)", '<input id="session-minutes" name="minutes" type="number" min="5" max="720" step="5" required value="60">') +
      '<div class="presets"><button type="button" data-action="set-minutes" data-minutes="30">30 min</button><button type="button" data-action="set-minutes" data-minutes="45">45 min</button><button type="button" data-action="set-minutes" data-minutes="60">1 h</button><button type="button" data-action="set-minutes" data-minutes="90">1 h 30</button><button type="button" data-action="set-minutes" data-minutes="120">2 h</button></div>' +
      '<div class="modal-actions"><div></div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Cancelar</button><button type="submit" class="btn btn-primary">Registar</button></div></div></form>'
    );
    return shell("Registar estudo", body, false);
  }

  function dayPanel() {
    var iso = UI.modal.date;
    var date = H.parseISODate(iso);
    var classes = Store.classesOn(date);
    var tasks = Store.tasksDueOn(iso);
    var classHtml = classes.length
      ? classes.map(function (block) {
        return Views.classItem(block);
      }).join("")
      : '<p class="muted">Sem aulas neste dia.</p>';
    var taskHtml = tasks.length
      ? '<div class="task-list compact">' + tasks.map(function (task) {
        var course = Store.course(task.courseId);
        return '<button type="button" class="deadline' + (H.isOverdue(task) ? " is-overdue" : "") + '" data-action="open-task" data-id="' + task.id + '"><span class="deadline-date">' + H.esc(H.typeLabel(task.type)) + "</span><strong>" + H.esc(task.title) + "</strong><small>" + H.esc(course ? course.name : "Sem cadeira") + (task.done ? " · concluída" : "") + "</small></button>";
      }).join("") + "</div>"
      : '<p class="muted">Sem testes, frequências ou entregas.</p>';
    var events = Store.eventsOn(iso);
    var eventHtml = events.length
      ? '<div class="task-list compact">' + events.map(function (event) {
        return '<button type="button" class="deadline" data-action="open-event" data-id="' + event.id + '"><span class="deadline-date">' + H.esc(event.time || H.term("evento")) + "</span><strong>" + H.esc(event.title) + "</strong><small>" + H.esc(event.place || "Sem local") + "</small></button>";
      }).join("") + "</div>"
      : '<p class="muted">Sem eventos neste dia.</p>';
    var body = (
      "<h3 class=\"subhead\">Aulas</h3>" + classHtml +
      "<h3 class=\"subhead\">" + H.esc(H.term("eventos")) + "</h3>" + eventHtml +
      "<h3 class=\"subhead\">Prazos</h3>" + taskHtml +
      '<div class="modal-actions"><div></div><div class="right"><button type="button" class="btn btn-ghost" data-action="open-event" data-due="' + iso + '">Novo ' + H.esc(H.term("evento").toLowerCase()) + '</button><button type="button" class="btn btn-primary" data-action="open-task" data-due="' + iso + '">Nova tarefa neste dia</button></div></div>'
    );
    return shell(H.formatFull(iso), body, false);
  }

  function settingsForm() {
    var settings = Store.state.settings;
    var body = (
      '<form id="form-settings">' +
      field("Nome do semestre", '<input name="semesterName" required maxlength="60" value="' + H.esc(settings.semesterName) + '">') +
      '<div class="form-grid">' +
      field("Início", '<input type="date" name="semesterStart" required value="' + H.esc(settings.semesterStart) + '">') +
      field("Fim", '<input type="date" name="semesterEnd" required value="' + H.esc(settings.semesterEnd) + '">') +
      "</div>" +
      '<p class="hint">As datas delimitam a evolução do semestre nas estatísticas.</p>' +
      '<div class="modal-actions"><div class="danger-group"><button type="button" class="btn btn-ghost btn-sm" data-action="ask-reset">Repor exemplo</button><button type="button" class="btn btn-danger btn-sm" data-action="ask-clear">Começar do zero</button></div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div></div></form>'
    );
    return shell("Semestre", body, false);
  }

  function confirmForm() {
    var modal = UI.modal;
    var title = "Confirmar";
    var text = "Queres mesmo continuar?";
    if (modal.entity === "task") {
      var task = Store.state.tasks.filter(function (item) { return item.id === modal.id; })[0];
      title = "Eliminar tarefa";
      text = task ? "Eliminar «" + task.title + "»? Esta ação não pode ser desfeita." : "Eliminar esta tarefa?";
    } else if (modal.entity === "course") {
      var course = Store.course(modal.id);
      var tasks = Store.tasksOf(modal.id).length;
      var grades = Store.gradesOf(modal.id).length;
      var sessions = Store.sessionsOf(modal.id).length;
      title = "Eliminar cadeira";
      text = "Eliminar «" + (course ? course.name : "esta cadeira") + "»? Também são removidas " + tasks + " tarefas, " + grades + " notas e " + sessions + " sessões de estudo.";
    } else if (modal.entity === "grade") {
      title = "Eliminar nota";
      text = "Eliminar esta classificação? A média da cadeira é recalculada.";
    } else if (modal.entity === "session") {
      title = "Eliminar sessão";
      text = "Eliminar este registo de estudo?";
    } else if (modal.entity === "project") {
      var project = Store.project(modal.id);
      title = "Eliminar projeto";
      text = "Eliminar «" + (project ? project.name : "este projeto") + "»? As tarefas mantêm-se, mas deixam de estar ligadas a ele.";
    } else if (modal.entity === "event") {
      var eventItem = Store.state.events.filter(function (item) { return item.id === modal.id; })[0];
      title = "Eliminar evento";
      text = eventItem ? "Eliminar «" + eventItem.title + "»?" : "Eliminar este evento?";
    } else if (modal.entity === "item") {
      var piece = Store.state.items.filter(function (item) { return item.id === modal.id; })[0];
      title = "Eliminar item";
      text = piece ? "Eliminar «" + piece.title + "»?" : "Eliminar este item?";
    } else if (modal.entity === "all") {
      title = "Começar do zero";
      text = "Eliminar cadeiras, tarefas, notas e sessões de estudo? O nome e as datas do semestre mantêm-se.";
    } else if (modal.entity === "demo") {
      title = "Repor exemplo";
      text = "Substituir os dados atuais pelo semestre de exemplo?";
    }
    var body = (
      "<p>" + H.esc(text) + "</p>" +
      '<div class="modal-actions"><div></div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Cancelar</button><button type="button" class="btn btn-danger" data-action="confirm-yes">Confirmar</button></div></div>'
    );
    return shell(title, body, false);
  }

  function etapaRow(stage) {
    stage = stage || { id: "", name: "" };
    return (
      '<div class="etapa-row"><input type="hidden" name="etapaId" value="' + H.esc(stage.id || "") + '"><input name="etapaName" maxlength="60" value="' + H.esc(stage.name || "") + '" placeholder="Ex.: Mecânica"><button type="button" class="icon-btn" data-action="remove-etapa" aria-label="Remover etapa">' + Icons.ui("close") + "</button></div>"
    );
  }

  function checkRow(item) {
    item = item || { text: "" };
    return (
      '<div class="date-row"><input name="checkText" maxlength="120" value="' + H.esc(item.text || "") + '" placeholder="Ponto da lista"><button type="button" class="icon-btn" data-action="remove-date" aria-label="Remover ponto">' + Icons.ui("close") + "</button></div>"
    );
  }

  function etapaOptions(projectId, selected) {
    var project = projectId ? Store.project(projectId) : null;
    var stages = project && project.stages ? project.stages : [];
    var html = '<option value="">Sem etapa</option>';
    stages.forEach(function (stage) {
      html += '<option value="' + H.esc(stage.id) + '"' + (stage.id === selected ? " selected" : "") + ">" + H.esc(stage.name) + "</option>";
    });
    return html;
  }

  function projectForm() {
    var existing = UI.modal.id ? Store.project(UI.modal.id) : null;
    var project = existing || { name: "", description: "", color: H.PALETTE[0].value, icon: "compass", archived: false, stages: [] };
    var stages = project.stages && project.stages.length ? project.stages : [];
    var body = (
      '<form id="form-project">' +
      field("Nome", '<input name="name" required maxlength="80" value="' + H.esc(project.name) + '" placeholder="Ex.: Protótipo">') +
      field("Descrição", '<textarea name="description" maxlength="300" placeholder="O que este projeto inclui…">' + H.esc(project.description || "") + "</textarea>") +
      '<div class="field"><span>Etapas</span><div id="etapa-list">' + stages.map(etapaRow).join("") + '</div><button type="button" class="btn btn-ghost btn-sm" data-action="add-etapa">Adicionar etapa</button><small class="hint">Por exemplo Mecânica e Eletrónica. As tarefas de cada etapa ficam só dentro dela.</small></div>' +
      field("Cor", swatches(project.color)) +
      field("Ícone", iconPicks(project.icon)) +
      '<div class="modal-actions"><div>' + (existing ? '<button type="button" class="btn btn-danger btn-sm" data-action="ask-delete" data-entity="project" data-id="' + existing.id + '">Eliminar</button>' : "") + '</div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div></div></form>'
    );
    return shell(existing ? "Editar projeto" : "Novo projeto", body, true);
  }

  function eventForm() {
    var existing = UI.modal.id ? Store.state.events.filter(function (item) { return item.id === UI.modal.id; })[0] : null;
    var eventKind = existing ? (existing.kind === "reuniao" ? "reuniao" : "evento") : (UI.modal.kind === "reuniao" ? "reuniao" : "evento");
    var eventItem = existing || { title: "", date: UI.modal.due || H.todayISO(), time: "", place: "", notes: "", courseId: "", projectId: UI.modal.projectId || "", kind: eventKind };
    var body = (
      '<form id="form-event">' +
      field("Título", '<input name="title" required maxlength="100" value="' + H.esc(eventItem.title) + '" placeholder="Ex.: Reunião de grupo">') +
      '<div class="form-grid">' +
      field("Dia", '<input type="date" name="date" required value="' + H.esc(eventItem.date) + '">') +
      field("Hora", '<input type="time" name="time" value="' + H.esc(eventItem.time || "") + '">') +
      "</div>" +
      field("Local", '<input name="place" maxlength="80" value="' + H.esc(eventItem.place || "") + '" placeholder="Ex.: Biblioteca">') +
      '<div class="form-grid">' +
      field(H.term("cadeira"), '<select name="courseId">' + courseOptions(eventItem.courseId, true) + "</select>") +
      field(H.term("projeto"), '<select name="projectId">' + projectOptions(eventItem.projectId, true) + "</select>") +
      "</div>" +
      field("Notas", '<textarea name="notes" maxlength="500">' + H.esc(eventItem.notes || "") + "</textarea>") +
      '<div class="modal-actions"><div>' + (existing ? '<button type="button" class="btn btn-ghost btn-sm" data-action="archive-event" data-id="' + existing.id + '">Arquivar</button><button type="button" class="btn btn-danger btn-sm" data-action="ask-delete" data-entity="event" data-id="' + existing.id + '">Eliminar</button>' : "") + '</div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div></div></form>'
    );
    var eventTitle = eventKind === "reuniao" ? (existing ? "Editar reunião" : "Nova reunião") : (existing ? "Editar evento" : "Novo evento");
    return shell(eventTitle, body, true);
  }

  function archiveForm() {
    var task = Store.state.tasks.filter(function (item) { return item.id === UI.modal.id; })[0];
    if (!task) return "";
    var course = task.courseId ? Store.course(task.courseId) : null;
    var gradeFields = course
      ? '<div class="form-grid">' + field("Nota", '<input name="score" inputmode="decimal" placeholder="0–20">', "Opcional.") + field("Peso", '<input name="weight" inputmode="decimal" placeholder="%">', "Obrigatório se houver nota.") + "</div><p class=\"hint\">A nota entra na média de " + H.esc(course.name) + ".</p>"
      : "<p>Esta tarefa não tem cadeira, por isso fica arquivada sem nota.</p>";
    var body = (
      '<form id="form-archive"><p>Arquivar «' + H.esc(task.title) + "»? Deixa de aparecer nas listas ativas.</p>" + gradeFields +
      '<div class="modal-actions"><div></div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Cancelar</button><button type="submit" class="btn btn-primary">Arquivar</button></div></div></form>'
    );
    return shell("Arquivar tarefa", body, false);
  }

  function itemPicker() {
    var buttons = H.ITEM_KINDS.map(function (kind) {
      return '<button type="button" class="kind-btn" data-action="pick-item" data-kind="' + kind.id + '">' + H.esc(kind.label) + "</button>";
    }).join("");
    return shell("Adicionar item", '<p class="hint">Escolhe o que queres guardar neste projeto.</p><div class="kind-grid">' + buttons + "</div>", false);
  }

  function itemForm() {
    var existing = UI.modal.id ? Store.state.items.filter(function (item) { return item.id === UI.modal.id; })[0] : null;
    var kind = existing ? existing.kind : UI.modal.kind;
    var item = existing || { title: "", body: "", url: "", score: "", items: [{ text: "" }], fileName: "" };
    var label = (H.ITEM_KINDS.filter(function (entry) { return entry.id === kind; })[0] || { label: "Item" }).label;
    var extra = "";
    if (kind === "nota") {
      extra = field("Nota", '<input name="score" inputmode="decimal" value="' + H.esc(item.score == null ? "" : String(item.score).replace(".", ",")) + '" placeholder="0–20">') +
        field("Comentário", '<textarea name="body" maxlength="1000">' + H.esc(item.body || "") + "</textarea>");
    } else if (kind === "checklist") {
      var rows = item.items && item.items.length ? item.items : [{ text: "" }];
      extra = '<div class="field"><span>Pontos</span><div id="check-list">' + rows.map(checkRow).join("") + '</div><button type="button" class="btn btn-ghost btn-sm" data-action="add-check">Adicionar ponto</button></div>';
    } else if (kind === "link") {
      extra = field("Endereço", '<input name="url" type="url" required maxlength="400" value="' + H.esc(item.url || "") + '" placeholder="https://">') +
        field("Nota", '<textarea name="body" maxlength="500">' + H.esc(item.body || "") + "</textarea>");
    } else if (kind === "documento") {
      extra = field("Ficheiro", '<input name="file" type="file">', item.fileName ? "Atual: " + item.fileName + ". Até 400 KB. Deixa vazio para manter o ficheiro." : "Opcional. Até 400 KB, fica guardado neste computador.") +
        field("Notas", '<textarea name="body" maxlength="1000">' + H.esc(item.body || "") + "</textarea>");
    } else {
      extra = field(kind === "decisao" ? "Decisão" : "Texto", '<textarea name="body" maxlength="2000">' + H.esc(item.body || "") + "</textarea>");
    }
    var body = (
      '<form id="form-item">' +
      field("Título", '<input name="title" required maxlength="120" value="' + H.esc(item.title || "") + '">') +
      extra +
      '<div class="modal-actions"><div>' + (existing ? '<button type="button" class="btn btn-ghost btn-sm" data-action="archive-item" data-id="' + existing.id + '">Arquivar</button><button type="button" class="btn btn-danger btn-sm" data-action="ask-delete" data-entity="item" data-id="' + existing.id + '">Eliminar</button>' : "") + '</div><div class="right"><button type="button" class="btn btn-ghost" data-action="close-modal" data-dismiss>Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div></div></form>'
    );
    return shell((existing ? "Editar " : "Nova ") + label.toLowerCase(), body, true);
  }

  function render() {
    var modal = UI.modal;
    if (!modal) return "";
    if (modal.type === "course") return courseForm();
    if (modal.type === "task") return taskForm();
    if (modal.type === "project") return projectForm();
    if (modal.type === "item-picker") return itemPicker();
    if (modal.type === "item") return itemForm();
    if (modal.type === "event") return eventForm();
    if (modal.type === "archive") return archiveForm();
    if (modal.type === "grade") return gradeForm();
    if (modal.type === "session") return sessionForm();
    if (modal.type === "day") return dayPanel();
    if (modal.type === "settings") return settingsForm();
    if (modal.type === "confirm") return confirmForm();
    return "";
  }

  window.Modals = { render: render, scheduleRow: scheduleRow, staffRow: staffRow, roomRow: roomRow, dateRow: dateRow, etapaRow: etapaRow, checkRow: checkRow, etapaOptions: etapaOptions };
})();
