(function () {
  function svg(inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  }

  var ui = {
    dashboard: svg('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
    courses: svg('<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z"/><path d="M5 5.5V19"/>'),
    tasks: svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12.5l2.2 2.2L16 9.5"/>'),
    calendar: svg('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3.5V7M16 3.5V7"/>'),
    grades: svg('<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l3.2-4 2.6 2.4L19 7"/>'),
    stats: svg('<path d="M5 19V10"/><path d="M12 19V5"/><path d="M19 19v-7"/>'),
    bell: svg('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z"/><path d="M10 19a2 2 0 0 0 4 0"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M4.8 6.8l1.6 1.6M17.6 15.6l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.8 17.2l1.6-1.6M17.6 8.4l1.6-1.6"/>'),
    edit: svg('<path d="M12 20h8"/><path d="M16.5 3.6a2.1 2.1 0 0 1 3 3L8 18.1 4 19.1l1-4z"/>'),
    trash: svg('<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M7 7l1 13h8l1-13"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>'),
    pin: svg('<path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"/><circle cx="12" cy="11" r="1.6"/>'),
    user: svg('<circle cx="12" cy="8" r="3"/><path d="M5.5 19.2a6.5 6.5 0 0 1 13 0"/>'),
    search: svg('<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    check: svg('<path d="M5 12.5l4.2 4.2L19 7.5"/>'),
    study: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>'),
    chevron: svg('<path d="M9 6l6 6-6 6"/>'),
    alert: svg('<path d="M12 4l8.5 15h-17z"/><path d="M12 10v4"/><path d="M12 16.5h.01"/>'),
  };

  var course = {
    book: svg('<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z"/><path d="M5 5.5V19"/>'),
    code: svg('<path d="M9 8L5 12l4 4"/><path d="M15 8l4 4-4 4"/>'),
    sigma: svg('<path d="M7 6h11l-6 6 6 6H7"/>'),
    database: svg('<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>'),
    share: svg('<circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="7" r="2.2"/><circle cx="18" cy="17" r="2.2"/><path d="M8 11.2l8-3.2M8 12.8l8 3.2"/>'),
    compass: svg('<circle cx="12" cy="12" r="8"/><path d="M14.6 9.4l-1.3 4.9-4.9 1.3 1.3-4.9z"/>'),
    flask: svg('<path d="M9 3h6"/><path d="M10 3v6.2L6.2 19a2.6 2.6 0 0 0 2.4 3.5h6.8A2.6 2.6 0 0 0 17.8 19L14 9.2V3"/>'),
    pen: svg('<path d="M12 20h8"/><path d="M16.5 3.6a2.1 2.1 0 0 1 3 3L8 18.1 4 19.1l1-4z"/>'),
  };

  window.Icons = {
    ui: function (name) {
      return ui[name] || "";
    },
    course: function (name) {
      return course[name] || course.book;
    },
  };
})();
