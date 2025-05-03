// Sidebar.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChatWindow } from './ChatWindow';
import styles from '../css/Sidebar.module.css'; 
import { AddRoom } from './AddRoom';

interface Chatroom { id: number; name: string; }
const BASE_Z_INDEX = 10000;
const SIDEBAR_Z_INDEX = 11000;
const DRAWER_Z_INDEX = 10500;
const MINIMIZED_BAR_Z_INDEX = 10800;
const BACKDROP_Z_INDEX = BASE_Z_INDEX - 1;
interface ChatMessageData {
    senderName: string;
    senderId: string;
    content: string;
    timestamp: string;
}
export default function Sidebar() {
    const [chatrooms, setChatrooms] = useState<Chatroom[]>([
        { id: 1, name: '방1' },
        { id: 2, name: '방2' },
        { id: 3, name: '방3333' },
    ]);

    const [drawerOpen, setDrawerOpen] = useState(false);

    const [openIds, setOpenIds] = useState<number[]>([]);
    const [minimizedIds, setMinimizedIds] = useState<number[]>([]);
    const [pos, setPos] = useState<Record<number, { x: number; y: number }>>({});

    const [zIndices, setZIndices] = useState<Record<number, number>>({});
    const [activeId, setActiveId] = useState<number | null>(null);
    const [pinnedIds, setPinnedIds] = useState<number[]>([]);
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

    const handleAddRoom = useCallback((name: string) => {
        const newId = Date.now(); // ID 생성
        const newRoom: Chatroom = { id: newId, name: name };
        setChatrooms(currentRooms => [...currentRooms, newRoom]);
    }, [setChatrooms]);

    const bringToFront = useCallback((id: number) => {
        setActiveId(id);
        setZIndices(currentZIndices => {
            let maxZ = BASE_Z_INDEX;
            openIds
                .filter(openId => !minimizedIds.includes(openId) && openId !== id)
                .forEach(otherId => {
                    if (currentZIndices[otherId] && currentZIndices[otherId] > maxZ) {
                        maxZ = currentZIndices[otherId];
                    }
                });
            return {
                ...currentZIndices,
                [id]: maxZ + 1,
            };
        });
    }, [openIds, minimizedIds]);

    const openRoom = useCallback((id: number) => {
        let needsBringToFront = true;
        if (openIds.includes(id)) {
            if (minimizedIds.includes(id)) {
                setMinimizedIds(ids => ids.filter(v => v !== id));
            }
        } else {
            setOpenIds(ids => [...ids, id]);
            setMinimizedIds(ids => ids.filter(v => v !== id));
            setPos(p => {
                const visibleWindows = openIds.filter(oid => !minimizedIds.includes(oid)).length;
                const initialX = 300 + visibleWindows * 25;
                const initialY = 80 + visibleWindows * 25;
                return { ...p, [id]: { x: initialX, y: initialY } };
            });
        }
        if (needsBringToFront) {
            bringToFront(id);
        }
    }, [openIds, minimizedIds, bringToFront]);


    const moveRoom = useCallback((id: number, x: number, y: number) => {
        setPos(p => ({ ...p, [id]: { x, y } }));
        bringToFront(id);
    }, [bringToFront]);

    const closeRoom = useCallback((id: number) => {
        setOpenIds(ids => ids.filter(v => v !== id));
        setMinimizedIds(ids => ids.filter(v => v !== id));
        setPinnedIds(ids => ids.filter(v => v !== id));
        setPos(currentPos => {
            const { [id]: _, ...rest } = currentPos;
            return rest;
        });
        setZIndices(currentZIndices => {
            const { [id]: _, ...rest } = currentZIndices;
            return rest;
        });
        if (activeId === id) {
            let nextActiveId: number | null = null;
            let maxZ = BASE_Z_INDEX - 1;
            const currentZIndicesSnapshot = { ...zIndices };
            delete currentZIndicesSnapshot[id];
            openIds
                .filter(oid => oid !== id && !minimizedIds.includes(oid))
                .forEach(oid => {
                    const z = currentZIndicesSnapshot[oid];
                    if (z !== undefined && z > maxZ) {
                        maxZ = z;
                        nextActiveId = oid;
                    }
                });
            setActiveId(nextActiveId);
        }
    }, [activeId, openIds, minimizedIds, zIndices]);

    const minimizeRoom = useCallback((id: number) => {
        setMinimizedIds(ids => (ids.includes(id) ? ids : [...ids, id]));
    }, []);


    const restoreRoom = useCallback((id: number) => {
        setMinimizedIds(ids => ids.filter(v => v !== id));
        bringToFront(id);
    }, [bringToFront]);

    const togglePin = useCallback((id: number) => {
        setPinnedIds(ids =>
            ids.includes(id) ? ids.filter(v => v !== id) : [...ids, id]
        );
    }, []);

    const activeWindows = openIds.filter(id => !minimizedIds.includes(id));
    const minimizedWindows = openIds.filter(id => minimizedIds.includes(id));

    const handleOutsideClick = useCallback(() => {
        activeWindows.forEach(id => {
            if (!pinnedIds.includes(id)) {
                minimizeRoom(id);
            }
        });
    }, [activeWindows, pinnedIds, minimizeRoom]);

    return (
        <DndProvider backend={HTML5Backend}>
            {activeWindows.some(id => !pinnedIds.includes(id)) && (
                <div
                    onClick={handleOutsideClick}
                    className={styles.backdrop} 
                    style={{ zIndex: BACKDROP_Z_INDEX }} 
                />
            )}

            <div
                className={styles.sidebar} 
                style={{ zIndex: SIDEBAR_Z_INDEX }} 
            >
                <div
                    onClick={() => setDrawerOpen(o => !o)}
                    className={`${styles.sidebarIcon} ${styles.sidebarIconTop}`}
                    title={drawerOpen ? "목록 닫기" : "목록 열기"} 
                >
                    🔍
                </div>
                <div
                    className={`${styles.sidebarIcon} ${styles.sidebarIconBottom}`}
                    title="설정" 
                >
                    ⚙️
                </div>
            </div>

            <div
                className={styles.drawer} 
                style={{
                    left: drawerOpen ? 60 : -240, 
                    zIndex: DRAWER_Z_INDEX,       
                }}
            >
                <div className={styles.drawerHeaderContainer}>
                    <h3 className={styles.drawerHeader}>채팅 목록</h3>
                    <button
                        className={styles.addRoomButton}
                        onClick={() => setIsAddRoomOpen(true)} // Open the modal
                        title="새 채팅방 추가"
                    >
                        ⊕
                    </button>
                </div>

                <ul className={styles.drawerList}>
                    {chatrooms.map(r => (
                        <li
                            key={r.id}
                            onClick={() => openRoom(r.id)}
                            className={styles.drawerListItem} 
                            onMouseEnter={(e) => e.currentTarget.style.background = '#444'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            {r.name}
                        </li>
                    ))}
                </ul>
            </div>

            {activeWindows.map(id => {
                const room = chatrooms.find(r => r.id === id)!;
                const { x, y } = pos[id] || { x: 300, y: 80 };
                const zIndex = zIndices[id] || BASE_Z_INDEX;
                const isPinned = pinnedIds.includes(id);

                return (
                    <ChatWindow
                        key={id}
                        id={id}
                        title={room.name}
                        x={x}
                        y={y}
                        zIndex={zIndex}
                        isPinned={isPinned}
                        onMove={moveRoom}
                        onClose={closeRoom}
                        onMinimize={minimizeRoom}
                        onBringToFront={bringToFront}
                        onTogglePin={togglePin}
                    >
                        <p> (채팅 내용)</p>
                    </ChatWindow>
                );
            })}

            <div
                className={styles.minimizedBar} 
                style={{ zIndex: MINIMIZED_BAR_Z_INDEX }} 
            >
                {minimizedWindows.map(id => {
                    const room = chatrooms.find(r => r.id === id)!;
                    return (
                        <button
                            key={id}
                            onClick={() => restoreRoom(id)}
                            className={styles.minimizedButton}
                        >
                            {room.name}
                        </button>
                    );
                })}
                {/* 
                {minimizedWindows.length === 0 && (
                    <span className={styles.minimizedEmptyText}> 
                        최소화된 창 없음
                    </span>
                )}
                */}
            </div>
            {isAddRoomOpen && (
                <AddRoom
                    onClose={() => setIsAddRoomOpen(false)} 
                    onAdd={handleAddRoom}                 
                />
            )}
        </DndProvider>
    );
}