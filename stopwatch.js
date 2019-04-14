var activityTimerHandle = 0;

function cancelActivityTimer() {
  if (activityTimerHandle != 0) {
    clearInterval(activityTimerHandle);
    activityTimerHandle = 0;
  }
}

function initActivityTimer(id, endtime, finishedCallback) {
  var clock = document.getElementById(id);
  var minutesSpan = clock.querySelector('.minutes');
  var secondsSpan = clock.querySelector('.seconds');

  function getTimeRemaining(endtime) {
    var t = Date.parse(endtime) - Date.parse(new Date());
    var seconds = Math.floor((t / 1000) % 60);
    var minutes = Math.floor((t / 1000 / 60) % 60);
    return {
      'total': t,
      'minutes': minutes,
      'seconds': seconds
    };
  }

  function updateClock() {
    var t = getTimeRemaining(endtime);

    minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
    secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

    if (t.total <= 0) {
      cancelActivityTimer();
      setTimeout(finishedCallback, 0);  // Do this in a setTimeout so UI updates before callback.
    }
  }

  updateClock();
  activityTimerHandle = setInterval(updateClock, 1000);
}
