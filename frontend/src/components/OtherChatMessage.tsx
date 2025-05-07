// OtherChatMessage.tsx
import React from 'react';
import styles from '../css/OtherChatMessage.module.css'; // �ش� CSS ��� ���� �ʿ�

// ChatMessageData Ÿ���� import �ϰų� ���⿡ ����
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
            {/* ���� ��� �̸��� �޽��� ���� ���� ǥ�� */}
            <p className={styles.senderName}>{chat.senderName}</p>
            <div className={styles.messageBubble}>
                <p className={styles.messageContent}>{chat.content}</p>
                <span className={styles.messageTimestamp}>{chat.timestamp}</span>
            </div>
        </div>
    );
};