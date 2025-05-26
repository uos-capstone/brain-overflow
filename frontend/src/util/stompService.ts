import { Client, IMessage, IFrame, StompHeaders, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 서버와 주고받는 메시지 타입 정의
export interface StompPayloadToServer {
    type: 'JOIN' | 'CHAT' | 'LEAVE' | string;
    roomId: string;
    content: string | null;
}

export interface StompPayloadFromServer {
    messageId?: string;
    roomId: string | number;
    senderId: string;
    senderName?: string;
    content: string | null;
    timestamp: number | string;
    type: 'JOIN' | 'CHAT' | 'LEAVE' | 'EVENT' | string;
}

// WebSocket 엔드포인트 URL
const WS_URL = 'https://api-brain-overflow.unknownpgr.com/ws';

let client: Client | null = null;

/**
 * STOMP 연결
 */
export async function connectStomp(token: string): Promise<void> {
    if (client && client.active) return;

    client = new Client({
        webSocketFactory: (): WebSocket => new SockJS(`${WS_URL}?token=${encodeURIComponent(token)}`) as WebSocket,
        connectHeaders: { token } as StompHeaders,
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: (msg: string): void => {
            console.log('[STOMP]', msg);
        },
        onConnect: (): void => {
            console.log('[StompService] 연결 성공');
        },
        onStompError: (frame: IFrame): void => {
            console.error('[StompService] STOMP 에러 프레임', frame);
        },
        onWebSocketError: (evt: Event): void => {
            console.error('[StompService] WebSocket 에러', evt);
        }
    });

    client.activate();
}

/**
 * STOMP 연결 해제
 */
export function disconnectStomp(): void {
    if (client) {
        client.deactivate();
        client = null;
        console.log('[StompService] 연결 해제');
    }
}

/**
 * 전역 user-queue 구독
 */
export function subscribeUserQueue(
    handler: (payload: StompPayloadFromServer) => void
): StompSubscription {
    if (!client) throw new Error('STOMP 클라이언트 미초기화');
    return client.subscribe('/user/queue/chat', (msg: IMessage): void => {
        const payload = JSON.parse(msg.body) as StompPayloadFromServer;
        handler(payload);
    });
}

/**
 * 방별 토픽 구독
 */
export function subscribeRoom(
    roomId: string,
    handler: (payload: StompPayloadFromServer) => void
): StompSubscription {
    if (!client) throw new Error('STOMP 클라이언트 미초기화');
    return client.subscribe(`/topic/chat/${roomId}`, (msg: IMessage): void => {
        const payload = JSON.parse(msg.body) as StompPayloadFromServer;
        handler(payload);
    });
}

/**
 * 메시지 전송
 */
export function sendMessage(
    destination: string,
    payload: StompPayloadToServer
): void {
    if (!client) throw new Error('STOMP 클라이언트 미초기화');
    client.publish({
        destination,
        body: JSON.stringify(payload)
    });
}

/**
 * 연결 상태 확인
 */
export function isConnected(): boolean {
    return client?.active ?? false;
}
