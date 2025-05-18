// src/util/api.ts

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://api-brain-overflow.unknownpgr.com';
export interface Participant {
  id: string;
  userName: string;
}

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
    userName: string;
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
                    userName: u.nickname,
                })),
            };
        })
    );

    return chatrooms;
}


const DUMMY_PARTICIPANTS: Participant[] = [
  { id: "user1", userName: "Alice" },
  { id: "user2", userName: "Bob" },
  { id: "user3", userName: "Charlie" },
  { id: "user4", userName: "David" },
  { id: "user5", userName: "Eve" },
  { id: "user6", userName: "Frank" },
  { id: "user7", userName: "Grace" },
  { id: "user8", userName: "Henry" },
  { id: "userMe", userName: "나" },
];

export async function fetchParticipants(): Promise<Participant[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(DUMMY_PARTICIPANTS), 300);
  });
}

export const CUR_USER: Participant = {
  id: "userMe",
  userName: "나",
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
    if (!token) {
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
        id: "user_id",
        userName: body.data.nickname,
    };
}
export interface ChatMessageData {
  messageId: string;
  senderName: string;
  senderId: string;
  content: string;
  timestamp: string;
}

const DUMMY_MESSAGES: ChatMessageData[] = [
  {
    messageId: "1",
    senderId: "12345",
    senderName: "상대방2",
    content: "aaaa",
    timestamp: "오후 2:00",
  },
  {
    messageId: "2",
    senderId: "userMe",
    senderName: "나",
    content: "긴메시지ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ",
    timestamp: "오후 2:01",
  },
  {
    messageId: "3",
    senderId: "12345",
    senderName: "상대방1",
    content: "ㄷㄱㄺㄹㄹㄷㄱㄹ",
    timestamp: "오후 2:01",
  },
  {
    messageId: "4",
    senderId: "12345",
    senderName: "상대방2",
    content: "aaaa",
    timestamp: "오후 2:00",
  },
  {
    messageId: "5",
    senderId: "userMe",
    senderName: "qqq",
    content: "긴메시지ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ",
    timestamp: "오후 2:01",
  },
  {
    messageId: "6",
    senderId: "12345",
    senderName: "상대방1",
    content: "ㄷㄱㄺㄹㄹㄷㄱㄹ",
    timestamp: "오후 2:01",
  },
];
export async function fetchChats(roomId: string): Promise<ChatMessageData[]> {
  console.log("fetchChats", roomId);
  return new Promise((resolve) => {
    setTimeout(() => resolve(DUMMY_MESSAGES), 3);
  });
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
