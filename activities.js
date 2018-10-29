var finishActivitySound = new Howl({
  src: ['beep.mp3'],
  loop: true,
});

function addActivityToList(name, mins) {
  mins = validateActivityDuration(mins);
  var item = $(
    "<a class='list-group-item list-group-item-action'>" + name + 
        "<input size='6' class='ml-5 mr-1' type='text' value='" + mins + "'>" +
        "<label>mins</label>" +
        "<button type='button' class='close' aria-label='Close'>" +
        "<span aria-hidden='true'>&times;</span>" +
        "</button>" +
    "</a>").appendTo("#activities-listgroup");;

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
    if (window.confirm("Do you want to delete the activity '" + name + "'?")) {
      store.remove("activity-" + name);
      removeActivityFromList(name);
    }
    return false;  // Don't invoke list item's click handler.
  });
}

function removeActivityFromList(name) {
  $("#activities-listgroup a.list-group-item:contains('" + name + "')").remove();
}

function iterateAllActivities(fn) {
  store.each(function(value, key) {
    var prefix = "activity-";
    if (!key.startsWith(prefix))
      return;
    key = key.substr(prefix.length);
    fn(key, value);
  });
}

function validateActivityDuration(val) {
  if (!val || isNaN(val) || val <= 0 || val >= 30)
    val = 10;
  return val;
}

function editActivities() {
  if (isDoingActivity())
    return;  // Don't do anything if user is on a timer now.

  $("#activityListEmptyAlert").hide();
  $("#editActivities").hide();
  $("#finishedEditActivities").show();
  $("#addNewActivityForm").show();
  $("#activities-listgroup input").show();
  $("#activities-listgroup label").show();
  $("#activities-listgroup button.close").show();
}

function finishedEditActivities() {
  $("#activityAddedAlert").hide();
  $("#editActivities").show();
  $("#finishedEditActivities").hide();
  $("#addNewActivityForm").hide();
  $("#activities-listgroup input").hide();
  $("#activities-listgroup label").hide();
  $("#activities-listgroup button.close").hide();
  iterateAllActivities(function(name, value) {
    var mins = $("#activities-listgroup a:contains('" + name + "') > input").val();
    mins = validateActivityDuration(mins);
    value.duration = mins;
    $("#activities-listgroup a:contains('" + name + "') > input").val(mins);
    store.set("activity-" + name, value);
  });
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

function addNewActivity() {
  var name = $("#inputNewActivity").val();
  var mins = $("#inputNewActivityTime").val();
  mins = validateActivityDuration(mins);
  store.set("activity-" + name, { duration: mins });
  addActivityToList(name, mins);
  $("#inputNewActivity").val("");
  $("#inputNewActivityTime").val("");
  $("#activityAddedAlert").show();
  return false;
}

function startActivity(name) {
  $("#activityListContainer").hide();
  $("#clockContainer").show();
  $("#clockContainer #title").text(name);
  var mins = store.get("activity-" + name).duration;
  mins = validateActivityDuration(mins);
  initStopWatch("clockDiv",
      new Date(Date.parse(new Date()) + mins * 60000),
      finishActivity);
}

function finishActivity(userCancelled) {
  if (userCancelled) {
    cancelStopWatch();
  } else {
    finishActivitySound.play();
    $('#activityFinishedModal')
      .on('hidden.bs.modal', function (e) {
        finishActivitySound.stop();
      })
      .modal();
  }
  $("#clockContainer").hide();
  $("#activityListContainer").show();
}

function setup() {
  iterateAllActivities(function(name, value) {
    addActivityToList(name, value.duration);
  });
  $("#finishActivity").click(function(e) {
    e.preventDefault();
    finishActivity(true);
  })
  finishedEditActivities();
}

$(document).ready(setup);
