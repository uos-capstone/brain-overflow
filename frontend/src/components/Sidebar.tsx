// Sidebar.tsx
import { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChatWindow } from './ChatWindow';
import styles from '../css/Sidebar.module.css';
import { AddRoom } from './AddRoom';
import chatWindowStyles from '../css/ChatWindow.module.css';
import { ChatWindowSettingsPanel } from './ChatWindowSettingsPanel';
import { ChatRoomParticipantsPanel } from './ChatRoomParticipantsPanel';
import chatWindowSettingsPanelStyles from '../css/ChatWindowSettingsPanel.module.css'; // 외부 클릭 감지용
import roomParticipantsPanelStyles from '../css/ChatRoomParticipantsPanel.module.css'; // 외부 클릭 감지용
import { ConfirmModal } from './ConfirmModal';
import { InviteModal } from './InviteModal';

// [추가] Participant 인터페이스 정의
export interface Participant {
    id: string;
    userName: string;
}
interface Chatroom {
    id: number;
    name: string;
    participants: Participant[];
}

const ALL_AVAILABLE_USERS: Participant[] = [
    { id: 'user1', userName: 'Alice' },
    { id: 'user2', userName: 'Bob' },
    { id: 'user3', userName: 'Charlie' },
    { id: 'user4', userName: 'David' },
    { id: 'user5', userName: 'Eve' },
    { id: 'user6', userName: 'Frank' },
    { id: 'user7', userName: 'Grace' },
    { id: 'user8', userName: 'Henry' },
    { id: 'userMe', userName: '나' }, // '나' 자신은 보통 초대 대상에서 제외됨
];

const BASE_Z_INDEX = 10000;
const SIDEBAR_Z_INDEX = 11000;
const DRAWER_Z_INDEX = 10500;
const MINIMIZED_BAR_Z_INDEX = 10800;
const SETTINGS_PANEL_Z_INDEX = SIDEBAR_Z_INDEX + 100;
const PARTICIPANTS_PANEL_Z_INDEX = SIDEBAR_Z_INDEX + 110; 
const BACKDROP_Z_INDEX = BASE_Z_INDEX - 1;
const CONFIRM_MODAL_Z_INDEX = (PARTICIPANTS_PANEL_Z_INDEX || SETTINGS_PANEL_Z_INDEX) + 50;
const INVITE_MODAL_Z_INDEX = CONFIRM_MODAL_Z_INDEX + 10;

const CURRENT_USER_ID_IN_SIDEBAR = "userMe";

