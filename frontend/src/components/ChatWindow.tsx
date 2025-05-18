import React, { useState, useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import styles from '../css/ChatWindow.module.css';
import { MyChatMessage } from './MyChatMessage';
import { OtherChatMessage } from './OtherChatMessage';
import {
    fetchChats,
    ChatMessageData,
    Participant,
} from '../util/api';

/*
interface ChatMessageData {
    messageId: string;
    senderName: string;
    senderId: string;
    content: string;
    timestamp: string;
}
*/

export interface ChatWindowProps {
    id: string;
    title: string;
    x: number;
    y: number;
    zIndex: number;
    isPinned: boolean;
    currentUser: Participant;
    onMove: (id: string, x: number, y: number) => void;
    onClose: (id: string) => void;
    onMinimize: (id: string) => void;
    onBringToFront: (id: string) => void;
    onTogglePin: (id: string) => void;
    onOpenSettings: (id: string, buttonElement: HTMLButtonElement) => void;
    onShowParticipantsPanel: (id: string, buttonElement: HTMLButtonElement) => void;
    children?: React.ReactNode;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    id,
    title,
    x,
    y,
    zIndex,
    isPinned,
    currentUser,
    onMove,
    onClose,
    onMinimize,
    onBringToFront,
    onTogglePin,
    onOpenSettings,
    onShowParticipantsPanel
}) => {
    const [messages, setMessages] = useState<ChatMessageData[]>([]);
    //const [loading, setLoading] = useState(true);

    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const participantsButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        Promise.all([fetchChats(id)])
            .then(([messages]) => {
                setMessages(messages)
            })
            //.finally(() => setLoading(false));
    }, [id]);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'CHAT_WINDOW',
        item: { id, startX: x, startY: y },
        collect: monitor => ({ isDragging: monitor.isDragging() }),
        end: (item, monitor) => {
            const diff = monitor.getDifferenceFromInitialOffset();
            if (diff && (diff.x !== 0 || diff.y !== 0)) {
                onMove(id, item.startX + diff.x, item.startY + diff.y);
            }
        },
    }), [id, x, y, onMove]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target instanceof HTMLElement && e.target.closest('button, input')) {
            return;
        }
        onBringToFront(id);
    };

    const dynamicWindowStyle: React.CSSProperties = {
        left: x,
        top: y,
        zIndex: zIndex,
        opacity: isDragging ? 0.75 : 1,
    };

    const handleSendMessage = () => {
        const trimmedMessage = inputValue.trim();
        if (trimmedMessage) {
            const newMessage: ChatMessageData = {
                messageId: Date.now().toString(),
                senderId: currentUser!.id,
                senderName: "나",
                content: trimmedMessage,
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true })
            };

            setMessages(prevMessages => [...prevMessages, newMessage]);
            console.log(`[ChatWindow ID: ${id}] 새 메시지 추가됨:`, newMessage);
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [messages]);

    const headerRef = useRef<HTMLDivElement>(null);
    drag(headerRef);

    return (
        <div
            className={styles.window}
            onMouseDown={handleMouseDown}
            style={dynamicWindowStyle}
        >
            <div
                ref={headerRef}
                className={styles.header}
                style={{ cursor: 'move' }}
            >
                <span className={styles.headerTitle}>{title}</span>
                <div className={styles.headerControls}>
                    <button
                        ref={participantsButtonRef}
                        onClick={(e) => {
                            e.stopPropagation(); 
                            if (participantsButtonRef.current) {
                                onShowParticipantsPanel(id, participantsButtonRef.current);
                            }
                        }}
                        className={styles.controlButton}
                        title="참여자 보기"
                    >
                        👥
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onTogglePin(id); }} className={styles.controlButton} title={isPinned ? "고정 해제" : "창 고정"}> {isPinned ? '📍' : '📌'} </button>
                    <button onClick={(e) => { e.stopPropagation(); onMinimize(id); }} className={styles.controlButton} title="최소화"> _ </button>
                    <button
                        ref={settingsButtonRef}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (settingsButtonRef.current) { 
                                onOpenSettings(id, settingsButtonRef.current); 
                            }
                        }}
                        className={styles.controlButton}
                        title="설정"
                    > ☰ </button>
                    <button onClick={(e) => { e.stopPropagation(); onClose(id); }} className={styles.controlButton} title="닫기"> ✕ </button>
                </div>
            </div>

            <div className={styles.content}>
                {messages.map((chat) => {
                    if (chat.senderName === currentUser!.userName) {
                        return <MyChatMessage key={chat.messageId} chat={chat} />;
                    } else {
                        return <OtherChatMessage key={chat.messageId} chat={chat} />;
                    }
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
                <input
                    className={styles.inputField}
                    placeholder="메시지 입력"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className={styles.sendButton}
                    onClick={handleSendMessage}
                >
                    전송
                </button>
            </div>
        </div>
    );
};