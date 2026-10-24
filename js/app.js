(function () {
  var HASH = {
    dashboard: "painel",
    courses: "cadeiras",
    projects: "projetos",
    tasks: "tarefas",
    calendar: "calendario",
    grades: "notas",
    stats: "estatisticas",
    study: "estudo",
    reminders: "lembretes",
    archive: "arquivo",
    customize: "personalizar",
  };
  var FROM_HASH = {};
  Object.keys(HASH).forEach(function (key) { FROM_HASH[HASH[key]] = key; });

  function pageTitle(view) {
    var titles = {
      dashboard: "Painel",
      courses: H.term("cadeiras"),
      projects: H.term("projetos"),
      tasks: H.term("tarefas"),
      calendar: "Calendário",
      grades: "Notas",
      stats: "Estatísticas",
      study: "Estudo",
      reminders: "Lembretes",
      archive: H.term("arquivo"),
      customize: "Personalizar",
    };
    if (view === "project") {
      var current = Store.project(UI.projectId);
      return current ? current.name : H.term("projeto");
    }
    return titles[view] || "Painel";
  }

  function applyHash() {
    var raw = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (raw.indexOf("projeto/") === 0) {
      UI.view = "project";
      UI.projectId = raw.slice("projeto/".length);
      return true;
    }
    UI.view = FROM_HASH[raw] || "dashboard";
    return Boolean(FROM_HASH[raw]);
  }

  window.UI = {
    view: "dashboard",
    modal: null,
    returnModal: null,
    focusModal: false,
    taskFilter: { status: "pendentes", courseId: "all", projectId: "all", priority: "all", type: "all", q: "" },
    taskLayout: "list",
    projectId: "",
    projectFilter: "tudo",
    statsPeriod: "semestre",
    calMode: "month",
    calDate: new Date(),
  };

  var toastTimer = 0;

  function toast(message) {
    var el = document.getElementById("toast");
    el.textContent = message;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-on"); }, 2600);
  }

  function render() {
    var active = document.activeElement;
    var searchFocus = active && active.id === "task-search";
    var selection = searchFocus ? active.selectionStart : null;
    var view = Views[UI.view] ? UI.view : "dashboard";
    UI.view = view;
    document.getElementById("view").innerHTML = Views[view]();
    document.getElementById("modal-root").innerHTML = Modals.render();
    document.body.classList.toggle("modal-open", Boolean(UI.modal));

    document.querySelectorAll(".nav-item").forEach(function (button) {
      var on = button.dataset.view === (view === "project" ? "projects" : view);
      button.classList.toggle("is-active", on);
      if (on) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
      var label = button.querySelector(".nav-label");
      if (label) label.textContent = pageTitle(button.dataset.view);
    });

    var settings = Store.state.settings;
    document.getElementById("side-semester").textContent = settings.semesterName;
    document.getElementById("side-range").textContent = H.formatShort(settings.semesterStart) + " — " + H.formatShort(settings.semesterEnd);

    var alerts = Store.alertCount();
    ["nav-alert-count", "bell-count"].forEach(function (id) {
      var badge = document.getElementById(id);
      badge.hidden = alerts === 0;
      badge.textContent = alerts > 9 ? "9+" : String(alerts);
    });

    var switcher = document.getElementById("layout-switch");
    if (switcher) {
      switcher.hidden = view !== "tasks";
      switcher.querySelectorAll("button").forEach(function (button) {
        var on = button.dataset.layout === UI.taskLayout;
        button.classList.toggle("is-selected", on);
        if (on) button.setAttribute("aria-pressed", "true");
        else button.setAttribute("aria-pressed", "false");
      });
    }

    var overdue = Store.overdueTasks().length;
    document.title = (overdue ? "(" + overdue + ") " : "") + pageTitle(view) + " · TriBalance";

    if (searchFocus) {
      var input = document.getElementById("task-search");
      if (input) {
        input.focus();
        var pos = typeof selection === "number" ? selection : input.value.length;
        input.setSelectionRange(pos, pos);
      }
    } else if (UI.focusModal) {
      var focusable = document.querySelector(".modal input, .modal select, .modal textarea, .modal button");
      if (focusable) focusable.focus();
      UI.focusModal = false;
    }
  }

  function setView(view) {
    var next = "#" + (HASH[view] || "painel");
    if (location.hash !== next) location.hash = next;
    else {
      UI.view = FROM_HASH[next.slice(1)] || "dashboard";
      render();
    }
  }

  function openModal(modal) {
    UI.returnModal = null;
    UI.modal = modal;
    UI.focusModal = true;
    render();
  }

  function closeModal() {
    if (UI.modal && UI.modal.type === "confirm" && UI.returnModal) {
      UI.modal = UI.returnModal;
      UI.returnModal = null;
      UI.focusModal = true;
    } else {
      UI.modal = null;
      UI.returnModal = null;
    }
    render();
  }

  function askConfirm(entity, id) {
    UI.returnModal = UI.modal && UI.modal.type !== "confirm" ? UI.modal : UI.returnModal;
    UI.modal = { type: "confirm", entity: entity, id: id || "" };
    UI.focusModal = true;
    render();
  }

  function val(form, name) {
    return form.elements[name] ? form.elements[name].value : "";
  }

  function readSegment(form, name) {
    var group = form.querySelector('[data-segment="' + name + '"]');
    var selected = group && group.querySelector(".is-selected");
    return selected ? selected.dataset.value : "";
  }

  function saveCourse(form) {
    var name = val(form, "name").trim();
    if (!name) return toast("Indica o nome da cadeira.");
    var credits = H.readNumber(val(form, "credits"));
    if (!(credits > 0) || credits > 30) return toast("Os créditos devem estar entre 1 e 30.");
    var slots = [];
    var rows = form.querySelectorAll(".schedule-row");
    for (var i = 0; i < rows.length; i++) {
      var start = rows[i].querySelector('[name="start"]').value;
      var end = rows[i].querySelector('[name="end"]').value;
      var day = Number(rows[i].querySelector('[name="day"]').value);
      var slotType = H.classTypeId(rows[i].querySelector('[name="slotType"]').value);
      var room = rows[i].querySelector('[name="slotRoom"]').value.trim();
      if (!start && !end && !room) continue;
      if (!start || !end || start >= end) return toast("Cada horário precisa de uma hora de fim depois do início.");
      slots.push({ day: day, start: start, end: end, type: slotType, room: room });
    }
    var staff = [];
    var staffRows = form.querySelectorAll(".staff-row");
    for (var s = 0; s < staffRows.length; s++) {
      var staffName = staffRows[s].querySelector('[name="staffName"]').value.trim();
      if (!staffName) continue;
      staff.push({
        type: H.classTypeId(staffRows[s].querySelector('[name="staffType"]').value),
        name: staffName,
      });
    }
    var rooms = [];
    var roomRows = form.querySelectorAll(".room-row");
    for (var r = 0; r < roomRows.length; r++) {
      var roomName = roomRows[r].querySelector('[name="roomName"]').value.trim();
      if (!roomName) continue;
      rooms.push({
        type: H.classTypeId(roomRows[r].querySelector('[name="roomType"]').value),
        name: roomName,
      });
    }
    var colorBtn = form.querySelector(".swatch.is-selected");
    var iconBtn = form.querySelector(".icon-opt.is-selected");
    var previous = UI.modal && UI.modal.id ? Store.course(UI.modal.id) : null;
    Store.saveCourse({
      id: (UI.modal && UI.modal.id) || H.uid(),
      name: name,
      code: val(form, "code").trim().toUpperCase(),
      color: colorBtn ? colorBtn.dataset.color : H.PALETTE[0].value,
      icon: iconBtn ? iconBtn.dataset.icon : "book",
      credits: credits,
      staff: staff,
      rooms: rooms,
      schedule: slots,
      archived: previous ? Boolean(previous.archived) : false,
    });
    UI.modal = null;
    UI.returnModal = null;
    toast("Cadeira guardada.");
    render();
  }

  function saveTask(form) {
    var title = val(form, "title").trim();
    if (!title) return toast("Indica o título da tarefa.");
    var courseId = val(form, "courseId");
    var projectId = val(form, "projectId");
    if (!courseId && !projectId) return toast("Liga a tarefa a uma " + H.term("cadeira").toLowerCase() + " ou a um " + H.term("projeto").toLowerCase() + ".");
    var existing = UI.modal && UI.modal.id
      ? Store.state.tasks.filter(function (item) { return item.id === UI.modal.id; })[0]
      : null;
    var done = Boolean(form.elements.done && form.elements.done.checked);
    var reminders = Array.prototype.map.call(form.querySelectorAll('input[name="reminder"]:checked'), function (input) {
      return Number(input.value);
    });
    var when = readSegment(form, "when") || "unico";
    var dueDate = "";
    var startDate = "";
    var dates = [];
    if (when === "periodo") {
      startDate = val(form, "startDate");
      dueDate = val(form, "endDate");
      if (!startDate || !dueDate) return toast("Indica o primeiro e o último dia do período.");
      if (startDate > dueDate) return toast("O período tem de acabar no próprio dia ou depois.");
      if (H.daysBetween(startDate, dueDate) > 180) return toast("O período pode ter no máximo 180 dias.");
    } else if (when === "especificos") {
      var dateInputs = form.querySelectorAll('[name="extraDate"]');
      for (var d = 0; d < dateInputs.length; d++) {
        var day = dateInputs[d].value;
        if (day && dates.indexOf(day) < 0) dates.push(day);
      }
      dates.sort();
      if (!dates.length) return toast("Escolhe pelo menos um dia.");
      startDate = dates[0];
      dueDate = dates[dates.length - 1];
    } else {
      when = "unico";
      dueDate = val(form, "dueDate");
      if (!dueDate) return toast("Indica o dia da tarefa.");
      startDate = dueDate;
    }
    Store.saveTask({
      id: existing ? existing.id : H.uid(),
      title: title,
      courseId: courseId,
      projectId: projectId,
      type: readSegment(form, "type") || "trabalho",
      priority: readSegment(form, "priority") || "media",
      when: when,
      dueDate: dueDate,
      startDate: startDate,
      dates: dates,
      dueTime: val(form, "dueTime"),
      notes: val(form, "notes").trim(),
      etapaId: (function () {
        var etapaId = val(form, "etapaId");
        var owner = Store.project(projectId);
        if (!owner || !(owner.stages || []).some(function (stage) { return stage.id === etapaId; })) return "";
        return etapaId;
      })(),
      stage: done ? "feita" : (existing && existing.stage === "curso" ? "curso" : "fazer"),
      done: done,
      doneAt: done ? ((existing && existing.doneAt) || H.todayISO()) : null,
      reminders: reminders,
      archived: existing ? Boolean(existing.archived) : false,
      archiveGradeId: existing ? existing.archiveGradeId || "" : "",
    });
    UI.modal = null;
    UI.returnModal = null;
    toast(done ? "Tarefa concluída." : "Tarefa guardada.");
    render();
  }

  function saveProject(form) {
    var name = val(form, "name").trim();
    if (!name) return toast("Indica o nome do projeto.");
    var existing = UI.modal && UI.modal.id ? Store.project(UI.modal.id) : null;
    var colorBtn = form.querySelector(".swatch.is-selected");
    var iconBtn = form.querySelector(".icon-opt.is-selected");
    var idInputs = form.querySelectorAll('[name="etapaId"]');
    var nameInputs = form.querySelectorAll('[name="etapaName"]');
    var stages = [];
    for (var i = 0; i < nameInputs.length; i++) {
      var stageName = nameInputs[i].value.trim();
      if (!stageName) continue;
      stages.push({ id: (idInputs[i] && idInputs[i].value) || H.uid(), name: stageName });
    }
    var projectId = existing ? existing.id : H.uid();
    Store.saveProject({
      id: projectId,
      name: name,
      description: val(form, "description").trim(),
      color: colorBtn ? colorBtn.dataset.color : H.PALETTE[0].value,
      icon: iconBtn ? iconBtn.dataset.icon : "compass",
      archived: existing ? Boolean(existing.archived) : false,
      stages: stages,
    });
    Store.state.tasks.forEach(function (task) {
      if (task.projectId !== projectId || !task.etapaId) return;
      if (!stages.some(function (stage) { return stage.id === task.etapaId; })) task.etapaId = "";
    });
    Store.updateSettings({});
    UI.modal = null;
    UI.returnModal = null;
    toast("Projeto guardado.");
    render();
  }

  function saveEvent(form) {
    var title = val(form, "title").trim();
    var date = val(form, "date");
    if (!title) return toast("Indica o título do evento.");
    if (!date) return toast("Indica o dia do evento.");
    var existing = UI.modal && UI.modal.id
      ? Store.state.events.filter(function (item) { return item.id === UI.modal.id; })[0]
      : null;
    var kind = existing ? (existing.kind === "reuniao" ? "reuniao" : "evento") : (UI.modal && UI.modal.kind === "reuniao" ? "reuniao" : "evento");
    Store.saveEvent({
      id: existing ? existing.id : H.uid(),
      title: title,
      date: date,
      time: val(form, "time"),
      place: val(form, "place").trim(),
      notes: val(form, "notes").trim(),
      courseId: val(form, "courseId"),
      projectId: val(form, "projectId"),
      kind: kind,
      archived: existing ? Boolean(existing.archived) : false,
    });
    UI.modal = null;
    UI.returnModal = null;
    toast(kind === "reuniao" ? "Reunião guardada." : "Evento guardado.");
    render();
  }

  function saveItem(form) {
    var title = val(form, "title").trim();
    if (!title) return toast("Indica o título.");
    var existing = UI.modal && UI.modal.id
      ? Store.state.items.filter(function (item) { return item.id === UI.modal.id; })[0]
      : null;
    var kind = existing ? existing.kind : (UI.modal.kind || "notas");
    var score = null;
    if (kind === "nota" && val(form, "score").trim()) {
      score = H.readNumber(val(form, "score"));
      if (Number.isNaN(score) || score < 0 || score > 20) return toast("A nota tem de estar entre 0 e 20.");
    }
    var checks = [];
    if (kind === "checklist") {
      form.querySelectorAll('[name="checkText"]').forEach(function (input) {
        var text = input.value.trim();
        if (text) checks.push({ id: H.uid(), text: text, done: false });
      });
      if (existing) {
        checks = checks.map(function (entry, index) {
          var previous = existing.items[index];
          return { id: previous ? previous.id : entry.id, text: entry.text, done: previous ? previous.done : false };
        });
      }
      if (!checks.length) return toast("Adiciona pelo menos um ponto.");
    }
    if (kind === "link") {
      var url = val(form, "url").trim();
      if (!url) return toast("Indica o endereço.");
    }
    var file = form.elements.file && form.elements.file.files ? form.elements.file.files[0] : null;
    if (file && file.size > 400000) return toast("O documento pode ter no máximo 400 KB.");
    function finish(fileName, fileData) {
      Store.saveItem({
        id: existing ? existing.id : H.uid(),
        projectId: (existing && existing.projectId) || UI.modal.projectId || UI.projectId,
        kind: kind,
        title: title,
        body: val(form, "body").trim(),
        url: kind === "link" ? val(form, "url").trim() : "",
        score: score,
        items: checks,
        fileName: fileName || "",
        fileData: fileData || "",
        archived: existing ? Boolean(existing.archived) : false,
      });
      UI.modal = null;
      UI.returnModal = null;
      toast("Item guardado.");
      render();
    }
    if (file) {
      var reader = new FileReader();
      reader.onload = function () { finish(file.name, String(reader.result || "")); };
      reader.onerror = function () { toast("Não foi possível ler o documento."); };
      reader.readAsDataURL(file);
      return;
    }
    finish(existing ? existing.fileName : "", existing ? existing.fileData : "");
  }

  function saveArchive(form) {
    var task = UI.modal && UI.modal.id
      ? Store.state.tasks.filter(function (item) { return item.id === UI.modal.id; })[0]
      : null;
    if (!task) return closeModal();
    var scoreRaw = val(form, "score").trim();
    var weightRaw = val(form, "weight").trim();
    var grade = null;
    if (scoreRaw || weightRaw) {
      if (!task.courseId) return toast("Sem cadeira, a tarefa arquiva-se sem nota.");
      var score = H.readNumber(scoreRaw);
      var weight = H.readNumber(weightRaw);
      if (Number.isNaN(score) || score < 0 || score > 20) return toast("A nota tem de estar entre 0 e 20.");
      if (Number.isNaN(weight) || weight <= 0 || weight > 100) return toast("O peso tem de estar entre 1 e 100.");
      grade = { title: task.title, score: score, weight: weight };
    }
    Store.archiveTask(task.id, grade);
    UI.modal = null;
    UI.returnModal = null;
    toast(grade ? "Tarefa arquivada com nota." : "Tarefa arquivada.");
    render();
  }

  function saveLabels(form) {
    var labels = {};
    H.TERMS.forEach(function (term) {
      var value = val(form, "term-" + term.id).trim();
      if (value) labels[term.id] = value;
    });
    Store.updateSettings({ labels: labels });
    toast("Nomes atualizados.");
    render();
  }

  function saveGrade(form) {
    var title = val(form, "title").trim();
    if (!title) return toast("Indica o nome da avaliação.");
    var score = H.readNumber(val(form, "score"));
    var weight = H.readNumber(val(form, "weight"));
    if (Number.isNaN(score) || score < 0 || score > 20) return toast("A nota tem de estar entre 0 e 20.");
    if (Number.isNaN(weight) || weight <= 0 || weight > 100) return toast("O peso tem de estar entre 1 e 100.");
    var courseId = val(form, "courseId");
    var existing = UI.modal && UI.modal.id
      ? Store.state.grades.filter(function (item) { return item.id === UI.modal.id; })[0]
      : null;
    Store.saveGrade({
      id: existing ? existing.id : H.uid(),
      courseId: courseId,
      title: title,
      score: score,
      weight: weight,
      date: val(form, "date") || H.todayISO(),
    });
    var sum = Store.weightSum(courseId);
    UI.modal = null;
    UI.returnModal = null;
    toast(sum > 100 ? "Nota guardada. Os pesos desta cadeira passam de 100%." : "Nota guardada.");
    render();
  }

  function saveSession(form) {
    var minutes = H.readNumber(val(form, "minutes"));
    var time = val(form, "time");
    if (Number.isNaN(minutes) || minutes < 5 || minutes > 720) return toast("A duração deve estar entre 5 minutos e 12 horas.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return toast("Indica a hora do estudo.");
    Store.saveSession({
      id: H.uid(),
      courseId: val(form, "courseId"),
      date: val(form, "date") || H.todayISO(),
      time: time,
      minutes: Math.round(minutes),
    });
    UI.modal = null;
    toast("Sessão registada.");
    render();
  }

  function saveSettings(form) {
    var start = val(form, "semesterStart");
    var end = val(form, "semesterEnd");
    var name = val(form, "semesterName").trim();
    if (!name) return toast("Indica o nome do semestre.");
    if (!start || !end || end < start) return toast("A data de fim tem de ser depois do início.");
    Store.updateSettings({ semesterName: name, semesterStart: start, semesterEnd: end });
    UI.modal = null;
    toast("Semestre atualizado.");
    render();
  }

  function confirmYes() {
    var modal = UI.modal || {};
    if (modal.entity === "task") {
      Store.deleteTask(modal.id);
      toast("Tarefa eliminada.");
    } else if (modal.entity === "course") {
      Store.deleteCourse(modal.id);
      toast("Cadeira eliminada.");
    } else if (modal.entity === "grade") {
      Store.deleteGrade(modal.id);
      toast("Nota eliminada.");
    } else if (modal.entity === "session") {
      Store.deleteSession(modal.id);
      toast("Sessão eliminada.");
    } else if (modal.entity === "project") {
      var removedProject = modal.id;
      Store.deleteProject(removedProject);
      toast("Projeto eliminado.");
      UI.modal = null;
      UI.returnModal = null;
      if (UI.view === "project" && UI.projectId === removedProject) {
        setView("projects");
        return;
      }
    } else if (modal.entity === "item") {
      Store.deleteItem(modal.id);
      toast("Item eliminado.");
    } else if (modal.entity === "event") {
      Store.deleteEvent(modal.id);
      toast("Evento eliminado.");
    } else if (modal.entity === "all") {
      Store.clearAll();
      toast("Dados apagados.");
    } else if (modal.entity === "demo") {
      Store.resetDemo();
      toast("Exemplo reposto.");
    }
    UI.modal = null;
    UI.returnModal = null;
    render();
  }

  function enableNotifications() {
    if (!("Notification" in window)) {
      toast("Este browser não suporta notificações.");
      return;
    }
    if (Notification.permission === "denied") {
      toast("As notificações estão bloqueadas nas definições do browser.");
      return;
    }
    var done = function (granted) {
      Store.updateSettings({ notificationsEnabled: granted });
      if (granted) {
        scanNotifications();
        toast("Notificações ativas.");
      } else toast("Permissão não concedida.");
      render();
    };
    if (Notification.permission === "granted") {
      done(true);
      return;
    }
    Notification.requestPermission().then(function (result) { done(result === "granted"); });
  }

  function scanNotifications() {
    var settings = Store.state.settings;
    if (!settings.notificationsEnabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    var today = H.todayISO();
    var fired = {};
    try { fired = JSON.parse(localStorage.getItem(Store.firedKey) || "{}"); } catch (err) { fired = {}; }
    var active = Store.activeReminders();
    active.forEach(function (task) {
      var key = today + ":" + task.id;
      if (fired[key]) return;
      fired[key] = true;
      var course = Store.course(task.courseId);
      try {
        new Notification("Prazo: " + task.title, {
          body: (course ? course.name + " · " : "") + H.relativeDue(task),
        });
      } catch (err) { /* o browser pode recusar a notificação */ }
    });
    var overdue = Store.overdueTasks();
    if (overdue.length && !fired[today + ":overdue"]) {
      fired[today + ":overdue"] = true;
      try {
        new Notification("Tarefas atrasadas", {
          body: overdue.length + (overdue.length === 1 ? " tarefa continua por concluir." : " tarefas continuam por concluir."),
        });
      } catch (err) { /* ignore */ }
    }
    var keep = {};
    Object.keys(fired).forEach(function (key) {
      if (key.indexOf(today) === 0) keep[key] = true;
    });
    localStorage.setItem(Store.firedKey, JSON.stringify(keep));
  }

  document.addEventListener("click", function (event) {
    var el = event.target.closest("[data-action]");
    if (!el) return;
    if (event.target.closest(".modal") && !el.closest(".modal")) return;
    var action = el.dataset.action;

    if (action === "close-modal") {
      if (event.target.closest(".modal") && !el.hasAttribute("data-dismiss")) return;
      closeModal();
      return;
    }
    if (action === "nav") {
      document.body.classList.remove("nav-open");
      UI.modal = null;
      UI.returnModal = null;
      setView(el.dataset.view);
      return;
    }
    if (action === "menu") {
      document.body.classList.toggle("nav-open");
      return;
    }
    if (action === "close-sidebar") {
      document.body.classList.remove("nav-open");
      return;
    }
    if (action === "open-course") {
      openModal({ type: "course", id: el.dataset.id || "" });
      return;
    }
    if (action === "open-task") {
      openModal({ type: "task", id: el.dataset.id || "", due: el.dataset.due || "", courseId: el.dataset.course || "", projectId: el.dataset.project || "", etapaId: el.dataset.etapa || "" });
      return;
    }
    if (action === "open-project-view") {
      var projectHash = "#projeto/" + encodeURIComponent(el.dataset.id || "");
      if (location.hash !== projectHash) location.hash = projectHash;
      else applyHash();
      render();
      return;
    }
    if (action === "open-item-picker") {
      openModal({ type: "item-picker", projectId: el.dataset.project || UI.projectId });
      return;
    }
    if (action === "pick-item") {
      var picked = el.dataset.kind;
      var projectForItem = UI.modal && UI.modal.projectId ? UI.modal.projectId : UI.projectId;
      if (picked === "tarefa") {
        openModal({ type: "task", projectId: projectForItem });
        return;
      }
      if (picked === "evento" || picked === "reuniao") {
        openModal({ type: "event", projectId: projectForItem, kind: picked });
        return;
      }
      openModal({ type: "item", projectId: projectForItem, kind: picked });
      return;
    }
    if (action === "open-item") {
      openModal({ type: "item", id: el.dataset.id || "" });
      return;
    }
    if (action === "project-filter") {
      UI.projectFilter = el.dataset.filter || "tudo";
      render();
      return;
    }
    if (action === "stats-period") {
      UI.statsPeriod = el.dataset.period || "semestre";
      render();
      return;
    }
    if (action === "toggle-check") {
      Store.toggleCheck(el.dataset.item, el.dataset.check);
      render();
      return;
    }
    if (action === "archive-item") {
      Store.archiveItem(el.dataset.id, true);
      toast("Item arquivado.");
      closeModal();
      return;
    }
    if (action === "add-etapa") {
      var etapaList = document.getElementById("etapa-list");
      if (etapaList) etapaList.insertAdjacentHTML("beforeend", Modals.etapaRow({ id: "", name: "" }));
      return;
    }
    if (action === "remove-etapa") {
      var etapaRow = el.closest(".etapa-row");
      if (etapaRow) etapaRow.remove();
      return;
    }
    if (action === "add-check") {
      var checkList = document.getElementById("check-list");
      if (checkList) checkList.insertAdjacentHTML("beforeend", Modals.checkRow({ text: "" }));
      return;
    }
    if (action === "open-project") {
      openModal({ type: "project", id: el.dataset.id || "" });
      return;
    }
    if (action === "open-event") {
      openModal({ type: "event", id: el.dataset.id || "", due: el.dataset.due || "" });
      return;
    }
    if (action === "open-archive") {
      openModal({ type: "archive", id: el.dataset.id || "" });
      return;
    }
    if (action === "archive-course") {
      Store.archiveCourse(el.dataset.id, true);
      toast("Cadeira arquivada.");
      render();
      return;
    }
    if (action === "archive-project") {
      Store.archiveProject(el.dataset.id, true);
      toast("Projeto arquivado.");
      if (UI.view === "project" && UI.projectId === el.dataset.id) setView("projects");
      else render();
      return;
    }
    if (action === "archive-event") {
      Store.archiveEvent(el.dataset.id, true);
      toast("Evento arquivado.");
      closeModal();
      return;
    }
    if (action === "restore") {
      Store.restore(el.dataset.entity, el.dataset.id);
      toast("Reposto na lista ativa.");
      render();
      return;
    }
    if (action === "reset-labels") {
      Store.updateSettings({ labels: {} });
      toast("Nomes originais repostos.");
      render();
      return;
    }
    if (action === "open-grade") {
      openModal({ type: "grade", id: el.dataset.id || "", courseId: el.dataset.course || "" });
      return;
    }
    if (action === "open-session") {
      openModal({ type: "session", courseId: el.dataset.course || "" });
      return;
    }
    if (action === "open-day") {
      openModal({ type: "day", date: el.dataset.date });
      return;
    }
    if (action === "open-settings") {
      openModal({ type: "settings" });
      return;
    }
    if (action === "ask-delete") {
      askConfirm(el.dataset.entity, el.dataset.id);
      return;
    }
    if (action === "ask-clear") {
      askConfirm("all");
      return;
    }
    if (action === "ask-reset") {
      askConfirm("demo");
      return;
    }
    if (action === "confirm-yes") {
      confirmYes();
      return;
    }
    if (action === "task-layout") {
      UI.taskLayout = el.dataset.layout === "kanban" ? "kanban" : "list";
      render();
      return;
    }
    if (action === "toggle-task") {
      var toggled = Store.toggleTask(el.dataset.id);
      if (toggled) toast(toggled.done ? "Tarefa concluída." : "Tarefa reaberta.");
      render();
      return;
    }
    if (action === "show-overdue") {
      UI.taskFilter = { status: "atrasadas", courseId: "all", projectId: "all", priority: "all", type: "all", q: "" };
      setView("tasks");
      return;
    }
    if (action === "dismiss-demo") {
      Store.updateSettings({ hideDemoNote: true });
      render();
      return;
    }
    if (action === "enable-notifications") {
      enableNotifications();
      return;
    }
    if (action === "cal-mode") {
      UI.calMode = el.dataset.mode === "week" ? "week" : "month";
      render();
      return;
    }
    if (action === "cal-prev" || action === "cal-next") {
      var step = action === "cal-prev" ? -1 : 1;
      if (UI.calMode === "week") UI.calDate = H.addDays(UI.calDate, step * 7);
      else UI.calDate = new Date(UI.calDate.getFullYear(), UI.calDate.getMonth() + step, 1);
      render();
      return;
    }
    if (action === "cal-today") {
      UI.calDate = new Date();
      render();
      return;
    }
    if (action === "segment") {
      var group = el.closest(".segment");
      if (!group) return;
      group.querySelectorAll("button").forEach(function (button) { button.classList.remove("is-selected"); });
      el.classList.add("is-selected");
      if (group.dataset.segment === "when") {
        document.querySelectorAll(".when-panel").forEach(function (panel) {
          panel.classList.toggle("is-on", panel.dataset.when === el.dataset.value);
        });
      }
      return;
    }
    if (action === "pick-color" || action === "pick-icon") {
      var parent = el.parentElement;
      parent.querySelectorAll("button").forEach(function (button) { button.classList.remove("is-selected"); });
      el.classList.add("is-selected");
      return;
    }
    if (action === "add-slot") {
      var list = document.getElementById("schedule-list");
      if (list) list.insertAdjacentHTML("beforeend", Modals.scheduleRow({ day: 1, start: "09:00", end: "11:00", type: "PL", room: "" }));
      return;
    }
    if (action === "remove-slot") {
      var row = el.closest(".schedule-row");
      if (row) row.remove();
      return;
    }
    if (action === "add-staff") {
      var staffList = document.getElementById("staff-list");
      if (staffList) staffList.insertAdjacentHTML("beforeend", Modals.staffRow({ type: "PL", name: "" }));
      return;
    }
    if (action === "remove-staff") {
      var staffRow = el.closest(".staff-row");
      if (staffRow) staffRow.remove();
      return;
    }
    if (action === "add-room") {
      var roomList = document.getElementById("room-list");
      if (roomList) roomList.insertAdjacentHTML("beforeend", Modals.roomRow({ type: "PL", name: "" }));
      return;
    }
    if (action === "remove-room") {
      var roomRow = el.closest(".room-row");
      if (roomRow) roomRow.remove();
      return;
    }
    if (action === "add-date") {
      var dateList = document.getElementById("date-list");
      if (dateList) dateList.insertAdjacentHTML("beforeend", Modals.dateRow(""));
      return;
    }
    if (action === "remove-date") {
      var dateRow = el.closest(".date-row");
      if (dateRow) dateRow.remove();
      return;
    }
    if (action === "set-minutes") {
      var minutes = document.getElementById("session-minutes");
      if (minutes) minutes.value = el.dataset.minutes;
      return;
    }
  });

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !form.id) return;
    if (form.id === "form-course" || form.id === "form-task" || form.id === "form-grade" || form.id === "form-session" || form.id === "form-settings" || form.id === "form-project" || form.id === "form-event" || form.id === "form-archive" || form.id === "form-labels" || form.id === "form-item") {
      event.preventDefault();
    }
    if (form.id === "form-course") saveCourse(form);
    if (form.id === "form-task") saveTask(form);
    if (form.id === "form-project") saveProject(form);
    if (form.id === "form-event") saveEvent(form);
    if (form.id === "form-item") saveItem(form);
    if (form.id === "form-archive") saveArchive(form);
    if (form.id === "form-labels") saveLabels(form);
    if (form.id === "form-grade") saveGrade(form);
    if (form.id === "form-session") saveSession(form);
    if (form.id === "form-settings") saveSettings(form);
  });

  document.addEventListener("change", function (event) {
    var target = event.target;
    if (target.name === "projectId" && target.form && target.form.id === "form-task") {
      var etapaSelect = target.form.querySelector('[name="etapaId"]');
      if (etapaSelect) {
        var currentEtapa = etapaSelect.value;
        etapaSelect.innerHTML = Modals.etapaOptions(target.value, currentEtapa);
      }
    }
    if (target.matches("[data-stage-for]")) {
      var moved = Store.setTaskStage(target.dataset.stageFor, target.value);
      if (moved) toast(moved.stage === "feita" ? "Tarefa concluída." : moved.stage === "curso" ? "Tarefa em curso." : "Tarefa por fazer.");
      render();
      return;
    }
    if (target.matches("[data-filter]")) {
      UI.taskFilter[target.dataset.filter] = target.value;
      render();
      return;
    }
    if (target.matches("[data-default-reminder]")) {
      var days = Number(target.dataset.defaultReminder);
      var current = Store.state.settings.defaultReminders.slice();
      var index = current.indexOf(days);
      if (target.checked && index < 0) current.push(days);
      if (!target.checked && index >= 0) current.splice(index, 1);
      current.sort(function (a, b) { return a - b; });
      Store.updateSettings({ defaultReminders: current });
      toast("Predefinição atualizada.");
    }
  });

  document.addEventListener("input", function (event) {
    if (event.target.id === "task-search") {
      UI.taskFilter.q = event.target.value;
      render();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (UI.modal) closeModal();
      else document.body.classList.remove("nav-open");
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    var typing = event.target.closest("input, textarea, select, [contenteditable='true']");
    if (typing) return;
    var el = event.target.closest("[data-action]");
    if (!el || el.tagName === "BUTTON" || el.tagName === "A" || el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") return;
    event.preventDefault();
    el.click();
  });

  document.addEventListener("dragstart", function (event) {
    var card = event.target.closest(".kanban-card");
    if (!card || event.target.closest("button, select, a")) return;
    event.dataTransfer.setData("text/plain", card.dataset.id);
    event.dataTransfer.effectAllowed = "move";
    card.classList.add("is-dragging");
  });

  document.addEventListener("dragend", function (event) {
    var card = event.target.closest(".kanban-card");
    if (card) card.classList.remove("is-dragging");
    document.querySelectorAll(".kanban-col.is-over").forEach(function (col) { col.classList.remove("is-over"); });
  });

  document.addEventListener("dragover", function (event) {
    var col = event.target.closest(".kanban-col");
    if (!col) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    document.querySelectorAll(".kanban-col.is-over").forEach(function (item) {
      if (item !== col) item.classList.remove("is-over");
    });
    col.classList.add("is-over");
  });

  document.addEventListener("drop", function (event) {
    var col = event.target.closest(".kanban-col");
    if (!col) return;
    event.preventDefault();
    var id = event.dataTransfer.getData("text/plain");
    var moved = Store.setTaskStage(id, col.dataset.stage);
    if (moved) toast(moved.stage === "feita" ? "Tarefa concluída." : moved.stage === "curso" ? "Tarefa em curso." : "Tarefa por fazer.");
    render();
  });

  window.addEventListener("hashchange", function () {
    if (!applyHash() && location.hash.replace(/^#/, "").indexOf("projeto/") !== 0) {
      history.replaceState(null, "", "#painel");
      UI.view = "dashboard";
    }
    document.body.classList.remove("nav-open");
    render();
  });

  if (!applyHash()) {
    history.replaceState(null, "", "#painel");
    UI.view = "dashboard";
  }
  render();
  scanNotifications();
})();
