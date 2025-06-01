// src/util/api.ts

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://api-brain-overflow.unknownpgr.com';
export interface Chatroom {
  id: string;
  name: string;
  participants: Participant[];
}

// 더미 데이터 리턴
/*
const DUMMY_CHATROOMS: Chatroom[] = [
  {
    id: "1",
    name: "방1",
    participants: [
      { id: "user1", userName: "Alice" },
      { id: "user2", userName: "Bob" },
      { id: "userMe", userName: "나" },
    ],
  },
  {
    id: "2",
    name: "방2",
    participants: [
      { id: "user3", userName: "Charlie" },
      { id: "userMe", userName: "나" },
    ],
  },
  {
    id: "3",
    name: "방3333",
    participants: [
      { id: "user1", userName: "Alice" },
      { id: "user4", userName: "David" },
      { id: "userMe", userName: "나" },
    ],
  },
];
*/

// util/api.ts

export interface Participant {
    id: string;
    nickName: string;
}

export interface Chatroom {
    id: string;
    name: string;
    participants: Participant[];
}

export async function fetchChatrooms(): Promise<Chatroom[]> {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('토큰이 없습니다. 로그인부터 해주세요.');

    const res = await fetch(`${API_BASE}/rooms/chatroom`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        throw new Error(`채팅방 조회 실패: ${res.status} ${res.statusText}`);
    }

    const { rooms } = await res.json() as {
        rooms: Array<{
            roomId: number;
            roomName: string;
            lastMessage?: string;
            lastMessageTime?: string;
        }>;
    };

    const chatrooms = await Promise.all(
        rooms.map(async r => {
            const memRes = await fetch(
                `${API_BASE}/rooms/chatroom/${r.roomId}/members`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            if (!memRes.ok) {
                return {
                    id: r.roomId.toString(),
                    name: r.roomName,
                    participants: [] as Participant[],
                };
            }
            const json = await memRes.json() as {
                code: string;
                message: string;
                data: Array<{ userId: string; nickname: string }>;
            };

            return {
                id: r.roomId.toString(),
                name: r.roomName,
                participants: json.data.map(u => ({
                    id: u.userId,
                    nickName: u.nickname,
                })),
            };
        })
    );

    return chatrooms;
}


const DUMMY_PARTICIPANTS: Participant[] = [
  { id: "user1", nickName: "Alice" },
    { id: "user2", nickName: "Bob" },
    { id: "user3", nickName: "Charlie" },
    { id: "user4", nickName: "David" },
    { id: "user5", nickName: "Eve" },
    { id: "user6", nickName: "Frank" },
    { id: "user7", nickName: "Grace" },
    { id: "user8", nickName: "Henry" },
    { id: "userMe", nickName: "나" },
];

export async function fetchParticipants(): Promise<Participant[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(DUMMY_PARTICIPANTS), 300);
  });
}

export const CUR_USER: Participant = {
  id: "userMe",
  nickName: "나",
};
interface MeResponse {
    code: string;
    message: string;
    data: {
        nickname: string;
        role: string;
        username: string;
    };
}

export async function getCurrentUser(): Promise<Participant> {
    const token = localStorage.getItem('accessToken');
    const id = localStorage.getItem('userId');
    if (!token || !id) {
        throw new Error('로그인이 필요합니다.');
    }

    const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `유저 조회 실패: ${res.status}`);
    }

    const body = await res.json() as MeResponse;

    return {
        id: id,
        nickName: body.data.nickname,
    };
}
export interface ChatMessageData {
  messageId: string;
  senderName: string;
  senderId: string;
  content: string;
    timestamp: string;
    type: string;
}

