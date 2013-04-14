jiant.onUiBound(function($, app) {

  app.events.todoAdded.on(updateView);
  app.events.todoRemoved.on(updateView);
  app.events.todoStateChanged.on(updateView);

  function updateView() {
    var len = app.model.todo.getCompleted().length;
    app.views.footer.completedCountLabel.html(len);
    len > 0 ? app.views.footer.clearCompletedCtl.show() : app.views.footer.clearCompletedCtl.hide();
  }

  app.views.footer.clearCompletedCtl.click(function() {
    $.each(app.model.todo.getCompleted(), function(idx, todo) {
      app.model.todo.remove(todo);
    });
  });


});