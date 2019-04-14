var finishActivitySound = new Howl({
  src: ['beep.mp3'],
  loop: true,
});

function isSequence(activityName) {
  var data = store.get("activity-" + activityName);
  if (!data) return false;
  return Array.isArray(data);
}

function addActivityToList(name, data) {
  if (Array.isArray(data)) {

  } else {
    mins = validateActivityDuration(data.duration);
  }
  /**
  var item = $(
    "<a class='list-group-item list-group-item-action'>" + name + 
        "<input size='6' class='ml-5 mr-1' type='text' value='" + mins + "'>" +
        "<label>mins</label>" +
        "<button type='button' class='close' aria-label='Close'>" +
        "<span aria-hidden='true'>&times;</span>" +
        "</button>" +
    "</a>").appendTo("#activities-listgroup");;
  */
  var item = $(
    "<a class='list-group-item list-group-item-action'>" + name + 
        "<button type='button' class='close' aria-label='Close'>" +
        "  <span aria-hidden='true'>&times;</span>" +
        "</button>" +
        "<button type='button' class='edit btn btn-sm'>" +
        "  <span class='fa fa-edit'></span> Edit" +
        "</button>" +
    "</a>").appendTo("#activities-listgroup");

  item.click(function (e) {
    e.preventDefault();
    if (!isEditingActivities()) {
      var name = $(this).contents().get(0).nodeValue;
      startActivity(name);
    }
  }).children().click(function(e) {
    return false;
  });

  item.find("button.close").on("click", function(e) {
    e.preventDefault();
    var name = $(this).parent().contents().get(0).nodeValue;
    if (window.confirm("Do you want to delete '" + name + "'?")) {
      store.remove("activity-" + name);
      removeActivityFromList(name);
    }
    return false;  // Don't invoke list item's click handler.
  });

  item.find("button.edit").on("click", function(e) {
    e.preventDefault();
    var name = $(this).parent().contents().get(0).nodeValue;
    if (isSequence(name)) {
      openEditSequenceDialog(name);
    } else {
      openEditActivityDialog(name, null);
    }
    return false;  // Don't invoke list item's click handler.
  });
}

function removeActivityFromList(name) {
  $("#activities-listgroup a.list-group-item:contains('" + name + "')").remove();
}

function iterateAllActivities(fn) {
  var names = [];
  var prefix = "activity-";
  store.each(function(value, key) {
    if (!key.startsWith(prefix))
      return;
    key = key.substr(prefix.length);
    names.push(key);
  });
  names.sort();
  for (var i = 0; i < names.length; ++i) {
    fn(names[i], store.get(prefix + names[i]));
  }
}

function validateActivityDuration(val) {
  if (!val || isNaN(val) || val <= 0 || val >= 60)
    val = 10;
  return val;
}

function editActivities() {
  if (isDoingActivity())
    return;  // Don't do anything if user is on a timer now.

  $("#activityListEmptyAlert").hide();
  $("#editActivities").hide();
  $("#finishedEditActivities").show();
  $("#btnAddNewActivity").show();
  $("#activities-listgroup input").show();
  $("#activities-listgroup label").show();
  $("#activities-listgroup button.edit").show();
  $("#activities-listgroup button.close").show();
}

function finishedEditActivities() {
  $("#editActivities").show();
  $("#finishedEditActivities").hide();
  $("#btnAddNewActivity").hide();
  $("#activities-listgroup input").hide();
  $("#activities-listgroup label").hide();
  $("#activities-listgroup button.edit").hide();
  $("#activities-listgroup button.close").hide();
  /*
  iterateAllActivities(function(name, value) {
    var mins = $("#activities-listgroup a:contains('" + name + "') > input").val();
    mins = validateActivityDuration(mins);
    value.duration = mins;
    $("#activities-listgroup a:contains('" + name + "') > input").val(mins);
    store.set("activity-" + name, value);
  });*/
  if ($("#activities-listgroup").children().length == 0) {
    $("#activityListEmptyAlert").show();
  } else {
    $("#activityListEmptyAlert").hide();
  }
}

