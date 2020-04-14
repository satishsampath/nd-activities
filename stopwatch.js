var activityTimerHandle = 0;
var activityTimerStartTime = null;

function secondsSinceActivityTimerStarted() {
  if (activityTimerStartTime == null)
    return 10000;
  var t = Date.parse(new Date()) - Date.parse(activityTimerStartTime);
  var seconds = Math.floor((t / 1000) % 60);
  return seconds;
}

function cancelActivityTimer() {
  if (activityTimerHandle != 0) {
    clearInterval(activityTimerHandle);
    activityTimerHandle = 0;
    activityTimerStartTime = null;
  }
}

function initActivityTimer(id, endtime, reminderAfter, reminderSoundId, finishedCallback) {
  activityTimerStartTime = new Date();
  var clock = document.getElementById(id);
  var minutesSpan = clock.querySelector('.minutes');
  var secondsSpan = clock.querySelector('.seconds');

  function getTimeRemaining(endt) {
    var t = Date.parse(endt) - Date.parse(new Date());
    var seconds = Math.floor((t / 1000) % 60);
    var minutes = Math.floor((t / 1000 / 60) % 60);
    var obj = {
      'total': t,
      'minutes': minutes,
      'seconds': seconds
    };
    if (reminderAfter && reminderSoundId) {
      var rt = Date.parse(reminderAfter) - Date.parse(new Date());
      obj.playReminder = rt < 0;
      if (obj.playReminder)
        reminderAfter = null;
    }
    return obj;
  }

  function updateClock() {
    var t = getTimeRemaining(endtime);

    minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
    secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);
    if (t.playReminder) {
      getSoundURL(reminderSoundId, function(url) {
        new Howl({
          src: [url],
          format: ['mp3']
        }).play();
      });
    }

    if (t.total <= 0) {
      cancelActivityTimer();
      setTimeout(finishedCallback, 0);  // Do this in a setTimeout so UI updates before callback.
    }
  }

  updateClock();
  activityTimerHandle = setInterval(updateClock, 1000);
}
