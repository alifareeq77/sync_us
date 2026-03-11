let socket = null;
let syncConfig = null;
let targetTabId = null;

function disconnectSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

function connectSocket(config) {
  disconnectSocket();

  socket = new WebSocket(config.backendUrl);

  socket.addEventListener('open', () => {
    socket.send(
      JSON.stringify({
        type: 'join',
        room: config.room,
        mode: config.mode
      })
    );
  });

  socket.addEventListener('message', async (event) => {
    if (!syncConfig || syncConfig.mode !== 'viewer') {
      return;
    }

    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }

    if (payload.type !== 'sync' || !payload.state || targetTabId == null) {
      return;
    }

    try {
      await chrome.tabs.sendMessage(targetTabId, {
        type: 'applyRemoteState',
        state: payload.state
      });
    } catch {
      // Tab might not be ready.
    }
  });

  socket.addEventListener('close', () => {
    socket = null;
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'startSync') {
    syncConfig = message.config;
    targetTabId = message.tabId;
    connectSocket(syncConfig);

    chrome.tabs.sendMessage(targetTabId, {
      type: 'setMode',
      mode: syncConfig.mode
    });

    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'stopSync') {
    disconnectSocket();

    if (targetTabId != null) {
      chrome.tabs.sendMessage(targetTabId, {
        type: 'setMode',
        mode: 'off'
      });
    }

    syncConfig = null;
    targetTabId = null;
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'localStateUpdate' && socket && syncConfig?.mode === 'host') {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'sync',
          room: syncConfig.room,
          state: message.state
        })
      );
    }
  }
});
