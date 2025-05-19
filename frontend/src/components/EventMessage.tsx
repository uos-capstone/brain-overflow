// src/components/EventMessage.tsx
import React from 'react';
import styles from '../css/EventMessage.module.css'; 
import { ChatMessageData } from '../util/api';

interface EventMessageProps {
    chat: ChatMessageData;
}

export const EventMessage: React.FC<EventMessageProps> = ({ chat }) => {

    return (
        <div className={styles.eventMessageContainer}>    
            <p className={styles.eventMessageText}>{chat.content}</p>
        </div>
    );
};