jiant.onUiBound(function($, app) {

  app.events.todoAdded.on(updateView);
  app.events.todoRemoved.on(updateView);

  function updateView() {
    app.model.todo.getAll().length > 0 ? app.views.footer.show() : app.views.footer.hide();
  }

});