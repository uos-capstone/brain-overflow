// Sidebar.tsx
import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChatWindow } from './ChatWindow';

interface Chatroom { id: number; name: string; }
const BASE_Z_INDEX = 10000;
const SIDEBAR_Z_INDEX = 11000;
const DRAWER_Z_INDEX = 10500;
const MINIMIZED_BAR_Z_INDEX = 10800;
const BACKDROP_Z_INDEX = BASE_Z_INDEX - 1;

export default function Sidebar() {
    const [chatrooms] = useState<Chatroom[]>([
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
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: BACKDROP_Z_INDEX,
                    }}
                />
            )}


            {/* 사이드바 */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 60,
                    background: '#1e1e1e',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '100vh',
                    boxSizing: 'border-box',
                    zIndex: SIDEBAR_Z_INDEX,
                }}
            >
                <div onClick={() => setDrawerOpen(o => !o)} style={{ marginTop: '20px', cursor: 'pointer', fontSize: '24px' }}>
                    🔍
                </div>
                <div style={{ marginBottom: 20, cursor: 'pointer', fontSize: '24px' }}>⚙️</div>
            </div>

            {/* 채팅방 리스트 */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: drawerOpen ? 60 : -240,
                    width: 240,
                    height: '100vh',
                    background: '#2e2e2e',
                    color: '#fff',
                    transition: 'left 0.3s ease',
                    zIndex: DRAWER_Z_INDEX,
                    boxSizing: 'border-box',
                    paddingTop: '60px',
                    overflowY: 'auto',
                }}
            >
                <h3 style={{ padding: '10px 20px', margin: 0, borderBottom: '1px solid #444' }}>채팅 목록</h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: '10px 0' }}>
                    {chatrooms.map(r => (
                        <li key={r.id} onClick={() => openRoom(r.id)} style={{ margin: '2px 0', cursor: 'pointer', padding: '8px 20px', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#444'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            {r.name}
                        </li>
                    ))}
                </ul>
            </div>

            {/* 채팅방 */}
            {activeWindows.map(id => {
                const room = chatrooms.find(r => r.id === id)!;
                const { x, y } = pos[id] || { x: 300, y: 80 };
                const zIndex = zIndices[id] || BASE_Z_INDEX;
                const isPinned = pinnedIds.includes(id); // Check if pinned

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

            {/* 하단바 */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 60,
                width: 'calc(100% - 60px)',
                height: 40,
                background: '#333',
                borderTop: '1px solid #555',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                boxSizing: 'border-box',
                zIndex: MINIMIZED_BAR_Z_INDEX,
                overflowX: 'auto',
            }}>
                {minimizedWindows.map(id => {
                    const room = chatrooms.find(r => r.id === id)!;
                    return (
                        <button
                            key={id}
                            onClick={() => restoreRoom(id)}
                            style={{
                                background: '#555', color: '#fff', border: '1px solid #777',
                                borderRadius: '4px', padding: '5px 10px', marginRight: '10px',
                                cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                            title={`${room.name} 복원`}
                        >
                            {room.name}
                        </button>
                    );
                })}
                {minimizedWindows.length === 0 && (
                    <span style={{ color: '#888', fontSize: '12px' }}>최소화된 창 없음</span>
                )}
            </div>
        </DndProvider>
    );
}