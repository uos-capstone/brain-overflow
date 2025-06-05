// src/api/socket.ts
//@ts-ignore
import Stomp, { Client, Frame, Message as StompMessage } from "stompjs";
import { EventEmitter } from "eventemitter3";

declare global {
  interface Window {
    SockJS: any;
  } // SockJS 생성자 타입 (더 정확한 타입 지정 가능)
}

let stompClient: Client | null = null;
const messageBus = new EventEmitter(); // 메시지 버스 인스턴스 생성

// 서버로부터 받는 채팅 메시지의 예상 구조 (roomId 포함 필수!)
export interface ServerChatMessage {
  roomId: string;
  type: "CHAT" | "EVENT";
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}
export function connectStomp(
  token: string,
  userId: string,
  onConnect: () => void,
  onError: (error: string | Frame) => void
) {
  const socket = new window.SockJS(
    `https://api-brain-overflow.unknownpgr.com/ws?token=${encodeURIComponent(
      token
    )}`
  );

  stompClient = Stomp.over(socket);
  stompClient.debug = (str: string) => {
    console.log(`[STOMP_DEBUG] ${str}`);
  };

  stompClient.connect(
    {},
    (frame?: Frame) => {
      console.log("✅ STOMP 연결됨:", frame);
      //     stompClient?.subscribe(`/topic/ai-response.${userId}`, (msg: StompMessage) => {
      //         const { userId: uid, message } = JSON.parse(msg.body);
      //         console.log(`[AI] ${uid}: ${message}`);
      // });

      console.log(userId);

      stompClient?.subscribe(`/user/queue/chat`, (msg: StompMessage) => {
        try {
          const messagePayload: ServerChatMessage = JSON.parse(msg.body);
          if (messagePayload.roomId) {
            messageBus.emit(`room-${messagePayload.roomId}`, messagePayload);
          } else {
            console.warn("roomId가 없는 메시지 수신:", messagePayload);
          }
        } catch (e) {
          console.error(`[/user/queue/chat] 메시지 파싱 오류:`, msg.body, e);
        }
      });

      // stompClient.send는 연결 후에 호출해야 합니다.
      stompClient?.send("/app/chatrooms", {});
      onConnect();
    },
    onError
  );
}

export function subscribeToRoomMessages(
  roomId: string,
  callback: (message: ServerChatMessage) => void
): () => void {
  const eventName = `room-${roomId}`;
  messageBus.on(eventName, callback);
  console.log(`[MessageBus] room '${roomId}' 메시지 리스너 추가`);

  return () => {
    // 구독 해제 함수
    messageBus.off(eventName, callback);
    console.log(`[MessageBus] room '${roomId}' 메시지 리스너 제거`);
  };
}

export function sendChatMessage(roomId: string, content: string): void {
  if (stompClient && stompClient.connected) {
    const chatMessagePayload = {
      roomId: roomId,
      type: "CHAT" as const, // 'CHAT' 리터럴 타입으로 명시
      content: content,
    };
    const chatDestination = "/app/chat"; // 👈 중요: 실제 서버의 채팅 메시지 수신 경로
    stompClient.send(chatDestination, {}, JSON.stringify(chatMessagePayload));
    console.log(
      `[STOMP] 메시지 전송 to ${chatDestination} (roomId: ${roomId}):`,
      content
    );
  } else {
    console.error("STOMP: 연결되지 않아 메시지를 보낼 수 없습니다.");
  }
}

export function disconnectStomp(): void {
  if (stompClient && stompClient.connected) {
    stompClient.disconnect(() => {
      console.log("STOMP: 연결 해제됨.");
    });
    stompClient = null;
  }
  messageBus.removeAllListeners();
}
