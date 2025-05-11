import React, { useState, useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import styles from '../css/ChatWindow.module.css';
import { MyChatMessage } from './MyChatMessage';
import { OtherChatMessage } from './OtherChatMessage';

interface ChatMessageData {
    messageId: string | number;
    senderName: string;
    senderId: string;
    content: string;
    timestamp: string;
}

const SAMPLE_CURRENT_USER_ID = "userMe";

const INITIAL_MESSAGES: ChatMessageData[] = [
    { messageId: 1, senderId: "12345", senderName: "상대방2", content: "aaaa", timestamp: "오후 2:00" },
    { messageId: 2, senderId: SAMPLE_CURRENT_USER_ID, senderName: "나", content: "긴메시지ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ", timestamp: "오후 2:01" },
    { messageId: 3, senderId: "12345", senderName: "상대방1", content: "ㄷㄱㄺㄹㄹㄷㄱㄹ", timestamp: "오후 2:01" },
    { messageId: 4, senderId: "12345", senderName: "상대방2", content: "aaaa", timestamp: "오후 2:00" },
    { messageId: 5, senderId: SAMPLE_CURRENT_USER_ID, senderName: "나", content: "긴메시지ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ", timestamp: "오후 2:01" },
    { messageId: 6, senderId: "12345", senderName: "상대방1", content: "ㄷㄱㄺㄹㄹㄷㄱㄹ", timestamp: "오후 2:01" },
];

export interface ChatWindowProps {
    id: number;
    title: string;
    x: number;
    y: number;
    zIndex: number;
    isPinned: boolean;
    onMove: (id: number, x: number, y: number) => void;
    onClose: (id: number) => void;
    onMinimize: (id: number) => void;
    onBringToFront: (id: number) => void;
    onTogglePin: (id: number) => void;
    onOpenSettings: (id: number, buttonElement: HTMLButtonElement) => void;
    onShowParticipantsPanel: (id: number, buttonElement: HTMLButtonElement) => void;
    children?: React.ReactNode;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    id,
    title,
    x,
    y,
    zIndex,
    isPinned,
    onMove,
    onClose,
    onMinimize,
    onBringToFront,
    onTogglePin,
    onOpenSettings,
    onShowParticipantsPanel
}) => {
    const [messages, setMessages] = useState<ChatMessageData[]>(INITIAL_MESSAGES);
    const currentUserId = SAMPLE_CURRENT_USER_ID;

    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const participantsButtonRef = useRef<HTMLButtonElement>(null);

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
                messageId: Date.now(),
                senderId: currentUserId,
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
                    if (chat.senderId === currentUserId) {
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