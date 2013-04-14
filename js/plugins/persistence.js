jiant.onUiBound(function($, app) {

  var prefix = "todos-jiant.",
      firstTime = true;

  $.each(app.states, function(idx, state) {
    state.start(load);
  });

  function load() {
    if (!firstTime) {
      return;
    }
    firstTime = false;
    var count = localStorage[countKey()],
        idx = 0;
    if (count) {
      while (idx < count) {
        app.model.todo.add(localStorage[titleKey(idx)], localStorage[completedKey(idx)] === "true");
        idx++;
      }
    }
    app.events.todoAdded.on(persist);
    app.events.todoRemoved.on(persist);
    app.events.todoStateChanged.on(persist);
    app.events.todoTitleModified.on(persist);  }


  function persist() {
    var todos = app.model.todo.getAll(),
        prevCount = localStorage[countKey()];
    $.each(todos, function(idx, todo) {
      localStorage[titleKey(idx)] = todo.title;
      localStorage[completedKey(idx)] = todo.completed;
    });
    localStorage[countKey()] = todos.length;
    if (prevCount) {
      while (prevCount > todos.length) {
        localStorage.removeItem(titleKey(prevCount - 1));
        localStorage.removeItem(completedKey(prevCount - 1));
        prevCount--;
      }
    }
  }

  function titleKey(idx) {
    return prefix + idx + "title";
  }

  function completedKey(idx) {
    return prefix + idx + "completed";
  }

  function countKey() {
    return prefix + "count";
  }

});