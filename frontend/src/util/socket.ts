// src/api/socket.ts
//@ts-ignore
import Stomp from "stompjs";

type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

type StompMessage = {
  body: string;
  headers: Record<string, string>;
  command: string;
  subscription: string;
  ack: () => void;
  nack: () => void;
};

let stompClient: any = null;

export function connectStomp(
  token: string,
  userId: string,
  onConnect: () => void,
  onError: (error: string) => void
) {
  const socket = new window.SockJS(
    `https://brain-overflow.unknownpgr.com/ws?token=${encodeURIComponent(
      token
    )}`
  );

  stompClient = Stomp.over(socket);
  Stomp.debug = (str: string) => console.log(`[STOMP] ${str}`);

  stompClient.connect(
    {},
    (frame: StompFrame) => {
      console.log("✅ STOMP 연결됨:", frame);

      stompClient.subscribe(
        `/topic/ai-response.${userId}`,
        (msg: StompMessage) => {
          const { userId: uid, message } = JSON.parse(msg.body);
          console.log(`[AI] ${uid}: ${message}`);
        }
      );

      stompClient.subscribe("/user/queue/chatrooms", (msg: StompMessage) => {
        const { rooms } = JSON.parse(msg.body);
        console.log("📦 채팅방 목록:", rooms);
      });

      stompClient.subscribe(`/topic/room.general`, (msg: StompMessage) => {
        try {
          const { message } = JSON.parse(msg.body);
          console.log("💬 채팅 메시지:", message);
        } catch (e) {
          console.error("메시지 파싱 오류:", msg.body);
        }
      });

      stompClient.send("/app/chatrooms", {});
      onConnect();
    },
    onError
  );
}
