function addActivityToList(name) {
  $("#playlist-listgroup").append("<button type='button' class='list-group-item list-group-item-action'>" + name + "</button>");
}

function addNewActivity() {
  var name = $("#inputNewActivity").val();
  store.set("activity-" + name, {});
  addActivityToList(name);
  $("#inputNewActivity").clear();
  return false;
}

function setup() {
  store.each(function(value, key) {
    var prefix = "activity-";
    if (!key.startsWith(prefix))
      return;
    key = key.substr(prefix.length);
    addActivityToList(key);
  });
}

$(document).ready(setup);
