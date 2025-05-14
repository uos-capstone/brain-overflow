// src/util/api.ts
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
const DUMMY_CHATROOMS: Chatroom[] = [
    {
        id: "1",
        name: '방1',
        participants: [
            { id: 'user1', userName: 'Alice' },
            { id: 'user2', userName: 'Bob' },
            { id: 'userMe', userName: '나' },
        ],
    },
    {
        id: "2",
        name: '방2',
        participants: [
            { id: 'user3', userName: 'Charlie' },
            { id: 'userMe', userName: '나' },
        ],
    },
    {
        id: "3",
        name: '방3333',
        participants: [
            { id: 'user1', userName: 'Alice' },
            { id: 'user4', userName: 'David' },
            { id: 'userMe', userName: '나' },
        ],
    },
];
export async function fetchChatrooms(): Promise<Chatroom[]> {
    return new Promise(resolve => {
        setTimeout(() => resolve(DUMMY_CHATROOMS), 50);
    });
}

const DUMMY_PARTICIPANTS: Participant[] = [
    { id: 'user1', userName: 'Alice' },
    { id: 'user2', userName: 'Bob' },
    { id: 'user3', userName: 'Charlie' },
    { id: 'user4', userName: 'David' },
    { id: 'user5', userName: 'Eve' },
    { id: 'user6', userName: 'Frank' },
    { id: 'user7', userName: 'Grace' },
    { id: 'user8', userName: 'Henry' },
    { id: 'userMe', userName: '나' },
];

export async function fetchParticipants(): Promise<Participant[]> {
    return new Promise(resolve => {
        setTimeout(() => resolve(DUMMY_PARTICIPANTS), 300);
    });
}

export const CUR_USER: Participant = {
    id: 'userMe',
    userName: '나',
};
export async function getCurrentUser(): Promise<Participant> {
    return new Promise(resolve => {
        setTimeout(() => resolve(CUR_USER), 3);
    });
}
export interface ChatMessageData {
    messageId: string;
    senderName: string;
    senderId: string;
    content: string;
    timestamp: string;
}

const DUMMY_MESSAGES: ChatMessageData[] = [
    { messageId: "1", senderId: "12345", senderName: "상대방2", content: "aaaa", timestamp: "오후 2:00" },
    { messageId: "2", senderId: "userMe", senderName: "나", content: "긴메시지ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ", timestamp: "오후 2:01" },
    { messageId: "3", senderId: "12345", senderName: "상대방1", content: "ㄷㄱㄺㄹㄹㄷㄱㄹ", timestamp: "오후 2:01" },
    { messageId: "4", senderId: "12345", senderName: "상대방2", content: "aaaa", timestamp: "오후 2:00" },
    { messageId: "5", senderId: "userMe", senderName: "나", content: "긴메시지ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ", timestamp: "오후 2:01" },
    { messageId: "6", senderId: "12345", senderName: "상대방1", content: "ㄷㄱㄺㄹㄹㄷㄱㄹ", timestamp: "오후 2:01" },
];
export async function fetchChats(roomId: string): Promise<ChatMessageData[]> { 
    console.log("fetchChats",roomId);
    return new Promise(resolve => {
        setTimeout(() => resolve(DUMMY_MESSAGES), 3);
    });
}

// 방 추가
export async function addRoom(userId:string, roomName: string): Promise<void> {
    console.log("addRoom", roomName, userId);
    return;
}

export async function addUserToRoom(userId: string, roomName: string): Promise<void> {
    console.log("addUserToRoom", roomName, userId);
    return;
}

export async function deleteUserFromRoom(userId: string, roomName: string): Promise<void> {
    console.log("deleteUserFromRoom", userId, roomName);
    return;
}