function isEditingActivities() {
  return $("#finishedEditActivities").css('display') != 'none';
}

function isDoingActivity() {
  return $("#clockContainer").css('display') != 'none';
}

function startActivity(name) {
  var data = store.get("activity-" + name);
  var obj = { name: name, index: 0, data: data };
  var mins = validateActivityDuration(data.duration);
  if (isSequence(name)) {
    if (data.length == 0)
      return;
    mins = validateActivityDuration(data[0].duration);
    $("#clockContainer #title").text(data[0].step);
    $("#clockContainer #btnCancelTimer").show();
  } else {
    $("#clockContainer #title").text(name);
    $("#clockContainer #btnCancelTimer").hide();
  }
  $("#activityListContainer").hide();
  $("#clockContainer").show();
  initActivityTimer("clockDiv",
      new Date(Date.parse(new Date()) + mins * 60000),
      function() { finishActivity(false, false, obj); });
  $("#btnFinishActivity").unbind("click").click(function(e) {
    e.preventDefault();
    finishActivity(true, false, obj);
  });
  $("#btnCancelTimer").unbind("click").click(function(e) {
    e.preventDefault();
    finishActivity(false, true, obj);
  });
}

function finishActivity(activityCompleted, cancelAll, obj) {
  if (cancelAll) {
    cancelActivityTimer();
    $("#clockContainer").hide();
    $("#activityListContainer").show();
  } else if (activityCompleted) {
    cancelActivityTimer();
    obj.index++;
    if (obj.index < obj.data.length) {
      var mins = validateActivityDuration(obj.data[obj.index].duration);
      $("#clockContainer #title").text(obj.data[obj.index].step);
      initActivityTimer("clockDiv",
          new Date(Date.parse(new Date()) + mins * 60000),
          function() { finishActivity(false, false, obj); });
    } else {
      $("#clockContainer").hide();
      $("#activityListContainer").show();
    }
  } else {
    finishActivitySound.play();
    $("#btnMute").unbind("click").click(function() {
      finishActivitySound.stop();
    });
    $('#activityFinishedModal')
      .unbind('hidden.bs.modal')
      .on('hidden.bs.modal', function (e) {
        finishActivitySound.stop();
        finishActivity(true, false, obj);
      })
      .modal();
  }
}

function openEditActivityDialog(activityName, activityToAppendTo) {
  $('#btnEditActivitySave').unbind('click').click(function() {
    var name = $("#inputActivityName").val();
    if (name.length = 0) {
      return;
    }
    var mins = $("#inputActivityTime").val();
    mins = validateActivityDuration(mins);
    if (activityToAppendTo == null) {
      var data = { duration: mins };
      if (store.get("activity-" + name) == null) {
        addActivityToList(name, data);
      }
      store.set("activity-" + name, data);
    } else {
      var data = store.get("activity-" + activityToAppendTo);
      if (data == null || data.length == 0) {
        data = [];
      }/* else {
        data.push( { step: "Transition", duration: 1 });
      }*/
      data.push( { step: name, duration: mins });
      store.set("activity-" + activityToAppendTo, data);
      updateEditSequenceList(data);
    }
  });
  if (activityName != null) {
    var data = store.get("activity-" + activityName);
    $("#inputActivityName").val(activityName);
    $("#inputActivityName").prop("disabled", true);
    $("#inputActivityTime").val(data.duration);
  } else {
    $("#inputActivityName").prop("disabled", false);
    $("#inputActivityName").val("");
    $("#inputActivityTime").val("");
  }
  $('#addNewActivityModal').modal();
  $('#addNewActivityModal')
      .unbind('shown.bs.modal')
      .on('shown.bs.modal', function () {
    if ($("#inputActivityName").prop("disabled")) {
      $("#inputActivityTime").trigger('focus');
    } else {
      $("#inputActivityName").trigger('focus');
    }
  });
}

