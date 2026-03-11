# Video Sync Bridge (Chrome Extension + local backend)

This repo contains:

- A Chrome extension that reads the active tab's `<video>` element state.
- A lightweight WebSocket backend for relaying sync events to another device.

## What it does

- **Host mode**: Sends local video state (`play/pause/time/rate`) from the selected tab.
- **Viewer mode**: Applies incoming state to a video element on the selected tab.

## Run backend (on current laptop)

```bash
cd backend
npm install
npm start
```

Backend defaults to `ws://localhost:8080`.

## Load extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and pick the repository root (`/workspace/sync_us`).

## Use it for testing

1. On the host browser tab containing the video:
   - Open extension popup.
   - Set backend URL (e.g. `ws://localhost:8080` for same laptop).
   - Set room ID (e.g. `demo-room`).
   - Choose **Host** and click **Start**.
2. On the other device/browser tab:
   - Use same backend URL reachable over network (e.g. `ws://<laptop-ip>:8080`).
   - Use same room ID.
   - Choose **Viewer** and click **Start**.

## Notes

- The extension uses the first video element found in the tab.
- Viewer playback may still require a user gesture on some sites before autoplay is allowed.
