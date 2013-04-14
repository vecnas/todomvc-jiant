// 0.01 : ajax alpha, views, templates
// 0.02 : event bus
// 0.03 : ajax with callback and errHandler per call
// 0.04 : bind plugin
// 0.05 : states
// 0.06 : onUiBound event for anonymous plugins, empty hash state
// 0.07 : crossdomain views load, setupForm check for form, pager update
// 0.08 : broken for some ie cases, templates IE attribute quotes workaround from http://weblogs.asp.net/alexeigorkov/archive/2010/03/16/lazy-html-attributes-wrapping-in-internet-explorer.aspx
// 0.09 : broken for some ie cases, templates IE redone, to avoid bug with "a=!!val!!" situation, isMSIE flag added
// 0.10 : templates IE one more redone, attributes DOM manipulation, for templates parse, parse template starting with plain text by adding comment, template controls binding
// 0.11: ajax url override for ajax calls via returning value from specification function
// 0.12: return from submitForm, template parse results binding changed to merge of filter and find to support no-root templates, added propagate(data) function to views
// 0.13: comment node removed from template parse results
// 0.14: events[name].listenersCount++;
// 0.15: parseInt for inputInt value arrow up
// 0.16: state parameters - undefined replacement by current value properly, inputDate added, works when datepicker available, formatDate, formatTime added
// 0.17: propagate "0" and "" passed as valid values
// 0.18: default state "end" not triggered - fixed