function updateEditSequenceList(sequenceData) {
  var ul = $("#editSequenceModal ul");
  ul.empty();
  if (sequenceData == null)
    return;

  for (var i = 0; i < sequenceData.length; ++i) {
    var item = $("<li class='row' id='" + i + "'>" +
      "<span class='fa fa-grip-lines-vertical'></span>" +
      "<span class='col-sm'>" + sequenceData[i].step + "</span>" +
      "<input size='6' class='col-sm ml-5 mr-1' type='text' value='" + sequenceData[i].duration + "'>" +
      "<span class='col-sm'>mins</span>" +
      "<button type='button' class='close col-sm' aria-label='Close'>" +
      "<span aria-hidden='true'>&times;</span>" +
      "</button>" +
      "</li>").appendTo(ul);
    item.find("button.close").on("click", function(e) {
      e.preventDefault();
      var sequenceName = $("#inputSequenceName").val();
      var activityName = $($(this).parent().contents().get(1)).text();
      if (window.confirm("Do you want to delete '" + activityName + "'?")) {
        var data = store.get("activity-" + sequenceName);
        for (var j = 0; j < data.length; ++j) {
          if (data[j].step == activityName) {
            //data.splice(j == 0 ? j : j - 1, data.length == 1 ? 1 : 2);
            data.splice(j, 1);
            break;
          }
        }
        store.set("activity-" + sequenceName, data);
        updateEditSequenceList(data);
      }
      return false;  // Don't invoke list item's click handler.
    });
  }

  $("#sortable")
      .unbind("sortupdate")
      .on("sortupdate", function(event, ui) {
    var order = $("#sortable").sortable("toArray");
    var sequenceName = $("#inputSequenceName").val();
    var oldData = store.get("activity-" + sequenceName);
    var newData = [];
    for (var i = 0; i < order.length; ++i) {
      var oldIndex = parseInt(order[i]);
      newData.push(oldData[oldIndex]);
    }
    store.set("activity-" + sequenceName, newData);
    var elems = $("#editSequenceModal li");
    for (i = 0; i < elems.length; ++i) {
      elems[i].id = "" + i;
    }
  });
}

function openEditSequenceDialog(sequenceName) {
  if (sequenceName == null) {
    $("#inputSequenceName").prop("disabled", false).val("");
    $("#btnAddActivityToSequence").hide();
    $("#btnCancel").show();
    $("#editSequenceModal")
        .unbind("shown.bs.modal")
        .on("shown.bs.modal", function() {
      $('#inputSequenceName').trigger('focus');
    });
    $("#btnSaveSequence").text("Create");
    $("#btnSaveSequence").unbind("click").click(function() {
      var name = $("#inputSequenceName").val();
      if (name.length > 0) {
        data = [];
        store.set("activity-" + name, data);
        addActivityToList(name, data);
        openEditSequenceDialog(name);
      }
    });
    $("#editSequenceModal").modal();
    return;
  }

  $("#inputSequenceName").prop("disabled", true).val(sequenceName);
  $("#btnAddActivityToSequence").show();
  $("#btnCancel").hide();
  $("#btnSaveSequence").text("Save");
  $("#btnSaveSequence").unbind("click").click(function() {
    $("#editSequenceModal").modal("hide");
  });

  $("#btnAddActivityToSequence").unbind("click").click(function() {
    openEditActivityDialog(null, sequenceName);
  });

  $("#editSequenceModal")
      .unbind("shown.bs.modal")
      .on("shown.bs.modal", function() {
    var data = store.get("activity-" + sequenceName);
    updateEditSequenceList(data);
  });
  $("#editSequenceModal")
      .unbind("hide.bs.modal")
      .on("hide.bs.modal", function() {
    var durations = $("#editSequenceModal li input");
    var data = store.get("activity-" + sequenceName);
    for (var i = 0; i < durations.length; ++i) {
      data[i].duration = validateActivityDuration(parseInt(durations[i].value));
    }
    store.set("activity-" + sequenceName, data);
  });
  $("#editSequenceModal").modal();
}

function setup() {
  iterateAllActivities(function(name, value) {
    addActivityToList(name, value);
  });
  finishedEditActivities();

  $("#sortable").sortable();
}

$(document).ready(setup);
