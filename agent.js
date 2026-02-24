
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  setInterval(() => {
    ws.send(JSON.stringify({ status: 'scan', timestamp: Date.now() }));
  }, 10000);
});
