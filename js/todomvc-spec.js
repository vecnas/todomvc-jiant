var todomvcJiant = todomvcJiant || (function (jiant) {

  var collection = jiant.collection,
      container = jiant.container,
      ctl = jiant.ctl,
      input = jiant.input,
      label = jiant.label;

  return {

    states: {

      "": {
        go: function () {},
        start: function(cb) {},
        end: function(cb) {}
      },

      active: {
        go: function () {},
        start: function(cb) {},
        end: function(cb) {}
      },

      completed: {
        go: function () {},
        start: function(cb) {},
        end: function(cb) {}
      }

    },

    events: {

      todoAdded: {
        fire: function(todo) {},
        on: function(cb) {}
      },

      todoRemoved: {
        fire: function(todo) {},
        on: function(cb) {}
      },

      todoStateChanged: {
        fire: function(todo) {},
        on: function(cb) {}
      }

    },

    views: {

      header: {
        newTodoTitleInput: input
      },

      main: {
        batchToggleStateCtl: ctl,
        todoList: container
      },

      footer: {
        activeCountLabel: label,
        clearCompletedCtl: ctl,
        completedCountLabel: label,
        showAllCtl: ctl,
        showActiveCtl: ctl,
        showCompletedCtl: ctl
      }

    },

    templates: {

      tmTodo: {
        deleteCtl: ctl,
        editCtl: ctl,
        stateMarker: label,
        toggleStateCtl: ctl,
        titleInput: input,
        hiddenInEditMode: collection,
        titleLabel: label
      },

      itemsLeft: {},
      itemsLeft1: {}

    },

    model: {
      todo: {
        add: function(title, completed) {},
        remove: function(todo) {},
        getAll: function() {},
        getCompleted: function() {}
      }
    }

  };

})(jiant);