export default function Sidebar() {
    const [chatrooms, setChatrooms] = useState<Chatroom[]>([
        {
            id: 1, name: '방1', participants: [
                { id: 'user1', userName: 'Alice' },
                { id: 'user2', userName: 'Bob' },
                { id: CURRENT_USER_ID_IN_SIDEBAR, userName: '나' },
            ]
        },
        {
            id: 2, name: '방2', participants: [
                { id: 'user3', userName: 'Charlie' },
                { id: CURRENT_USER_ID_IN_SIDEBAR, userName: '나' },
            ]
        },
        {
            id: 3, name: '방3333', participants: [
                { id: 'user1', userName: 'Alice' },
                { id: 'user4', userName: 'David' },
                { id: CURRENT_USER_ID_IN_SIDEBAR, userName: '나' },
            ]
        },
    ]);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [openIds, setOpenIds] = useState<number[]>([]);
    const [minimizedIds, setMinimizedIds] = useState<number[]>([]);
    const [pos, setPos] = useState<Record<number, { x: number; y: number }>>({});
    const [zIndices, setZIndices] = useState<Record<number, number>>({});
    const [activeId, setActiveId] = useState<number | null>(null);
    const [pinnedIds, setPinnedIds] = useState<number[]>([]);
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

    const [settingsOpenForId, setSettingsOpenForId] = useState<number | null>(null);
    const [settingsPanelPosition, setSettingsPanelPosition] = useState<{ top: number; left: number } | null>(null);
    const [settingsTriggerButtonRef, setSettingsTriggerButtonRef] = useState<HTMLButtonElement | null>(null);

    const [participantsPanelOpenForId, setParticipantsPanelOpenForId] = useState<number | null>(null);
    const [participantsPanelPosition, setParticipantsPanelPosition] = useState<{ top: number; left: number } | null>(null);

    const [leaveConfirmModalForId, setLeaveConfirmModalForId] = useState<number | null>(null);
    const [inviteModalForRoomId, setInviteModalForRoomId] = useState<number | null>(null);

    // 참가자 창 닫기
    const closeParticipantsPanel = useCallback(() => {
        setParticipantsPanelOpenForId(null);
        setParticipantsPanelPosition(null);
    }, []);

    // 설정 닫기
    const closeSettingsPanel = useCallback(() => {
        setSettingsOpenForId(null);
        setSettingsPanelPosition(null);
        setSettingsTriggerButtonRef(null);
    }, []);

    // 채팅참가자 보기
    const handleOpenParticipantsPanel = useCallback((id: number, buttonElement: HTMLButtonElement) => {
        closeSettingsPanel(); 

        if (participantsPanelOpenForId === id) {
            closeParticipantsPanel();
        } else {
            const rect = buttonElement.getBoundingClientRect();
            setParticipantsPanelOpenForId(id);
            setParticipantsPanelPosition({
                top: rect.bottom + window.scrollY + 2,
                left: rect.left + window.scrollX,
            });
        }
    }, [participantsPanelOpenForId, closeParticipantsPanel, closeSettingsPanel]); 

    // 방 추가
    const handleAddRoom = useCallback((name: string) => {
        const newId = Date.now();
        const newRoom: Chatroom = {
            id: newId,
            name: name,
            participants: [{ id: CURRENT_USER_ID_IN_SIDEBAR, userName: '나' }] 
        };
        setChatrooms(currentRooms => [...currentRooms, newRoom]);
        setIsAddRoomOpen(false); 
    }, [setChatrooms]);

    // 설정 열기
    const handleOpenSettings = useCallback((id: number, buttonElement: HTMLButtonElement) => {
        closeParticipantsPanel();
        if (settingsOpenForId === id) {
            closeSettingsPanel();
        } else {
            const rect = buttonElement.getBoundingClientRect();
            setSettingsOpenForId(id);
            setSettingsPanelPosition({
                top: rect.bottom + window.scrollY + 2,
                left: rect.left + window.scrollX,
            });
            setSettingsTriggerButtonRef(buttonElement); 
        }
    }, [settingsOpenForId, closeSettingsPanel, closeParticipantsPanel]);

    // 외부 클릭시 닫기
    useEffect(() => {
        const handleClickOutsideFloatingPanels = (event: MouseEvent) => {
            const targetElement = event.target as HTMLElement;
            let shouldCloseSettings = settingsOpenForId !== null;
            let shouldCloseParticipants = participantsPanelOpenForId !== null;

            if (shouldCloseSettings) {
                if (targetElement.closest(`.${chatWindowStyles.controlButton}[title="설정"]`) ||
                    targetElement.closest(`.${chatWindowSettingsPanelStyles.settingsPanel}`)) {
                    shouldCloseSettings = false;
                }
            }
            if (shouldCloseParticipants) {
                if (targetElement.closest(`.${chatWindowStyles.controlButton}[title="참여자 보기"]`) ||
                    targetElement.closest(`.${roomParticipantsPanelStyles.participantsPanel}`) ||
                    (settingsOpenForId !== null && targetElement.closest(`.${chatWindowSettingsPanelStyles.settingsPanel}`))
                ) {
                    shouldCloseParticipants = false;
                }
            }
            if (shouldCloseSettings) closeSettingsPanel();
            if (shouldCloseParticipants) closeParticipantsPanel();
        };

        if (settingsOpenForId !== null || participantsPanelOpenForId !== null) {
            document.addEventListener('mousedown', handleClickOutsideFloatingPanels);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideFloatingPanels);
        };
    }, [
        settingsOpenForId, closeSettingsPanel,
        participantsPanelOpenForId, closeParticipantsPanel,
        chatWindowStyles.controlButton,
        chatWindowSettingsPanelStyles.settingsPanel,
        roomParticipantsPanelStyles.participantsPanel
    ]);

    // 창을 맨 앞으로
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
            return { ...currentZIndices, [id]: maxZ + 1, };
        });
    }, [openIds, minimizedIds]);

    // 채팅방 열기
    const openRoom = useCallback((id: number) => {
        if (!chatrooms.find(room => room.id === id)) {
            console.warn(`Attempted to open non-existent room ID: ${id}`);
            return;
        }
        if (openIds.includes(id)) {
            if (minimizedIds.includes(id)) {
                setMinimizedIds(ids => ids.filter(v => v !== id));
            }
        } else {
            setOpenIds(ids => [...ids, id]);
            setMinimizedIds(ids => ids.filter(v => v !== id));
            setPos(p => {
                const visibleWindows = openIds.filter(oid => !minimizedIds.includes(oid)).length;
                const initialX = 320 + visibleWindows * 20; 
                const initialY = 70 + visibleWindows * 20;  
                return { ...p, [id]: { x: initialX, y: initialY } };
            });
        }
        bringToFront(id);
    }, [openIds, minimizedIds, bringToFront, chatrooms]);

    // 채팅방 닫기
    const closeChatWindow = useCallback((idToClose: number) => {
        if (settingsOpenForId === idToClose) {
            closeSettingsPanel();
        }
        if (participantsPanelOpenForId === idToClose) {
            closeParticipantsPanel();
        }

        setOpenIds(ids => ids.filter(v => v !== idToClose));
        setMinimizedIds(ids => ids.filter(v => v !== idToClose)); 
        setPinnedIds(ids => ids.filter(v => v !== idToClose));   
        setPos(currentPos => {
            const { [idToClose]: _, ...rest } = currentPos;
            return rest;
        });
        setZIndices(currentZIndices => {
            const { [idToClose]: _, ...rest } = currentZIndices;
            return rest;
        });

        if (activeId === idToClose) {
            let nextActiveId: number | null = null;
            let maxZ = BASE_Z_INDEX - 1;

            const remainingOpenIds = openIds.filter(oid => oid !== idToClose && !minimizedIds.includes(oid));
            remainingOpenIds.forEach(oid => {
                const z = zIndices[oid]; 
                if (z !== undefined && z > maxZ) {
                    maxZ = z;
                    nextActiveId = oid;
                }
            });
            setActiveId(nextActiveId);
        }
    }, [
        activeId,
        openIds,
        minimizedIds,
        zIndices,
        settingsOpenForId,
        participantsPanelOpenForId,
        closeSettingsPanel,
        closeParticipantsPanel
        
    ]);

    // 방 드래그
    const moveRoom = useCallback((id: number, x: number, y: number) => {
        if (settingsOpenForId === id) closeSettingsPanel();
        if (participantsPanelOpenForId === id) closeParticipantsPanel(); 
        setPos(p => ({ ...p, [id]: { x, y } }));
        bringToFront(id);
    }, [bringToFront, settingsOpenForId, closeSettingsPanel, participantsPanelOpenForId, closeParticipantsPanel]);

    // 방 나가기
    const performActualLeaveRoom = useCallback((idToRemove: number) => {
        if (settingsOpenForId === idToRemove) closeSettingsPanel();
        if (participantsPanelOpenForId === idToRemove) closeParticipantsPanel();

        setOpenIds(ids => ids.filter(v => v !== idToRemove));
        setMinimizedIds(ids => ids.filter(v => v !== idToRemove));
        setPinnedIds(ids => ids.filter(v => v !== idToRemove));
        setPos(currentPos => {
            const { [idToRemove]: _, ...rest } = currentPos;
            return rest;
        });
        setZIndices(currentZIndices => {
            const { [idToRemove]: _, ...rest } = currentZIndices;
            return rest;
        });
        setChatrooms(currentChatrooms => currentChatrooms.filter(room => room.id !== idToRemove));

        if (activeId === idToRemove) {
            let nextActiveId: number | null = null;
            let maxZ = BASE_Z_INDEX - 1;
            const remainingOpenIds = openIds.filter(oid => oid !== idToRemove && !minimizedIds.includes(oid));
            remainingOpenIds.forEach(oid => {
                const z = zIndices[oid]; // 여기서 zIndices는 상태 업데이트 전의 값일 수 있음
                if (z !== undefined && z > maxZ) {
                    maxZ = z;
                    nextActiveId = oid;
                }
            });
            setActiveId(nextActiveId);
        }
        console.log(`Chatroom with ID ${idToRemove} was permanently left and removed.`);
    }, [activeId, chatrooms, openIds, minimizedIds, zIndices, settingsOpenForId, participantsPanelOpenForId, closeSettingsPanel, closeParticipantsPanel]);

    // 방 진짜 나갈지 물어봄
    const requestLeaveChatroom = useCallback((idToRemove: number) => {
        setLeaveConfirmModalForId(idToRemove);
 
        if (settingsOpenForId === idToRemove) {
            closeSettingsPanel();
        }
    }, [settingsOpenForId, closeSettingsPanel]);

    // 방 진짜 나간다고 함
    const handleConfirmLeave = useCallback(() => {
        if (leaveConfirmModalForId !== null) {
            performActualLeaveRoom(leaveConfirmModalForId);
            setLeaveConfirmModalForId(null); 
        }
    }, [leaveConfirmModalForId, performActualLeaveRoom]);

    // 방 나가는거 취소함
    const handleCancelLeave = useCallback(() => {
        setLeaveConfirmModalForId(null);
    }, []);

    const openInviteModal = useCallback((roomId: number) => {
        closeSettingsPanel(); // 다른 패널들은 닫기
        closeParticipantsPanel();
        setInviteModalForRoomId(roomId);
    }, [closeSettingsPanel, closeParticipantsPanel]);

    // [신규] 초대 모달 닫기 함수
    const closeInviteModal = useCallback(() => {
        setInviteModalForRoomId(null);
    }, []);

    // [신규] 선택된 사용자들을 채팅방에 초대하는 함수
    const handleInviteUsersToRoom = useCallback((roomId: number, usersToInvite: Participant[]) => {
        setChatrooms(currentChatrooms =>
            currentChatrooms.map(room => {
                if (room.id === roomId) {
                    const existingParticipantIds = new Set(room.participants.map(p => p.id));
                    const newParticipants = usersToInvite.filter(
                        user => !existingParticipantIds.has(user.id)
                    );
                    if (newParticipants.length > 0) {
                        return {
                            ...room,
                            participants: [...room.participants, ...newParticipants.map(u => ({ id: u.id, userName: u.userName }))],
                        };
                    }
                }
                return room;
            })
        );
        closeInviteModal(); // 초대 후 모달 닫기
        // 필요하다면, 초대 성공/실패 알림 등을 추가할 수 있습니다.
    }, [closeInviteModal]);

    // 방 최소화
    const minimizeRoom = useCallback((id: number) => {
        if (settingsOpenForId === id) closeSettingsPanel();
        if (participantsPanelOpenForId === id) closeParticipantsPanel(); 
        setMinimizedIds(ids => (ids.includes(id) ? ids : [...ids, id]));

        if (activeId === id) {
            let nextActiveId: number | null = null;
            let maxZ = BASE_Z_INDEX - 1;
            const newlyMinimizedIds = [...minimizedIds, id];
            openIds
                .filter(oid => oid !== id && !newlyMinimizedIds.includes(oid))
                .forEach(oid => {
                    const z = zIndices[oid];
                    if (z !== undefined && z > maxZ) {
                        maxZ = z;
                        nextActiveId = oid;
                    }
                });
            setActiveId(nextActiveId);
        }
    }, [activeId, openIds, minimizedIds, zIndices, settingsOpenForId, closeSettingsPanel, participantsPanelOpenForId, closeParticipantsPanel]);

    // 최소화 된 방 복구
    const restoreRoom = useCallback((id: number) => {
        setMinimizedIds(ids => ids.filter(v => v !== id));
        bringToFront(id);
    }, [bringToFront]);

    // 채팅방 고정
    const togglePin = useCallback((id: number) => {
        setPinnedIds(ids =>
            ids.includes(id) ? ids.filter(v => v !== id) : [...ids, id]
        );
    }, []);

    const activeWindows = openIds.filter(id => !minimizedIds.includes(id) && chatrooms.some(cr => cr.id === id));
    const minimizedWindows = openIds.filter(id => minimizedIds.includes(id) && chatrooms.some(cr => cr.id === id));

    // 백드롭 요소 클릭 감지
    const handleBackdropClick = useCallback(() => {
        activeWindows.forEach(id => {
            if (!pinnedIds.includes(id)) {
                minimizeRoom(id); 
            }
        });
        if (settingsOpenForId !== null) {
            const settingsRoomIsPinned = pinnedIds.includes(settingsOpenForId) && activeWindows.includes(settingsOpenForId);
            if (!settingsRoomIsPinned) closeSettingsPanel();
        }
        if (participantsPanelOpenForId !== null) {
            const participantsRoomIsPinned = pinnedIds.includes(participantsPanelOpenForId) && activeWindows.includes(participantsPanelOpenForId);
            if (!participantsRoomIsPinned) closeParticipantsPanel();
        }
    }, [activeWindows, pinnedIds, minimizeRoom, closeSettingsPanel, closeParticipantsPanel, settingsOpenForId, participantsPanelOpenForId]);

    const currentRoomForSettings = settingsOpenForId !== null
        ? chatrooms.find(r => r.id === settingsOpenForId)
        : null;
    const currentRoomForParticipants = participantsPanelOpenForId !== null
        ? chatrooms.find(r => r.id === participantsPanelOpenForId)
        : null;
    const roomToLeave = leaveConfirmModalForId !== null
        ? chatrooms.find(room => room.id === leaveConfirmModalForId)
        : null;
    const roomForInvite = inviteModalForRoomId !== null
        ? chatrooms.find(r => r.id === inviteModalForRoomId)
        : null;

    return (
        <DndProvider backend={HTML5Backend}>
            {(activeWindows.some(id => !pinnedIds.includes(id)) || settingsOpenForId !== null || participantsPanelOpenForId !== null) && (
                <div
                    onClick={handleBackdropClick}
                    className={styles.backdrop}
                    style={{ zIndex: BACKDROP_Z_INDEX }}
                />
            )}

            <div className={styles.sidebar} style={{ zIndex: SIDEBAR_Z_INDEX }} >
                <div onClick={() => setDrawerOpen(o => !o)} className={`${styles.sidebarIcon} ${styles.sidebarIconTop}`} title={drawerOpen ? "목록 닫기" : "목록 열기"} >
                    💬
                </div>
                <div className={`${styles.sidebarIcon} ${styles.sidebarIconBottom}`} title="전체 설정 (미구현)" >
                    ⚙️
                </div>
            </div>

            <div className={styles.drawer} style={{ left: drawerOpen ? 60 : -240, zIndex: DRAWER_Z_INDEX, }} >
                <div className={styles.drawerHeaderContainer}>
                    <h3 className={styles.drawerHeader}>채팅 목록</h3>
                    <button className={styles.addRoomButton} onClick={() => setIsAddRoomOpen(true)} title="새 채팅방 추가" >
                        ⊕
                    </button>
                </div>
                <ul className={styles.drawerList}>
                    {chatrooms.map(r => (
                        <li key={r.id} onClick={() => openRoom(r.id)} className={styles.drawerListItem} >
                            {r.name}
                        </li>
                    ))}
                </ul>
            </div>

            {activeWindows.map(id => {
                const room = chatrooms.find(r => r.id === id);
                if (!room) return null;
                const { x, y } = pos[id] || { x: 250, y: 70 };
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
                        participants={room.participants}
                        onMove={moveRoom}
                        onClose={closeChatWindow}
                        onMinimize={minimizeRoom}
                        onBringToFront={bringToFront}
                        onTogglePin={togglePin}
                        onOpenSettings={handleOpenSettings}
                        onShowParticipantsPanel={handleOpenParticipantsPanel}
                    />
                );
            })}

            <div className={styles.minimizedBar} style={{ zIndex: MINIMIZED_BAR_Z_INDEX }} >
                {minimizedWindows.map(id => {
                    const room = chatrooms.find(r => r.id === id);
                    if (!room) return null;
                    return (
                        <button key={id} onClick={() => restoreRoom(id)} className={styles.minimizedButton} >
                            {room.name}
                        </button>
                    );
                })}
            </div>

            {isAddRoomOpen && (
                <AddRoom onClose={() => setIsAddRoomOpen(false)} onAdd={handleAddRoom} />
            )}

            {settingsOpenForId !== null && settingsPanelPosition !== null && currentRoomForSettings && (
                <ChatWindowSettingsPanel
                    roomId={settingsOpenForId}
                    top={settingsPanelPosition.top}
                    left={settingsPanelPosition.left}
                    zIndex={SETTINGS_PANEL_Z_INDEX}
                    onClose={closeSettingsPanel}
                    onLeaveRoom={requestLeaveChatroom}
                    onShowParticipants={handleOpenParticipantsPanel} 
                    triggerElement={settingsTriggerButtonRef}
                    onOpenInviteModal={openInviteModal}
                />
            )}

            {participantsPanelOpenForId !== null && participantsPanelPosition !== null && currentRoomForParticipants && (
                <ChatRoomParticipantsPanel
                    roomId={participantsPanelOpenForId}
                    participants={currentRoomForParticipants.participants}
                    top={participantsPanelPosition.top}
                    left={participantsPanelPosition.left}
                    zIndex={PARTICIPANTS_PANEL_Z_INDEX}
                    onClose={closeParticipantsPanel}
                />
            )}

            <ConfirmModal
                isOpen={leaveConfirmModalForId !== null}
                title="채팅방 나가기"
                message={roomToLeave ? <><strong>{roomToLeave.name}</strong> 채팅방을<br />정말로 나가시겠습니까?</> : "채팅방을 정말로 나가시겠습니까?"}
                onConfirm={handleConfirmLeave}
                onCancel={handleCancelLeave}
                confirmText="나가기"
                cancelText="취소"
                zIndex={CONFIRM_MODAL_Z_INDEX}
            />

            {inviteModalForRoomId !== null && roomForInvite && (
                <InviteModal
                    isOpen={true} // inviteModalForRoomId가 null이 아니면 항상 열림
                    onClose={closeInviteModal}
                    currentRoomId={inviteModalForRoomId}
                    currentRoomName={roomForInvite.name}
                    currentParticipants={roomForInvite.participants}
                    allUsers={ALL_AVAILABLE_USERS.filter(u => u.id !== CURRENT_USER_ID_IN_SIDEBAR)} // 자신은 초대 목록에서 제외
                    onInviteConfirm={(usersToInvite) => handleInviteUsersToRoom(inviteModalForRoomId, usersToInvite)}
                    zIndex={INVITE_MODAL_Z_INDEX}
                />
            )}
        </DndProvider>
    );
}