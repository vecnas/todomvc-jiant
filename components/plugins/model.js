todomvcJiant.model.todo = (function($, app) {

  var todos = [];

  return {
    add: function(title, completed) {
      var todo = {title: title, completed: completed ? true : false};
      todos.push(todo);
      app.events.todoAdded.fire(todo);
      return todo;
    },
    remove: function(todo) {
      todos = $.grep(todos, function(value) {return value != todo;});
      app.events.todoRemoved.fire(todo);
      return todo;
    },
    getAll: function() {
      return todos;
    },
    getCompleted: function() {
      return $.grep(todos, function(value) {return value.completed});
    },
    getActive: function() {
      return $.grep(todos, function(value) {return !value.completed});
    }
  }
})($, todomvcJiant);