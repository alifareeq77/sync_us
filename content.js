let mode = 'off';
let videoElement = null;
let suppressOutgoing = false;
let lastSentAt = 0;

function getPrimaryVideo() {
  if (videoElement && document.contains(videoElement)) {
    return videoElement;
  }

  const videos = [...document.querySelectorAll('video')].filter((v) => v.readyState > 0 || v.src);
  videoElement = videos[0] || document.querySelector('video');
  return videoElement;
}

function collectState(trigger) {
  const video = getPrimaryVideo();
  if (!video) {
    return null;
  }

  return {
    trigger,
    currentTime: video.currentTime,
    paused: video.paused,
    playbackRate: video.playbackRate,
    timestamp: Date.now()
  };
}

function sendLocalState(trigger) {
  if (mode !== 'host' || suppressOutgoing) {
    return;
  }

  const now = Date.now();
  if (trigger === 'timeupdate' && now - lastSentAt < 500) {
    return;
  }
  lastSentAt = now;

  const state = collectState(trigger);
  if (!state) {
    return;
  }

  chrome.runtime.sendMessage({
    type: 'localStateUpdate',
    state
  });
}

function applyRemoteState(state) {
  const video = getPrimaryVideo();
  if (!video || mode !== 'viewer') {
    return;
  }

  suppressOutgoing = true;
  const drift = Math.abs(video.currentTime - state.currentTime);
  if (drift > 0.5) {
    video.currentTime = state.currentTime;
  }

  if (typeof state.playbackRate === 'number' && video.playbackRate !== state.playbackRate) {
    video.playbackRate = state.playbackRate;
  }

  if (state.paused && !video.paused) {
    video.pause();
  } else if (!state.paused && video.paused) {
    video.play().catch(() => {
      // Playback may require user interaction.
    });
  }

  setTimeout(() => {
    suppressOutgoing = false;
  }, 100);
}

function attachListeners() {
  const events = ['play', 'pause', 'seeking', 'ratechange', 'timeupdate'];
  events.forEach((eventName) => {
    document.addEventListener(
      eventName,
      (event) => {
        if (event.target instanceof HTMLVideoElement) {
          videoElement = event.target;
          sendLocalState(eventName);
        }
      },
      true
    );
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'setMode') {
    mode = message.mode;
    sendResponse({ ok: true, hasVideo: !!getPrimaryVideo() });
    return true;
  }

  if (message.type === 'applyRemoteState') {
    applyRemoteState(message.state);
    sendResponse({ ok: true });
    return true;
  }
});

attachListeners();
