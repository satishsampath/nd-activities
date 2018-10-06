function addActivityToList(name) {
  $("#playlist-listgroup").append(
    "<a class='list-group-item list-group-item-action'>" + name + 
        "<button type='button' class='close' aria-label='Close'>" +
        "<span aria-hidden='true'>&times;</span>" +
        "</button>" +
    "</a>");
}

function removeActivityFromList(name) {
  $("#playlist-listgroup a.list-group-item:contains('" + name + "')").remove();
}

function editActivities() {
  $("#addNewActivityForm").show();
  $("#playlist-listgroup button.close").show();
  $("#editActivities").hide();
  $("#finishedEditActivities").show();
}

function finishedEditActivities() {
  $("#addNewActivityForm").hide();
  $("#playlist-listgroup button.close").hide();
  $("#editActivities").show();
  $("#finishedEditActivities").hide();
}

function addNewActivity() {
  var name = $("#inputNewActivity").val();
  store.set("activity-" + name, {});
  addActivityToList(name);
  $("#inputNewActivity").val("");
  return false;
}

function startActivity(name) {
  $("#activityListContainer").hide();
  $("#clockContainer").show();
  initStopWatch("clockDiv",
      new Date(Date.parse(new Date()) + 15 * 1000),
      finishActivity);
}

function finishActivity(userCancelled) {
  if (userCancelled) {
    cancelStopWatch();
  } else {
    alert("Activity finished.");
  }
  $("#clockContainer").hide();
  $("#activityListContainer").show();
}

function setup() {
  store.each(function(value, key) {
    var prefix = "activity-";
    if (!key.startsWith(prefix))
      return;
    key = key.substr(prefix.length);
    addActivityToList(key);
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
  $("#playlist-listgroup a").on("click", function (e) {
    e.preventDefault();
    var name = $(this).contents().get(0).nodeValue;
    startActivity(name);
  });
  $("#finishActivity").on("click", function(e) {
    e.preventDefault();
    finishActivity(true);
  })
  finishedEditActivities();
  finishActivity(true);
}

$(document).ready(setup);