/*
const DUMMY_MESSAGES: ChatMessageData[] = [
  {
    messageId: "1",
    senderId: "12345",
    senderName: "상대방2",
    content: "aaaa",
        timestamp: "오후 2:00",
        type: "CHAT",
  },
  {
    messageId: "2",
    senderId: "userMe",
    senderName: "나",
    content: "ㅡㅡㅡㅡㅡㅡㅡㅡ공지ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ",
      timestamp: "오후 2:01",
      type: "EVENT",
  },
  {
    messageId: "3",
    senderId: "12345",
    senderName: "상대방1",
    content: "ㄷㄱㄺㄹㄹㄷㄱㄹ",
      timestamp: "오후 2:01",
      type: "CHAT",
  },
  {
    messageId: "4",
    senderId: "12345",
    senderName: "상대방2",
    content: "aaaa",
      timestamp: "오후 2:00",
      type: "CHAT",
  },
  {
    messageId: "5",
    senderId: "userMe",
    senderName: "qqq",
    content: "긴메시지ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ",
      timestamp: "오후 2:01",
      type: "CHAT",
  },
  {
    messageId: "6",
    senderId: "12345",
    senderName: "상대방1",
    content: "ㄷㄱㄺㄹㄹㄷㄱㄹ",
      timestamp: "오후 2:01",
      type: "CHAT",
  },
];
*/
export async function fetchChats(
    roomId: string,
    page: number,
): Promise<ChatMessageData[]> {
    console.log(`[api.ts fetchChats] 실제 API 호출 시작 - roomId: ${roomId}, page: ${page}`);
    const token = localStorage.getItem('accessToken'); // 또는 'jwtToken' 등 실제 사용하는 토큰 키

    if (!token) {
        console.error('[api.ts fetchChats] 인증 토큰이 없습니다.');
        return []; // 임시로 빈 배열 반환
    }

    try {
        const response = await fetch(
            `${API_BASE}/rooms/chatroom/${roomId}?page=${page}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            let errorData: any = `API 요청 실패 (상태 ${response.status})`;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = await response.text();
                console.error(e);
            }
            console.error('[api.ts fetchChats] API 호출 실패:', response.status, response.statusText, errorData);
            if (typeof errorData === 'string' && (errorData.trim().startsWith('<!doctype html>') || errorData.trim().startsWith('<html'))) {
                console.error('[api.ts fetchChats] 서버가 JSON 대신 HTML을 반환했습니다 (API 오류).');
                throw new Error('Server returned HTML instead of JSON for API error.');
            }
            throw new Error(typeof errorData === 'string' ? errorData : JSON.stringify(errorData));
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const responseText = await response.text();
            console.warn('[api.ts fetchChats] API 응답이 JSON이 아닙니다. Content-Type:', contentType, '응답 본문:', responseText);
            // 응답이 아예 없는 경우 (예: 204 No Content)도 고려할 수 있습니다.
            if (response.status === 204 || !responseText) return [];
            throw new Error('API response was not JSON.');
        }

        const data = await response.json() as { content: ChatMessageData[], totalElements?: number /* 등 기타 페이징 정보 */ };

        if (!data.content || !Array.isArray(data.content)) {
            console.warn('[api.ts fetchChats] API 응답에 "content" 배열이 없거나 배열이 아닙니다.', data);
            return [];
        }

        data.content.sort((a, b) => {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });

        // API 응답 데이터를 ChatMessageData 형식으로 변환
        const chatMessages: ChatMessageData[] = data.content.map((item, index) => {
            // messageId 처리: API 응답에 messageId가 없다면 임시 ID 생성
            const messageId = item.messageId || `api-msg-${item.senderId}-${new Date(item.timestamp).getTime()}-${index}`;
            const senderName = item.senderName;

            // timestamp 형식 변환 (ISO 8601 -> "오후 2:00" 등)
            const formattedTimestamp = new Date(item.timestamp).toLocaleTimeString('ko-KR', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });

            return {
                messageId: messageId,
                senderId: item.senderId,
                senderName: senderName, // senderId 값이 여기에 할당됨
                content: item.content,
                timestamp: formattedTimestamp,
                type: item.type,
            };
        });

        console.log(`[api.ts fetchChats] API 호출 성공, 변환된 메시지 ${chatMessages.length}건`);
        return chatMessages;

    } catch (error) {
        console.error('[api.ts fetchChats] 메시지 로드 중 예외 발생:', error);
        return [];
    }
}

// 방 추가
export async function addRoom(roomName: string): Promise<string> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('로그인이 필요합니다.');
    }

    const res = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ roomName }),
    });

    if (!res.ok) {
        // 400, 401, 403 등 에러 처리
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `room 생성 실패: ${res.status}`);
    }

    const body = await res.json() as {
        code: string;
        message: string;
        data: number; 
    };

    return body.data.toString();
}

export async function addUserToRoom(
  userId: string,
  roomName: string
): Promise<void> {
  console.log("addUserToRoom", roomName, userId);
  return;
}

export async function deleteUserFromRoom(
  userId: string,
  roomName: string
): Promise<void> {
  console.log("deleteUserFromRoom", userId, roomName);
  return;
}
