import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30s
    { duration: '1m', target: 50 },  // Stay at 50 users for 1m
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30s
  ],
};

const BASE_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000';

export default function () {
  // Test REST Health endpoint
  const res = http.get(`${BASE_URL}/health`);
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);

  // Test WebSocket connection (Simulating a user chat)
  // For a real test, we would generate a valid JWT token
  const url = `${WS_URL}/ws?mode=chat&token=TEST_TOKEN`;
  const response = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      // Send a dummy message
      socket.send(JSON.stringify({
        type: 'USER_FINAL',
        content: 'Hello, this is a load test message.'
      }));
    });

    socket.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.type === 'AI_FINAL') {
        socket.close();
      }
    });

    socket.on('close', () => {
      // closed
    });
    
    socket.on('error', (e) => {
      // error
    });
  });

  check(response, { 'websocket connected successfully': (r) => r && r.status === 101 });
  sleep(1);
}
