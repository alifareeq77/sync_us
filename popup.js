const backendUrlInput = document.getElementById('backendUrl');
const roomInput = document.getElementById('room');
const modeSelect = document.getElementById('mode');
const statusEl = document.getElementById('status');

const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs.length || tabs[0].id == null) {
    throw new Error('No active tab found.');
  }
  return tabs[0].id;
}

function updateStatus(text) {
  statusEl.textContent = text;
}

async function saveSettings() {
  await chrome.storage.local.set({
    backendUrl: backendUrlInput.value.trim(),
    room: roomInput.value.trim(),
    mode: modeSelect.value
  });
}

async function loadSettings() {
  const settings = await chrome.storage.local.get(['backendUrl', 'room', 'mode']);
  if (settings.backendUrl) backendUrlInput.value = settings.backendUrl;
  if (settings.room) roomInput.value = settings.room;
  if (settings.mode) modeSelect.value = settings.mode;
}

startBtn.addEventListener('click', async () => {
  try {
    await saveSettings();
    const tabId = await getActiveTabId();

    await chrome.runtime.sendMessage({
      type: 'startSync',
      tabId,
      config: {
        backendUrl: backendUrlInput.value.trim(),
        room: roomInput.value.trim(),
        mode: modeSelect.value
      }
    });

    updateStatus(`Sync started as ${modeSelect.value} on tab ${tabId}`);
  } catch (error) {
    updateStatus(`Error: ${error.message}`);
  }
});

stopBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'stopSync' });
  updateStatus('Sync stopped');
});

loadSettings().catch(() => {
  updateStatus('Failed to load settings');
});
