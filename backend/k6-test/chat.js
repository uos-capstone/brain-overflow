import http from 'k6/http';
import ws from 'k6/ws';
import {check, sleep} from 'k6';
import {Trend, Counter} from 'k6/metrics';

/* ─────────── options ─────────── */
export let options = {
  scenarios: {
    chatload: {
      executor: 'constant-vus',
      vus: 50,           // 100 VU (string1 ~ string100)
      duration: '20s',
      gracefulStop: '20s'
    },
  },
  thresholds: {
    'http_req_duration{type:login}': ['p(95)<500'],
    'ws_connecting': ['p(95)<200'],
    'chat_errors': ['rate<0.01'],
  },
};

/* ─────────── custom metrics ─────────── */
let errorCount = new Counter('chat_errors');

/* ─────────── helpers ─────────── */
function portForVU(vu) {
  return vu % 2 === 0 ? 8082 : 8080;
}

function httpBase(vu) {
  return `http://localhost:${portForVU(vu)}`;
}

function wsUrl(vu, token) {
  const port = vu % 2 === 0 ? 8082 : 8080;
  // 핵심: /ws/websocket 로 직접 연결
  return `ws://localhost:${port}/ws/websocket?token=${encodeURIComponent(
      token)}`;
}

/* ─────────── main VU logic ─────────── */
export default function () {
  const vu = __VU;
  const username = `string${vu}`;
  const password = `string${vu}`;

  /* 1) 로그인 */
  const loginRes = http.post(
      `${httpBase(vu)}/auth/login`,
      JSON.stringify({username, password}),
      {
        headers: {'Content-Type': 'application/json'},
        tags: {type: 'login'},
      },
  );

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'got token': (r) => !!r.json('data.token'),
  });

  if (loginRes.status !== 200) {
    errorCount.add(1);
    return;
  }

  const token = loginRes.json('data.token');
  const authHeader = {'Authorization': `Bearer ${token}`};

  /* 2) WebSocket(STOMP over SockJS) 연결 */
  const res = ws.connect(wsUrl(vu, token), null, (socket) => {

    /* STOMP CONNECT */
    socket.send(
        'CONNECT\n' +
        'accept-version:1.2\n' +
        `token:${token}\n` +
        'heart-beat:0,0\n\n' +
        '\u0000',
    );

    /* 서버 프레임 수신 */
    socket.on('message', (frame) => {
      /* CONNECTED 이후 실행 */
      if (frame.startsWith('CONNECTED')) {

        /* 3) 채팅방 목록 조회 */
        const roomsRes = http.get(`${httpBase(vu)}/rooms/chatroom`,
            {headers: authHeader});
        const rooms = roomsRes.json('rooms') || [];
        const roomId = rooms.length ? rooms[0].roomId : 'default-room';

        /* 4) 구독 */
        socket.send(
            'SUBSCRIBE\n' +
            `id:sub-${vu}\n` +
            'destination:/user/queue/chat\n\n' +
            '\u0000',
        );

        /* 5) 1초마다 채팅 발송 */
        socket.setInterval(() => {
          const content = `hello from VU${vu} @${new Date().toISOString()}`;
          const payload = JSON.stringify({type: 'CHAT', roomId, content});

          socket.send(
              'SEND\n' +
              'destination:/app/chat\n' +
              'content-type:application/json\n\n' +
              payload +
              '\u0000',
          );
        }, 1000);
      }

    });

    socket.on('error', () => errorCount.add(1));
  });

  /* WebSocket 핸드셰이크 검사 */
  check(res, {'ws status 101': (r) => r && r.status === 101});

  sleep(1);   // 짧은 휴식으로 약간의 think-time 부여
}
