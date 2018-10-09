var finishActivitySound = new Howl({
  src: ['beep.mp3'],
  loop: true,
});

function addActivityToList(name, mins) {
  mins = validateActivityDuration(mins);
  $("#playlist-listgroup").append(
    "<a class='list-group-item list-group-item-action'>" + name + 
        "<input size='6' class='ml-5 mr-1' type='text' value='" + mins + "'>" +
        "<label>mins</label>" +
        "<button type='button' class='close' aria-label='Close'>" +
        "<span aria-hidden='true'>&times;</span>" +
        "</button>" +
    "</a>");
}

function removeActivityFromList(name) {
  $("#playlist-listgroup a.list-group-item:contains('" + name + "')").remove();
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
  $("#editActivities").hide();
  $("#finishedEditActivities").show();
  $("#addNewActivityForm").show();
  $("#playlist-listgroup input").show();
  $("#playlist-listgroup label").show();
  $("#playlist-listgroup button.close").show();
}

function finishedEditActivities() {
  $("#editActivities").show();
  $("#finishedEditActivities").hide();
  $("#addNewActivityForm").hide();
  $("#playlist-listgroup input").hide();
  $("#playlist-listgroup label").hide();
  $("#playlist-listgroup button.close").hide();
  iterateAllActivities(function(name, value) {
    var mins = $("#playlist-listgroup a:contains('" + name + "') > input").val();
    mins = validateActivityDuration(mins);
    value.duration = mins;
    $("#playlist-listgroup a:contains('" + name + "') > input").val(mins);
    store.set("activity-" + name, value);
  });
}

function isEditingActivities() {
  return $("#finishedEditActivities").css('display') != 'none';
}

function addNewActivity() {
  var name = $("#inputNewActivity").val();
  var mins = $("#inputNewActivityTime").val();
  mins = validateActivityDuration(mins);
  store.set("activity-" + name, { duration: mins });
  addActivityToList(name, mins);
  $("#inputNewActivity").val("");
  $("#inputNewActivityTime").val("");
  return false;
}

function startActivity(name) {
  $("#activityListContainer").hide();
  $("#clockContainer").show();
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
  $("#playlist-listgroup button.close").on("click", function(e) {
    e.preventDefault();
    var name = $(this).parent().contents().get(0).nodeValue;
    if (window.confirm("Do you want to delete the activity '" + name + "'?")) {
      store.remove("activity-" + name);
      removeActivityFromList(name);
    }
    return false;  // Don't invoke list item's click handler.
  })
  $("#playlist-listgroup a").click(function (e) {
    e.preventDefault();
    if (!isEditingActivities()) {
      var name = $(this).contents().get(0).nodeValue;
      startActivity(name);
    }
  }).children().click(function(e) {
    return false;
  });
  $("#finishActivity").click(function(e) {
    e.preventDefault();
    finishActivity(true);
  })
  finishedEditActivities();
  finishActivity(true);
}

$(document).ready(setup);
