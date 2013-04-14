jiant.onUiBound(function($, app) {

  var showCompleted = true,
      showActive = true;

  app.events.todoAdded.on(function(todo) {
    var todoTemplate = app.templates.tmTodo,
        todoElem = todoTemplate.parseTemplate();

    todo.ui = todoElem;
    app.views.main.todoList.append(todoElem);
    todoElem.titleLabel.html(todo.title);
    todoElem.titleInput.val(todo.title);
    updateTodoView(todo);

    todoElem.deleteCtl.click(function() {
      app.model.todo.remove(todo);
    });

    todoElem.toggleStateCtl.click(function() {
      todo.completed = !todo.completed;
      app.events.todoStateChanged.fire(todo);
    });

    todoElem.editCtl.dblclick(function() {
      todoElem.titleInput.val(todo.title);
      todoElem.stateMarker.addClass("editing");
      todoElem.titleInput.focus();
    });

    todoElem.titleInput.blur(function() {
      update(jiant.key.enter);
    });

    todoElem.titleInput.keyup(function(event) {
      update(event.keyCode);
    });

    function update(keyCode) {
      if (keyCode == jiant.key.escape) {
        todoElem.titleInput.val(todo.title);
        todoElem.stateMarker.removeClass("editing");
      } else if (keyCode == jiant.key.enter) {
        var newTitle = $.trim(todoElem.titleInput.val());
        if (newTitle != "") {
          todo.title = newTitle;
          todoElem.stateMarker.removeClass("editing");
          todo.title = todoElem.titleInput.val();
          todoElem.titleLabel.html(todo.title);
        } else {
          app.model.todo.remove(todo);
        }
      }
    }

  });

  app.events.todoRemoved.on(function(todo) {
    todo.ui.remove();
  });

  app.events.todoStateChanged.on(function(todo) {
    updateTodoView(todo);
  });

  function updateTodoView(todo) {
    if (todo.completed) {
      todo.ui.stateMarker.addClass("completed");
      todo.ui.toggleStateCtl.prop("checked", "checked");
      showCompleted ? todo.ui.removeClass("hidden") : todo.ui.addClass("hidden");
    } else {
      todo.ui.stateMarker.removeClass("completed");
      todo.ui.toggleStateCtl.prop("checked", null);
      showActive ? todo.ui.removeClass("hidden") : todo.ui.addClass("hidden");
    }
  }

  function updateAllViews() {
    $.each(app.model.todo.getAll(), function(idx, todo) {
      updateTodoView(todo);
    });
  }

  //single state handler to optimize a bit. actually we can attach state handler to each todoUi, so it will update itself
  app.states.active.start(function() {
    showCompleted = false;
    updateAllViews();
  });

  app.states.active.end(function() {
    showCompleted = true;
    updateAllViews();
  });

  app.states.completed.start(function() {
    showActive = false;
    updateAllViews();
  });

  app.states.completed.end(function() {
    showActive = true;
    updateAllViews();
  });

});