var jiant = jiant || (function($) {

  var collection = {},
      container = {},
      containerPaged = {},
      ctl = {},
      form = {},
      fn = function(param) {},
      grid = {},
      image = {},
      input = {},
      inputInt = {},
      inputDate = {},
      label = {},
      lookup = function(selector) {},
      on = function(cb) {},
      goState = function(params, preserveOmitted) {},
      pager = {},
      slider = {},
      stub = function() {
        var callerName = "not available";
        if (arguments && arguments.callee && arguments.callee.caller) {
          callerName = arguments.callee.caller.name;
        }
        alert("stub called from function: " + callerName);
      },
      tabs = {},

      lastState = undefined,
      eventBus = $({}),
      bindingsResult = true,
      uiBoundRoot = undefined,
      errString;

  function ensureExists(obj, idName, className) {
    if (!obj || !obj.length) {
      window.console && window.console.error
      && (className ? logError("non existing object referred by class under object id '" + idName
          + "', check stack trace for details, expected obj class: " + className) :
          logError("non existing object referred by id, check stack trace for details, expected obj id: " + idName));
      if (className) {
        errString += "   ,    #" + idName + " ." + className;
      } else {
        errString += ", #" + idName;
      }
      bindingsResult = false;
    }
  }

  function maybeAddDevHook(uiElem, key, elem) {
    if (jiant.DEV_MODE) {
      uiElem.click(function(event) {
        if (event.shiftKey && event.altKey) {
          var message = key + (elem ? ("." + elem) : "");
          if (event.ctrlKey) {
            message += "\r\n------------\r\n";
            message += pseudoserializeJSON(jQuery._data(uiElem[0], "events"));
          }
          logInfo(message);
          alert(message);
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      });
    }
  }

  // not serialization actually, for example when text contains " - generates invalid output. just for dev purposes
  function pseudoserializeJSON(obj) {
    var t = typeof(obj);
    if (t != "object" || obj === null) {
      // simple data type
      if (t == "string") {
        obj = '"' + obj + '"';
      }
      return String(obj);
    } else {
      // array or object
      var json = [],
          arr = (obj && obj.constructor == Array);

      $.each(obj, function (k, v) {
        t = typeof(v);
        if (t == "string") {
          v = '"' + v + '"';
        }
        else if (t == "object" && v !== null) {
          v = pseudoserializeJSON(v);
        }
        json.push((arr ? "" : '"' + k + '":') + (v ? v : "\"\""));
      });

      return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
  }

  function formatDate(millis) {
    var dt = new Date(millis);
    return $.datepicker.formatDate("yy-mm-dd", dt);
  }

  function formatTime(millis) {
    var dt = new Date(millis);
    return lfill(dt.getHours()) + ":" + lfill(dt.getMinutes());
  }

  function formatTimeSeconds(millis) {
    var dt = new Date(millis);
    return lfill(dt.getHours()) + ":" + lfill(dt.getMinutes() + ":" + lfill(dt.getSeconds()));
  }

  function lfill(val) {
    return val < 10 ? "0" + val : val;
  }

  function msieDom2Html(elem) {
    $.each(elem.find("*"), function(idx, child) {
      $.each(child.attributes, function(i, attr) {
        if (attr.value.indexOf(" ") < 0 && attr.value.indexOf("!!") >= 0) {
          $(child).attr(attr.name, attr.value.replace(/!!/g, "e2013e03e11eee "));
        }
      });
    });
    return $.trim($(elem).html()).replace(/!!/g, "!! ").replace(/e2013e03e11eee /g, "!! ");
  }

  function parseTemplate(that, data) {
    data = data || {};
//    if (! that.html) {
//      that = $(that);
//    }
    var str = $.trim($(that).html()),
        _tmplCache = {},
        err = "";
    if (!jiant.isMSIE) {
      str = str.replace(/!!/g, "!! ");
    } else {
      str = msieDom2Html($(that));
    }
    try {
      var func = _tmplCache[str];
      if (!func) {
        var strFunc =
            "var p=[],print=function(){p.push.apply(p,arguments);};" +
                "with(obj){p.push('" +
                str.replace(/[\r\t\n]/g, " ")
                    .replace(/'(?=[^#]*#>)/g, "\t")
                    .split("'").join("\\'")
                    .split("\t").join("'")
                    .replace(/!! (.+?)!! /g, "',$1,'")
                    .split("!?").join("');")
                    .split("?!").join("p.push('")
                + "');}return p.join('');";

        //alert(strFunc);
        func = new Function("obj", strFunc);
        _tmplCache[str] = func;
      }
      return $.trim(func(data));
    } catch (e) {
      err = e.message;
    }
    return "!!! ERROR: " + err.toString() + " !!!";
  }

  function setupInputInt(input) {
    input.keydown(function(event) {
      if (event.keyCode == jiant.key.down && input.val() > 0) {
        input.val(input.val() - 1);
        return false;
      } else if (event.keyCode == jiant.key.up) {
        input.val(parseInt(input.val()) + 1);
        return false;
      } else if (event.keyCode == jiant.key.backspace || event.keyCode == jiant.key.del || event.keyCode == jiant.key.end
          || event.keyCode == jiant.key.home || event.keyCode == jiant.key.tab || event.keyCode == jiant.key.enter) {
      } else if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
        event.preventDefault();
        return false;
      }
      return true;
    });
  }

  function setupForm(elem, key, name) {
    if (! elem[0]) {
      return;
    }
    var tagName = elem[0].tagName.toLowerCase();
    if (tagName != "form") {
      jiant.logError(key + "." + name + " form element assigned to non-form: " + tagName);
      if (jiant.DEV_MODE) {
        alert(key + "." + name + " form element assigned to non-form: " + tagName);
      }
    }
    elem.submitForm = function(url, cb) {
      url = url || elem.attr("action");
      return $.post(url, elem.serialize(), cb);
    };
  }

  function logError(error) {
    window.console && window.console.error && window.console.error(error);
  }

  function logInfo(s) {
    jiant.DEV_MODE && window.console && window.console.info && window.console.info(s);
  }

  function setupPager(uiElem) {
    var pagerBus = $({}),
        root = $("<ul></ul>");
    uiElem.addClass("pagination");
    uiElem.append(root);
    uiElem.onValueChange = function(callback) {
      pagerBus.on("ValueChange", callback);
    };
    uiElem.updatePager = function(page) {
      root.empty();
//      $.each(page, function(key, value) {
//        logInfo(key + " === " + value);
//      });
      var from = Math.max(0, page.number - jiant.PAGER_RADIUS / 2),
          to = Math.min(page.number + jiant.PAGER_RADIUS / 2, page.totalPages);
      if (from > 0) {
        addPageCtl(1, "").find("a").css("margin-right", "20px");
      }
      for (var i = from; i < to; i++) {
        var cls = "";
        if (i == page.number) {
          cls += " active";
        }
        addPageCtl(i + 1, cls);
      }
      if (to < page.totalPages - 1) {
        addPageCtl(page.totalPages, "").find("a").css("margin-left", "20px");
      }
    };
    function addPageCtl(value, ctlClass) {
      var ctl = $(parseTemplate($("<b><li class='!!ctlClass!!' style='cursor: pointer;'><a>!!label!!</a></li></b>"), {label: value, ctlClass: ctlClass}));
      root.append(ctl);
      ctl.click(function() {
        pagerBus.trigger("ValueChange", value);
      });
      return ctl;
    }
  }

  function setupContainerPaged(uiElem) {
    var prev = $("<div>&lt;&lt;</div>"),
        next = $("<div>&gt;&gt;</div>"),
        container = $("<div></div>"),
        pageSize = 8,
        offset = 0;
    prev.addClass("paged-prev");
    next.addClass("paged-next");
    container.addClass("paged-container");
    uiElem.empty();
    uiElem.append(prev);
    uiElem.append(container);
    uiElem.append(next);
    prev.click(function() {
      offset -= pageSize;
      sync();
    });
    next.click(function() {
      offset += pageSize;
      sync();
    });
    uiElem.append = function(elem) {
      container.append(elem);
      sync();
    };
    uiElem.empty = function() {
      container.empty();
      sync();
    };
    uiElem.setHorizontal = function(bool) {
      var display = bool ? "inline-block" : "block";
      prev.css("display", display);
      next.css("display", display);
      container.css("display", display);
    };
    uiElem.setPageSize = function(val) {
      pageSize = val;
      sync();
    };
    uiElem.setHorizontal(true);

    function sync() {
      offset = Math.max(offset, 0);
      offset = Math.min(offset, container.children().length - 1);
      prev.css("visibility", offset > 0 ? "visible" : "hidden");
      next.css("visibility", offset < container.children().length - pageSize ? "visible" : "hidden");
      $.each(container.children(), function(idx, domElem) {
        var elem = $(domElem);
//        logInfo("comparing " + idx + " vs " + offset + " - " + (offset+pageSize));
        if (idx >= offset && idx < offset + pageSize) {
//          logInfo("showing");
          elem.show();
        } else {
          elem.hide();
        }
      });
    }
  }

  function setupExtras(uiElem, elemContent, key, elem) {
    if (elemContent == tabs && uiElem.tabs) {
      uiElem.tabs();
    } else if (elemContent == inputInt) {
      setupInputInt(uiElem);
    } else if (elemContent == inputDate && uiElem.datepicker) {
      uiElem.datepicker();
    } else if (elemContent == pager) {
      setupPager(uiElem);
    } else if (elemContent == form) {
      setupForm(uiElem, key, elem);
    } else if (elemContent == containerPaged) {
      setupContainerPaged(uiElem);
    }
    maybeAddDevHook(uiElem, key, elem);
  }

// ------------ views ----------------

  function _bindContent(subRoot, key, content, view, prefix) {
    $.each(content, function (elem, elemContent) {
//      window.console && window.console.logInfo(elem + "    : " + subRoot[elem]);
      if (subRoot[elem] == lookup) {
        logInfo("    loookup element, no checks/bindings: " + elem);
        subRoot[elem] = function() {return $("." + prefix + elem);};
      } else {
        var uiElem = view.find("." + prefix + elem);
        ensureExists(uiElem, prefix + key, prefix + elem);
        subRoot[elem] = uiElem;
        setupExtras(uiElem, elemContent, key, elem);
//        logInfo("    bound UI for: " + elem);
      }
    });
  }

  function ensureSafeExtend(spec, jqObject) {
    $.each(spec, function(key, content) {
      if (jqObject[key]) {
        logError("unsafe extension: " + key + " already defined in base jQuery, shouldn't be used");
      }
    });
  }

  function makePropagationFunction(content) {
    var map = {};
    $.each(content, function (key, elem) {
      map[key] = elem;
    });
    return function(data) {
      $.each(map, function (key, elem) {
        if (data[key] != undefined && data[key] != null) {
          var tagName = elem[0].tagName.toLowerCase();
          if (tagName == "input" || tagName == "textarea") {
            elem.val(data[key]);
          } else if (tagName == "img") {
            elem.attr("src", data[key]);
          } else {
            elem.html(data[key]);
          }
        }
      });
    }
  }

  function _bindViews(prefix, root) {
    prefix = prefix || "";
    $.each(root, function (key, content) {
      logInfo("binding UI for view: " + key);
      var view = $("#" + prefix + key);
      ensureExists(view, prefix + key);
      _bindContent(root[key], key, content, view, prefix);
      ensureSafeExtend(root[key], view);
      root[key].propagate = makePropagationFunction(content);
      $.extend(root[key], view);
      maybeAddDevHook(view, key, undefined);
    });
  }

// ------------ templates ----------------

  function _bindTemplates(prefix, root) {
    prefix = prefix || "";
    $.each(root, function(key, content) {
      logInfo("binding UI for template: " + key);
      var tm = $("#" + prefix + key);
      ensureExists(tm, prefix + key);
      $.each(content, function (elem, elemType) {
        ensureExists(tm.find("." + prefix + elem), prefix + key, prefix + elem);
      });
      root[key].parseTemplate = function(data) {
        var retVal = $("<!-- -->" + parseTemplate(tm, data)); // add comment to force jQuery to read it as HTML fragment
        $.each(content, function (elem, elemType) {
          if (elem != "parseTemplate" && elem != "parseTemplate2Text") {
            retVal[elem] = $.merge(retVal.filter("." + prefix + elem), retVal.find("." + prefix + elem));
            setupExtras(retVal[elem], root[key][elem], key, elem);
            maybeAddDevHook(retVal[elem], key, elem);
          }
        });
        retVal.splice(0, 1); // remove first comment
        return retVal;
      };
      root[key].parseTemplate2Text = function(data) {
        return parseTemplate(tm, data);
      };
    });
  }

  function parseTemplate2Text(tm, data) {
    return parseTemplate(tm, data);
  }

// ------------ events staff ----------------

  function _bindEvents(events) {
    $.each(events, function(name, spec) {
      logInfo("binding event: " + name);
      events[name].listenersCount = 0;
      events[name].fire = function() {
//        logInfo("    EVENT fire. " + name);
//        logInfo(arguments);
        eventBus.trigger(name + ".event", arguments);
      };
      events[name].on = function (cb) {
        logInfo("    assigning event handler to " + name);
        events[name].listenersCount++;
        eventBus.on(name + ".event", function () {
//        logInfo("    EVENT. on");
//        logInfo(arguments);
          var args = $.makeArray(arguments);
          args.splice(0, 1);
          cb && cb.apply(cb, args);
        })
      };
    });
  }

// ------------ states staff ----------------

  function _bindStates(states) {
    if (! $.History) {
      var err = "No history plugin and states configured. Don't use states or add $.History plugin";
      jiant.logError(err);
      if (jiant.DEV_MODE) {
        alert(err);
      }
      return;
    }
    $.each(states, function(name, stateSpec) {
      logInfo("binding state: " + name);
      stateSpec.go = go(name, stateSpec.root);
      stateSpec.start = function(cb) {
        eventBus.on(name + "_start", function() {
          var args = $.makeArray(arguments);
          args.splice(0, 1);
          cb && cb.apply(cb, args);
        });
      };
      stateSpec.end = function(cb) {
        eventBus.on("state." + name + ".end", function() {
          var args = $.makeArray(arguments);
          args.splice(0, 1);
          cb && cb.apply(cb, args);
        });
      };
    });
    $.History.bind(function (state) {
      var parsed = parseState(),
          stateId = parsed.now[0],
          handler = states[stateId],
          params = parsed.now;
      params.splice(0, 1);
      $.each(params, function(idx, p) {
        if (p == "undefined") {
          params[idx] = undefined;
        }
      });
      if (lastState != undefined && lastState != stateId) {
        eventBus.trigger("state." + lastState + ".end");
      }
      lastState = stateId;
      eventBus.trigger((stateId ? stateId : "") + "_start", params);
    });
  }

  function go(stateId, root) {
    return function() {
      var parsed = parseState(),
          prevState = parsed.now;
      parsed.now = [stateId];
      $.each(arguments, function(idx, arg) {
        if (arg != undefined) {
          parsed.now.push(pack(arg + ""));
        } else if (prevState[0] == stateId && prevState[idx + 1] != undefined) {
          parsed.now.push(pack(prevState[idx + 1] + ""));
        } else {
          parsed.now.push(pack(arg + ""));
        }
      });
      if (root) {
        parsed.root = parsed.now;
      }
      setState(parsed);
    };
  }

  function goRoot() {
    var parsed = parseState();
    parsed.now = parsed.root;
    setState(parsed);
  }

  function setState(parsed) {
    var s = "root=" + parsed.root + "|now=" + parsed.now;
    $.History.go(s);
  }

  function parseState() {
    var state = $.History.getState();
    var arr = state.split("|");
    var parsed = {};
    $.each(arr, function(idx, item) {
      var itemArr = item.split("="),
          args = [];
      if (itemArr.length >= 2) {
        args = itemArr[1].split(",");
      }
      parsed[itemArr[0]] = [];
      $.each(args, function(idx, arg) {
        parsed[itemArr[0]].push(unpack(arg));
      });
    });
    parsed.now = parsed.now || [];
    parsed.root = parsed.root || [];
    return parsed;
  }

  function pack(s) {
    return s ? s.replace(/;/g, ";;").replace(/,/g, ";1").replace(/=/g, ";2").replace(/\|/g, ";3") : "";
  }

  function unpack(s) {
    return s ? s.replace(/;3/g, "|").replace(/;2/g, "=").replace(/;1/g, ",").replace(/;;/g, ";") : "";
  }

  function refreshState() {
    $.History.trigger($.History.getState());
  }

// ------------ ajax staff ----------------

  function getParamNames(func) {
    var funStr = func.toString();
    return funStr.slice(funStr.indexOf('(')+1, funStr.indexOf(')')).match(/([^\s,]+)/g);
  }

  function _bindAjax(root) {
    $.each(root, function(uri, funcSpec) {
      logInfo("binding ajax for function: " + uri);
      var params = getParamNames(funcSpec);
      params.splice(params.length - 1, 1);
      root[uri] = makeAjaxPerformer(uri, params, $.isFunction(root[uri]) ? root[uri]() : undefined);
    });
  }

  function parseForAjaxCall(root, path, actual) {
    if ($.isArray(actual)) {
      root[path] = actual;
    } else if ($.isPlainObject(actual)) {
      $.each(actual, function(key, value) {
        parseForAjaxCall(root, key, value);
//        parseForAjaxCall(root, path + "." + key, value);
      });
    } else {
      root[path] = actual;
    }
  }

  function makeAjaxPerformer(uri, params, hardUrl) {
    return function() {
      var callData = {},
          callback,
          errHandler,
          outerArgs = arguments;
      if ($.isFunction(outerArgs[outerArgs.length - 2])) {
        callback = outerArgs[outerArgs.length - 2];
        errHandler = outerArgs[outerArgs.length - 1];
      } else if ($.isFunction(outerArgs[outerArgs.length - 1])) {
        callback = outerArgs[outerArgs.length - 1];
      }
      $.each(params, function(idx, param) {
        if (idx < outerArgs.length && !$.isFunction(outerArgs[idx]) && outerArgs[idx] != undefined && outerArgs[idx] != null) {
          var actual = outerArgs[idx];
          parseForAjaxCall(callData, param, actual);
        }
      });
      if (! callData["antiCache3721"]) {
        callData["antiCache3721"] = new Date().getTime();
      }
      var url = hardUrl ? hardUrl : jiant.AJAX_PREFIX + uri + jiant.AJAX_SUFFIX;
      logInfo("    AJAX call. " + uri + " to server url: " + url);
      $.ajax(url, {data: callData, traditional: true, success: function(data) {
        if (callback) {
          try{
            data = $.parseJSON(data);
          } catch (ex) {}
          callback(data);
        }
      }, error: function(jqXHR, textStatus, errorText) {
        if (errHandler) {
          errHandler(jqXHR.responseText);
        } else {
          jiant.handleErrorFn(jqXHR.responseText);
        }
      }});
    };
  }

  function defaultAjaxErrorsHandle(errorDetails) {
    logError(errorDetails);
  }

// ------------ base staff ----------------

  function maybeSetDevModeFromQueryString() {
    if ((window.location + "").toLowerCase().indexOf("jiant.dev_mode") >= 0) {
      jiant.DEV_MODE = true;
    }
  }

  function _bindUi(prefix, root, devMode) {
    jiant.DEV_MODE = devMode;
    if (! devMode) {
      maybeSetDevModeFromQueryString();
    }
    errString = "";
    bindingsResult = true;
    if (root.views) {
      _bindViews(prefix, root.views);
    } else {
      root.views = {};
    }
    if (root.templates) {
      _bindTemplates(prefix, root.templates);
    } else {
      root.templates = {};
    }
    if (root.ajax) {
      _bindAjax(root.ajax);
    } else {
      root.ajax = {};
    }
    if (root.events) {
      _bindEvents(root.events);
    } else {
      root.events = {};
    }
    if (root.states) {
      _bindStates(root.states);
    } else {
      root.states = {};
    }
    if (jiant.DEV_MODE && !bindingsResult) {
      alert("Some elements not bound to HTML properly, check console" + errString);
    }
    uiBoundRoot = root;
    eventBus.trigger("jiant.uiBound");
  }

  function bindUi(prefix, root, devMode, viewsUrl, injectId) {
    if (viewsUrl) {
      var injectionPoint = injectId ? $("#" + injectId) : $("body");
      injectionPoint.load(viewsUrl, {}, function() {
        $.ajaxSetup({
          contentType:"application/json",
          dataType:'jsonp',
          xhrFields: {
            withCredentials: true
          },
          crossDomain: true
        });
        _bindUi(prefix, root, devMode);
      });
    } else {
      _bindUi(prefix, root, devMode);
    }
  }

  function bind(obj1, obj2) {
    $.extend(obj1, obj2);
  }

  function onUiBound(cb) {
    if (uiBoundRoot) {
      cb && cb($, uiBoundRoot);
    } else {
      eventBus.on("jiant.uiBound", function() {
        cb && cb($, uiBoundRoot);
      });
    }
  }

  return {
    AJAX_PREFIX: "",
    AJAX_SUFFIX: "",
    DEV_MODE: false,
    PAGER_RADIUS: 6,
    isMSIE: eval("/*@cc_on!@*/!1"),

    bind: bind,
    bindUi: bindUi,
    goRoot: goRoot,
    goState: goState,
    onUiBound: onUiBound,
    refreshState: refreshState,

    handleErrorFn: defaultAjaxErrorsHandle,
    logInfo: logInfo,
    logError: logError,
    parseTemplate: function(text, data) {return $(parseTemplate(text, data));},
    parseTemplate2Text: parseTemplate2Text,

    collection: collection,
    container: container,
    containerPaged: containerPaged,
    ctl : ctl,
    fn: fn,
    form: form,
    formatDate: formatDate,
    formatTime: formatTime,
    formatTimeSeconds: formatTimeSeconds,
    grid: grid,
    image: image,
    input: input,
    inputDate: inputDate,
    inputInt: inputInt,
    label: label,
    lookup: lookup,
    on: on,
    pager: pager,
    slider: slider,
    stub: stub,
    tabs: tabs,

    key: {left: 37, up: 38, right: 39, down: 40, del: 46, backspace: 8, tab: 9, end: 35, home: 36, enter: 13, ctrl: 17,
      escape: 27,
      a: 65, c: 67, u: 85, w: 87, space: 32, 1: 49, 2: 50, 3: 51, 4: 52, 5: 53, 6: 54}

  };

})(jQuery);
