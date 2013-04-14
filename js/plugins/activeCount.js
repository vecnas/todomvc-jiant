jiant.onUiBound(function($, app) {

  function updateView() {
    var count = app.model.todo.getActive().length,
        tm = app.templates["itemsLeft" + count] ? app.templates["itemsLeft" + count] : app.templates.itemsLeft;
    app.views.footer.activeCountLabel.html(tm.parseTemplate2Text({count: count}));
  }

  app.events.todoAdded.on(updateView);
  app.events.todoRemoved.on(updateView);
  app.events.todoStateChanged.on(updateView);

});