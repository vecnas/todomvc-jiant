jiant.onUiBound(function($, app) {

  var ctlsView = app.views.footer,
      ctls = {
        "showActiveCtl": app.states.active,
        "showCompletedCtl": app.states.completed,
        "showAllCtl": app.states[""]
      };

  $.each(ctls, function(key, state) {
    ctlsView[key].click(function() {
      state.go();
    });
    state.start(function() {
      ctlsView[key].addClass("selected");
    });
    state.end(function() {
      ctlsView[key].removeClass("selected");
    });
  });

});