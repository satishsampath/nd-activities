var gumStream = null; //stream from getUserMedia()
var recorder = null; //WebAudioRecorder object
var isRecording = false;

function getSoundURL(id, fnSoundURLDone) {
  localforage.getItem(id).then(function(value) {
    fnSoundURLDone(value == null ? null : URL.createObjectURL(value));
  }).catch(function(err) {
    fnSoundURLDone(null);
  });
}

function soundRecorderInit() {
  if (recorder)
    return;  // already initialized.

  var constraints = {
    audio: true,
    video: false
  }
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    gumStream = stream;
    var audioContext = new AudioContext();
    var input = audioContext.createMediaStreamSource(stream); 
    recorder = new WebAudioRecorder(input, {
      workerDir: "webaudiorecorder/",
      encoding: "mp3",
      onEncoderLoading: function(recorder, encoding) {
        // show "loading encoder..." display 
        console.log("Loading " + encoding + " encoder...");
      },
      onEncoderLoaded: function(recorder, encoding) {
        // hide "loading encoder..." display
        console.log(encoding + " encoder loaded");
      }
    });
    recorder.setOptions({
      timeLimit: 15,
      encodeAfterRecord: true,
      mp3: {
        bitRate: 96
      }
    });
  }).catch(function(err) {});
}

function deleteSound(id) {
  localforage.removeItem(id);
}

function soundRecorderStart(fnRecordingDone) {
  if (isRecording)
    return;  // already recording
  if (!recorder)
    return;  // have to initialize before calling this.
  recorder.onComplete = function(recorder, blob) {
    console.log("Encoding complete");
    var id = new Date().toISOString() + ".mp3";
    localforage.setItem(id, blob).then(function() {
      fnRecordingDone(id);
    });
  };
  recorder.startRecording();
  console.log("Recording started");
}

function soundRecorderStop() {
  console.log("stopRecording() called");
  gumStream.getAudioTracks()[0].stop();  //stop microphone access 
  recorder.finishRecording();
  console.log('Recording stopped');
}
