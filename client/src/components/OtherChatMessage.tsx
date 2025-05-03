// OtherChatMessage.tsx
import React from 'react';
import styles from '../css/OtherChatMessage.module.css'; // 해당 CSS 모듈 생성 필요

// ChatMessageData 타입을 import 하거나 여기에 정의
interface ChatMessageData {
    senderName: string;
    senderId: string;
    content: string;
    timestamp: string;
}

interface OtherChatMessageProps {
    chat: ChatMessageData;
}

export const OtherChatMessage: React.FC<OtherChatMessageProps> = ({ chat }) => {
    return (
        <div className={styles.messageContainer}>
            {/* 보낸 사람 이름을 메시지 버블 위에 표시 */}
            <p className={styles.senderName}>{chat.senderName}</p>
            <div className={styles.messageBubble}>
                <p className={styles.messageContent}>{chat.content}</p>
                <span className={styles.messageTimestamp}>{chat.timestamp}</span>
            </div>
        </div>
    );
};