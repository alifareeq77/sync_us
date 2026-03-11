import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT || 8080);
const wss = new WebSocketServer({ port });

const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  return rooms.get(roomId);
}

wss.on('connection', (ws) => {
  let joinedRoom = null;
  let mode = 'viewer';

  ws.on('message', (buffer) => {
    let message;
    try {
      message = JSON.parse(buffer.toString());
    } catch {
      return;
    }

    if (message.type === 'join' && message.room) {
      joinedRoom = message.room;
      mode = message.mode === 'host' ? 'host' : 'viewer';
      getRoom(joinedRoom).add(ws);
      return;
    }

    if (message.type === 'sync' && joinedRoom && mode === 'host') {
      const peers = getRoom(joinedRoom);
      for (const client of peers) {
        if (client === ws || client.readyState !== client.OPEN) {
          continue;
        }

        client.send(
          JSON.stringify({
            type: 'sync',
            state: message.state
          })
        );
      }
    }
  });

  ws.on('close', () => {
    if (joinedRoom && rooms.has(joinedRoom)) {
      rooms.get(joinedRoom).delete(ws);
      if (rooms.get(joinedRoom).size === 0) {
        rooms.delete(joinedRoom);
      }
    }
  });
});

console.log(`Video sync backend listening on ws://localhost:${port}`);
