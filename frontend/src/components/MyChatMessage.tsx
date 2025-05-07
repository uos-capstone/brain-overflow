// MyChatMessage.tsx
import React from 'react';
import styles from '../css/MyChatMessage.module.css';

// ChatMessageData Ÿ���� import �ϰų� ���⿡ ����
interface ChatMessageData {
    senderName: string;
    senderId: string;
    content: string;
    timestamp: string;
}

interface MyChatMessageProps {
    chat: ChatMessageData;
}

export const MyChatMessage: React.FC<MyChatMessageProps> = ({ chat }) => {
    return (
        <div className={styles.messageContainer}>
            <div className={styles.messageBubble}>
                <p className={styles.messageContent}>{chat.content}</p>
                <span className={styles.messageTimestamp}>{chat.timestamp}</span>
            </div>
        </div>
    );
};