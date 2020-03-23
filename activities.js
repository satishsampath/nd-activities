var finishActivitySound = new Howl({
  src: ['beep.mp3'],
  loop: true,
});

function isSequence(activityName) {
  var data = store.get("activity-" + activityName);
  if (!data)
    return false;
  return Array.isArray(data);
}

function confirmAndDo(question, handler) {
  $("#confirmModalText").text(question);
  $("#btnConfirmModalOk").unbind("click").click(handler);
  $("#confirmModal").modal();
}

function addActivityToList(name, data) {
  if (Array.isArray(data)) {} else {
    mins = validateActivityDuration(data.duration);
  }
  var item = $("<a class='list-group-item list-group-item-action'>" + name + "<button type='button' class='close' aria-label='Close'>" + "  <span aria-hidden='true'>&times;</span>" + "</button>" + "<button type='button' class='edit btn btn-sm'>" + "  <span class='fa fa-edit'></span> Edit" + "</button>" + "</a>").appendTo("#activities-listgroup");

  item.click(function(e) {
    e.preventDefault();
    if (!isEditingActivities()) {
      var name = $(this).contents().get(0).nodeValue;
      confirmWithPassword(function () {
        startActivity(name);
      });
    }
  }).children().click(function(e) {
    return false;
  });

  item.find("button.close").on("click", function(e) {
    e.preventDefault();
    var name = $(this).parent().contents().get(0).nodeValue;
    confirmAndDo("Do you want to delete '" + name + "'?", function () {
      store.remove("activity-" + name);
      removeActivityFromList(name);
    });

    return false;
    // Don't invoke list item's click handler.
  });

  item.find("button.edit").on("click", function(e) {
    e.preventDefault();
    var name = $(this).parent().contents().get(0).nodeValue;
    if (isSequence(name)) {
      openEditSequenceDialog(name);
    } else {
      openEditActivityDialog(null, name);
    }
    return false;
    // Don't invoke list item's click handler.
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

function setPassword() {
  var password = store.get('password');
  $('#inputCurrentPassword').removeClass('has-error');
  $('#inputCurrentPassword').val('');
  $('#inputNewPassword').val('');
  if (password == null || password.length == 0) {
    $('#inputCurrentPassword').attr('disabled', true);
  } else {
    $('#inputCurrentPassword').attr('disabled', false);
  }
  $('#setPasswordModal').modal();
  $('#btnSavePassword').unbind('click').click(function (e) {
    var currentPassword = store.get('password');
    if (currentPassword != null && currentPassword != $('#inputCurrentPassword').val()) {
      $('#inputCurrentPassword').addClass('has-error');
      $("#inputCurrentPassword").trigger('focus');
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
    store.set('password', $('#inputNewPassword').val());
  });
}

function confirmWithPassword(runOnceConfirmed) {
  var password = store.get('password');
  if (password == null || password.length == 0) {
    runOnceConfirmed();
    return;
  }
  $('#inputPassword').removeClass('has-error');
  $('#inputPassword').val('');
  $('#btnConfirmPassword').unbind('click').click(function (e) {
    var currentPassword = store.get('password');
    if (currentPassword != $('#inputPassword').val()) {
      $('#inputPassword').addClass('has-error');
      $("#inputPassword").trigger('focus');
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
    runOnceConfirmed();
  });
  $('#confirmWithPasswordModal').modal({ backdrop: 'static', keyboard: false });
  $("#inputPassword").trigger('focus');
}

function editActivities() {
  if (isDoingActivity())
    return;
  // Don't do anything if user is on a timer now.

  confirmWithPassword(function () {
    $("#activityListEmptyAlert").hide();
    $("#editActivities").hide();
    $("#finishedEditActivities").show();
    $("#btnAddNewActivity").show();
    $("#btnAddNewSequence").show();
    $("#activities-listgroup input").show();
    $("#activities-listgroup label").show();
    $("#activities-listgroup button.edit").show();
    $("#activities-listgroup button.close").show();
  });
}

function finishedEditActivities() {
  $("#editActivities").show();
  $("#finishedEditActivities").hide();
  $("#btnAddNewActivity").hide();
  $("#btnAddNewSequence").hide();
  $("#activities-listgroup input").hide();
  $("#activities-listgroup label").hide();
  $("#activities-listgroup button.edit").hide();
  $("#activities-listgroup button.close").hide();
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
  var obj = {
    name: name,
    index: 0,
    data: data
  };
  var mins = 0;
  var reminderAfter = 0;
  var reminderSoundId = null;
  if (isSequence(name)) {
    if (data.length == 0)
      return;
    mins = validateActivityDuration(data[0].duration);
    reminderAfter = data[0].reminderAfter;
    reminderSoundId = data[0].reminderSoundId;
    $("#clockContainer #title").text(data[0].step);
    $("#clockContainer #btnCancelTimer").show();
  } else {
    mins = validateActivityDuration(data.duration);
    reminderAfter = data.reminderAfter;
    reminderSoundId = data.reminderSoundId;
    $("#clockContainer #title").text(name);
    $("#clockContainer #btnCancelTimer").hide();
  }
  $("#activityListContainer").hide();
  $("#clockContainer").show();
  initActivityTimer("clockDiv",
    new Date(Date.parse(new Date()) + mins * 60000),
    reminderAfter ? new Date(Date.parse(new Date()) + reminderAfter * 60000) : null,
    reminderSoundId,
    function () {
      finishActivity(false, false, obj);
  });
  $("#btnFinishActivity").unbind("click").click(function(e) {
    e.preventDefault();
    finishActivity(true, false, obj);
  });
  $("#btnCancelTimer").unbind("click").click(function(e) {
    e.preventDefault();
    finishActivity(false, true, obj);
  });
  $("#navbarDropdownMenuLink").addClass("disabled");
}

function finishActivity(activityCompleted, cancelAll, obj) {
  if (cancelAll) {
    confirmWithPassword(function () {
      cancelActivityTimer();
      $("#clockContainer").hide();
      $("#activityListContainer").show();
      $("#navbarDropdownMenuLink").removeClass("disabled");
    });
    return;
  }

  if (activityCompleted) {
    cancelActivityTimer();
    obj.index++;
    if (obj.index < obj.data.length) {
      var mins = validateActivityDuration(obj.data[obj.index].duration);
      var reminderAfter = obj.data[obj.index].reminderAfter;
      var reminderSoundId = obj.data[obj.index].reminderSoundId;
      $("#clockContainer #title").text(obj.data[obj.index].step);
      initActivityTimer("clockDiv",
        new Date(Date.parse(new Date()) + mins * 60000),
        reminderAfter ? new Date(Date.parse(new Date()) + reminderAfter * 60000) : null,
        reminderSoundId,
        function () {
          finishActivity(false, false, obj);
      });
    } else {
      $("#clockContainer").hide();
      $("#activityListContainer").show();
      $("#navbarDropdownMenuLink").removeClass("disabled");
    }
  } else {
    finishActivitySound.play();
    $("#btnAdd1Min").unbind("click").click(function() {
      finishActivitySound.stop();
      cancelActivityTimer();
      initActivityTimer("clockDiv",
        new Date(Date.parse(new Date()) + 60000), null, null, function() {
          finishActivity(false, false, obj);
        }
      );
    });
    $("#btnCompleted").unbind("click").click(function() {
      finishActivitySound.stop();
      finishActivity(true, false, obj);
    });
    $('#activityFinishedModal').modal({ backdrop: 'static', keyboard: false });
  }
}

function openEditSoundDialog(soundId, fnEditSoundDone) {
  getSoundURL(soundId, function(url) {
    $("#audioEditSoundCurrent").attr("src", url);
    $("#audioEditSoundCurrent").data("soundId", soundId)
  });
  $("#btnEditSoundRecord").unbind("click").click(function() {
    $("#btnEditSoundRecord").attr("disabled", true);
    $("#btnEditSoundStop").attr("disabled", false);
    soundRecorderStart(function(soundId) {
      getSoundURL(soundId, function(url) {
        $("#audioEditSoundCurrent").attr("src", url);
        $("#audioEditSoundCurrent").data("soundId", soundId)
      });
    });
  });
  $("#btnEditSoundStop").unbind("click").click(function() {
    $("#btnEditSoundRecord").attr("disabled", false);
    $("#btnEditSoundStop").attr("disabled", true);
    soundRecorderStop();
  });
  $("#btnEditSoundSave").unbind("click").click(function() {
    fnEditSoundDone($("#audioEditSoundCurrent").data("soundId"));
  });
  $("#editSoundModal").modal();
}

function openEditActivityDialog(sequenceName, activityName) {
  $('#btnEditActivitySave').unbind('click').click(function() {
    var name = $("#inputActivityName").val();
    if (name.length = 0) {
      return;
    }
    var mins = $("#inputActivityTime").val();
    mins = validateActivityDuration(mins);
    var reminderAfter = $("#inputActivityReminderTime").val();
    reminderAfter = validateActivityDuration(reminderAfter);
    var reminderSoundId = $("#addNewActivityModal audio").data("reminderSoundId");
    if (sequenceName == null) {
      var data = {
        duration: mins,
        reminderAfter: reminderAfter,
        reminderSoundId: reminderSoundId
      };
      if (store.get("activity-" + name) == null) {
        addActivityToList(name, data);
      }
      store.set("activity-" + name, data);
    } else {
      var sequenceData = store.get("activity-" + sequenceName);
      if (sequenceData == null || sequenceData.length == 0) {
        sequenceData = [];
      }
      if (activityName == null) {
        sequenceData.push({
          step: name,
          duration: mins,
          reminderAfter: reminderAfter,
          reminderSoundId: reminderSoundId
        });
      } else {
        for (var i = 0; i < sequenceData.length; ++i) {
          if (sequenceData[i].step == activityName) {
            sequenceData[i].duration = mins;
            sequenceData[i].reminderAfter = reminderAfter;
            sequenceData[i].reminderSoundId = reminderSoundId;
          }
        }
      }
      store.set("activity-" + sequenceName, sequenceData);
      updateEditSequenceList(sequenceData);
    }
  });

  if (activityName == null) {
    $("#inputActivityName").prop("disabled", false);
    $("#inputActivityName").val("");
    $("#inputActivityTime").val("");
    $("#inputActivityReminderTime").val("");
    $("#addNewActivityModal audio")[0].src = null;
    $("#addNewActivityModal audio").data("reminderSoundId", null);
    $("#reminderPanel").collapse("hide");
  } else {
    var data = null;
    if (sequenceName == null) {
      data = store.get("activity-" + activityName);
    } else {
      var sequenceData = store.get("activity-" + sequenceName);
      for (var i = 0; i < sequenceData.length; ++i) {
        if (sequenceData[i].step == activityName) {
          data = sequenceData[i];
        }
      }
    }
    $("#inputActivityName").val(activityName);
    $("#inputActivityName").prop("disabled", true);
    $("#inputActivityTime").val(data.duration);
    if (data.reminderSoundId) {
      $("#inputActivityReminderTime").val(data.reminderAfter);
      $("#reminderPanel").collapse("show");
      getSoundURL(data.reminderSoundId, function(url) {
        $("#addNewActivityModal audio").attr("src", url);
        $("#addNewActivityModal audio").data("reminderSoundId", data.reminderSoundId);
      });
    } else {
      $("#inputActivityReminderTime").val("");
      $("#addNewActivityModal audio")[0].src = null;
      $("#addNewActivityModal audio").data("reminderSoundId", null);
      $("#reminderPanel").collapse("hide");
    }
  }

  $("#btnActivityReminderRecordNew").unbind("click").click(function() {
    openEditSoundDialog($("#addNewActivityModal audio").data("reminderSoundId"), function(soundId) {
      getSoundURL(soundId, function(url) {
        $("#addNewActivityModal audio").attr("src", url);
        $("#addNewActivityModal audio").data("reminderSoundId", soundId);
      });
    });
  });

  soundRecorderInit();
  $('#addNewActivityModal').modal();
  $('#addNewActivityModal').unbind('shown.bs.modal').on('shown.bs.modal', function() {
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
    var item = $("<li class='row' id='" + i + "'>" + "<span class='fa fa-grip-lines-vertical'></span>" + "<span class='w-60'>" + sequenceData[i].step + "</span>" + "<button type='button' class='edit btn btn-sm'>" + "  <span class='fa fa-edit'></span> Edit" + "</button>" + "<button type='button' class='close' aria-label='Close'>" + "  <span aria-hidden='true'>&times;</span>" + "</button>" + "</li>").appendTo(ul);

    item.find("button.close").on("click", function(e) {
      e.preventDefault();
      var sequenceName = $("#inputSequenceName").val();
      var activityName = $($(this).parent().contents().get(1)).text();
      confirmAndDo("Do you want to delete '" + activityName + "'?", function () {
        var data = store.get("activity-" + sequenceName);
        for (var j = 0; j < data.length; ++j) {
          if (data[j].step == activityName) {
            data.splice(j, 1);
            break;
          }
        }
        store.set("activity-" + sequenceName, data);
        updateEditSequenceList(data);
      });
      return false;
      // Don't invoke list item's click handler.
    });

    item.find("button.edit").on("click", function(e) {
      e.preventDefault();
      var sequenceName = $("#inputSequenceName").val();
      var activityName = $($(this).parent().contents().get(1)).text();
      openEditActivityDialog(sequenceName, activityName);
      return false;
      // Don't invoke list item's click handler.
    });
  }

  $("#sortable").unbind("sortupdate").on("sortupdate", function(event, ui) {
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
    $("#editSequenceModal").unbind("shown.bs.modal").on("shown.bs.modal", function() {
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
    openEditActivityDialog(sequenceName, null);
  });

  $("#editSequenceModal").unbind("shown.bs.modal").on("shown.bs.modal", function() {
    var data = store.get("activity-" + sequenceName);
    updateEditSequenceList(data);
  });
  $("#editSequenceModal").unbind("hide.bs.modal").on("hide.bs.modal", function() {
    var durations = $("#editSequenceModal li input");
    var data = store.get("activity-" + sequenceName);
    for (var i = 0; i < durations.length; ++i) {
      data[i].duration = validateActivityDuration(parseInt(durations[i].value));
    }
    store.set("activity-" + sequenceName, data);
    $("#editSequenceModal ul").empty();
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
