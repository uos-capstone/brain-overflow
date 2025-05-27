import http from 'k6/http';
import ws from 'k6/ws';
import {check, sleep} from 'k6';
import {Trend, Counter} from 'k6/metrics';

/* ──── k6 옵션 ──── */
export let options = {
  scenarios: {
    chatload: {
      executor: 'constant-vus',
      vus: 500,
      duration: '20s',
      gracefulStop: '10s',
    },
  },
  thresholds: {
    'chat_latency': ['p(95)<200'],   // 95% 메시지 왕복 <200ms
    'chat_errors': ['rate<0.01'],     // 에러율 <1%
  },
};

/* ──── 커스텀 메트릭 ──── */
let errorCount = new Counter('chat_errors');
let latencyTrend = new Trend('chat_latency', true);

/* ──── 헬퍼 함수 ──── */
function portForVU(vu) {
  return vu % 2 === 0 ? 8082 : 8080;
}

function httpBase(vu) {
  return `http://localhost:${portForVU(vu)}`;
}

function wsUrl(vu, token) {
  const port = portForVU(vu);
  return `ws://localhost:${port}/ws/websocket?token=${encodeURIComponent(
      token)}`;
}

/* ──── VU 시나리오 ──── */
export default function () {
  const vu = __VU;

  // 1) 로그인
  const loginRes = http.post(
      `${httpBase(vu)}/auth/login`,
      JSON.stringify({username: `string${vu}`, password: `string${vu}`}),
      {headers: {'Content-Type': 'application/json'}}
  );
  if (!check(loginRes, {'login 200': r => r.status === 200})) {
    errorCount.add(1);
    return;
  }
  const token = loginRes.json('data.token');
  const authHeader = {headers: {Authorization: `Bearer ${token}`}};

  // 2) WebSocket(STOMP) 연결
  let sentTimestamps = {};
  const res = ws.connect(wsUrl(vu, token), null, socket => {
    // STOMP CONNECT
    socket.send(
        'CONNECT\n' +
        'accept-version:1.2\n' +
        `token:${token}\n` +
        'heart-beat:10000,10000\n\n' +
        '\u0000'
    );

    socket.on('message', frame => {
      // CONNECTED 응답 오면 방 조회·구독·메시지 발송 시작
      if (frame.startsWith('CONNECTED')) {
        // 3) 실제 채팅방 목록 조회
        const roomsRes = http.get(`${httpBase(vu)}/rooms/chatroom`, authHeader);
        const rooms = roomsRes.json('rooms') || [];
        const roomId = rooms.length ? rooms[0].roomId : 'default-room';

        // SUBSCRIBE
        socket.send(
            'SUBSCRIBE\n' +
            `id:sub-${vu}\n` +
            'destination:/user/queue/chat\n\n' +
            '\u0000'
        );

        // 4) 1~3초 간격으로 채팅 발송
        socket.setInterval(() => {
          const messageId = `${vu}-${Date.now()}`;
          sentTimestamps[messageId] = Date.now();
          const payload = {
            type: 'CHAT',
            roomId: roomId,
            content: `hello from VU${vu} @${new Date().toISOString()}`,
            messageId: messageId,
          };
          socket.send(
              'SEND\n' +
              'destination:/app/chat\n' +
              'content-type:application/json\n\n' +
              JSON.stringify(payload) +
              '\u0000'
          );
        }, (Math.floor(Math.random() * 3) + 1) * 1000);
      }

      // MESSAGE 프레임 처리: latency 계산
      if (frame.startsWith('MESSAGE')) {
        // 프레임 바디(JSON) 추출
        const body = frame.split('\n\n')[1]?.slice(0, -1);
        try {
          const msg = JSON.parse(body);
          const sentAt = sentTimestamps[msg.messageId];
          if (sentAt) {
            latencyTrend.add(Date.now() - sentAt);
            delete sentTimestamps[msg.messageId];
          }
        } catch (_) {
        }
      }
    });

    socket.on('error', () => errorCount.add(1));

    // 5) 소켓을 최소 60초간 유지
    socket.setTimeout(() => {
      socket.close();
    }, 60000);
  });

  check(res, {'ws status 101': r => r && r.status === 101});
  sleep(1);
}
