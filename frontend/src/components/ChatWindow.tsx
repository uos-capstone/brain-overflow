import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import styles from '../css/ChatWindow.module.css';
import { MyChatMessage } from './MyChatMessage';
import { OtherChatMessage } from './OtherChatMessage';
import { EventMessage } from './EventMessage';
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

    const [currentPage, setCurrentPage] = useState(0);
    const [hasMoreOldMessages, setHasMoreOldMessages] = useState(true);
    const [isLoadingOldMessages, setIsLoadingOldMessages] = useState(false);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) {
            setMessages([]);
            setCurrentPage(0); 
            setHasMoreOldMessages(true);
            setIsLoadingOldMessages(true);

            fetchChats(id, 0)
                .then((initialMessages) => {
                    setMessages(initialMessages);
                    if (initialMessages.length === 0) {
                        setHasMoreOldMessages(false);
                    }
                    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                })
                .catch(error => {
                    console.error(`[ChatWindow ID: ${id}] 초기 메시지 로드 실패:`, error);
                    setHasMoreOldMessages(false);
                })
                .finally(() => {
                    setIsLoadingOldMessages(false);
                })
        }
        return () => {
            setMessages([]);
            setCurrentPage(0);
            setHasMoreOldMessages(true);
            setIsLoadingOldMessages(false);
        };
    }, [id]);

    const loadPreviousMessages = useCallback(async () => {
        if (!hasMoreOldMessages || isLoadingOldMessages) {
            return;
        }

        setIsLoadingOldMessages(true);
        const nextPage = currentPage + 1;

        try {
            const olderMessages = await fetchChats(id, nextPage);
            if (olderMessages.length > 0) {
                const messageContainer = messageContainerRef.current;
                const previousScrollHeight = messageContainer?.scrollHeight || 0;
                const previousScrollTop = messageContainer?.scrollTop || 0;

                setMessages(prevMessages => [...olderMessages, ...prevMessages]);
                setCurrentPage(nextPage);
                if (messageContainer) {
                    requestAnimationFrame(() => {
                        messageContainer.scrollTop = (messageContainer.scrollHeight - previousScrollHeight) + previousScrollTop;
                    });
                }
            } else {
                setHasMoreOldMessages(false); 
            }
        } catch (error) {
            console.error(`[ChatWindow ID: ${id}] 이전 메시지 로드 실패 (page: ${nextPage}):`, error);
            setHasMoreOldMessages(false);
        } finally {
            setIsLoadingOldMessages(false);
        }
    }, [id, currentPage, hasMoreOldMessages, isLoadingOldMessages]); 

    useEffect(() => {
        const container = messageContainerRef.current;
        const handleScroll = () => {
            if (container && container.scrollTop === 0 && hasMoreOldMessages) {
                loadPreviousMessages();
            }
        };
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [hasMoreOldMessages, loadPreviousMessages]);

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
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }),
                type: "CHAT",
            };

            setMessages(prevMessages => [...prevMessages, newMessage]);
            console.log(`[ChatWindow ID: ${id}] 새 메시지 추가됨:`, newMessage);
            setInputValue('');

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
            }, 0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

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
                    switch (chat.type) {
                        case 'EVENT':
                            return <EventMessage key={chat.messageId} chat={chat} />;
                        case 'CHAT':
                            if (currentUser && chat.senderId === currentUser.id) {
                                return <MyChatMessage key={chat.messageId} chat={chat} />;
                            } else {
                                return <OtherChatMessage key={chat.messageId} chat={chat} />;
                            }
                        default:
                            console.warn(`Unknown message type: ${chat.type} for messageId: ${chat.messageId}`);
                            return null;
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