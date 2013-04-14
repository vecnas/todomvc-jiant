jiant.onUiBound(function($, app) {

  var ctl = app.views.main.batchToggleStateCtl;

  app.events.todoAdded.on(updateView);
  app.events.todoRemoved.on(updateView);
  app.events.todoStateChanged.on(updateView);

  function updateView() {
    var total = app.model.todo.getAll().length,
        completed = app.model.todo.getCompleted().length;
    (total > 0) ? ctl.show() : ctl.hide();
    ctl.prop("checked", (total == completed) ? "checked" : null);
  }

  ctl.click(function() {
    var toState = ctl.prop("checked");
    $.each(app.model.todo.getAll(), function(idx, todo) {
      if (todo.completed != toState) {
        todo.completed = toState;
        app.events.todoStateChanged.fire(todo);
      }
    });
  });

});