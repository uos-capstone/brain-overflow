// Sidebar.tsx
import { useState, useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useNavigate } from "react-router-dom";
import { ChatWindow } from "./ChatWindow";
import styles from "../css/Sidebar.module.css";
import { AddRoom } from "./AddRoom";
import chatWindowStyles from "../css/ChatWindow.module.css";
import { ChatWindowSettingsPanel } from "./ChatWindowSettingsPanel";
import { ChatRoomParticipantsPanel } from "./ChatRoomParticipantsPanel";
import chatWindowSettingsPanelStyles from "../css/ChatWindowSettingsPanel.module.css"; // 외부 클릭 감지용
import roomParticipantsPanelStyles from "../css/ChatRoomParticipantsPanel.module.css"; // 외부 클릭 감지용
import { ConfirmModal } from "./ConfirmModal";
import { InviteModal } from "./InviteModal";
import {
  fetchChatrooms,
  fetchParticipants,
  getCurrentUser,
  Chatroom,
  Participant,
  addRoom,
  inviteUserToRoom,
} from "../util/api";

/*
export interface Participant {
    id: string;
    userName: string;
}

interface Chatroom {
    id: number;
    name: string;
    participants: Participant[];
}
*/

const BASE_Z_INDEX = 10000;
const SIDEBAR_Z_INDEX = 11000;
const DRAWER_Z_INDEX = 10500;
const MINIMIZED_BAR_Z_INDEX = 10800;
const SETTINGS_PANEL_Z_INDEX = SIDEBAR_Z_INDEX + 100;
const PARTICIPANTS_PANEL_Z_INDEX = SIDEBAR_Z_INDEX + 110;
const BACKDROP_Z_INDEX = BASE_Z_INDEX - 1;
const CONFIRM_MODAL_Z_INDEX =
  (PARTICIPANTS_PANEL_Z_INDEX || SETTINGS_PANEL_Z_INDEX) + 50;
const INVITE_MODAL_Z_INDEX = CONFIRM_MODAL_Z_INDEX + 10;

export default function Sidebar() {
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [allParticipants, setParticipants] = useState<Participant[]>([]);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  //const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [zIndices, setZIndices] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

  const [settingsOpenForId, setSettingsOpenForId] = useState<string | null>(
    null
  );
  const [settingsPanelPosition, setSettingsPanelPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  //const [settingsTriggerButtonRef, setSettingsTriggerButtonRef] = useState<HTMLButtonElement | null>(null);

  const [participantsPanelOpenForId, setParticipantsPanelOpenForId] = useState<
    string | null
  >(null);
  const [participantsPanelPosition, setParticipantsPanelPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const [leaveConfirmModalForId, setLeaveConfirmModalForId] = useState<
    string | null
  >(null);
  const [inviteModalForRoomId, setInviteModalForRoomId] = useState<
    string | null
  >(null);

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchChatrooms(), fetchParticipants(), getCurrentUser()]).then(
      ([rooms, participants, currentUser]) => {
        setChatrooms(rooms);
        setParticipants(participants);
        setCurrentUser(currentUser);
      }
    );
    //.finally(() => setLoading(false));
  }, []);

  // 참가자 창 닫기
  const closeParticipantsPanel = useCallback(() => {
    setParticipantsPanelOpenForId(null);
    setParticipantsPanelPosition(null);
  }, []);

  // 설정 닫기
  const closeSettingsPanel = useCallback(() => {
    setSettingsOpenForId(null);
    setSettingsPanelPosition(null);
    //setSettingsTriggerButtonRef(null);
  }, []);

  // 채팅참가자 보기
  const handleOpenParticipantsPanel = useCallback(
    (id: string, buttonElement: HTMLButtonElement) => {
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
    },
    [participantsPanelOpenForId, closeParticipantsPanel, closeSettingsPanel]
  );

  // 방 추가
  const handleAddRoom = useCallback(async (name: string) => {
    try {
      const newId = await addRoom(name); // string
      setChatrooms((prev) => [...prev, { id: newId, name, participants: [] }]);
    } catch (err) {
      console.error("방 생성 오류:", err);
    } finally {
      setIsAddRoomOpen(false);
    }
  }, []);

  // 설정 열기
  const handleOpenSettings = useCallback(
    (id: string, buttonElement: HTMLButtonElement) => {
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
        //setSettingsTriggerButtonRef(buttonElement);
      }
    },
    [settingsOpenForId, closeSettingsPanel, closeParticipantsPanel]
  );

  // 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutsideFloatingPanels = (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement;
      let shouldCloseSettings = settingsOpenForId !== null;
      let shouldCloseParticipants = participantsPanelOpenForId !== null;

      if (shouldCloseSettings) {
        if (
          targetElement.closest(
            `.${chatWindowStyles.controlButton}[title="설정"]`
          ) ||
          targetElement.closest(
            `.${chatWindowSettingsPanelStyles.settingsPanel}`
          )
        ) {
          shouldCloseSettings = false;
        }
      }
      if (shouldCloseParticipants) {
        if (
          targetElement.closest(
            `.${chatWindowStyles.controlButton}[title="참여자 보기"]`
          ) ||
          targetElement.closest(
            `.${roomParticipantsPanelStyles.participantsPanel}`
          ) ||
          (settingsOpenForId !== null &&
            targetElement.closest(
              `.${chatWindowSettingsPanelStyles.settingsPanel}`
            ))
        ) {
          shouldCloseParticipants = false;
        }
      }
      if (shouldCloseSettings) closeSettingsPanel();
      if (shouldCloseParticipants) closeParticipantsPanel();
    };

    if (settingsOpenForId !== null || participantsPanelOpenForId !== null) {
      document.addEventListener("mousedown", handleClickOutsideFloatingPanels);
    }
    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutsideFloatingPanels
      );
    };
  }, [
    settingsOpenForId,
    closeSettingsPanel,
    participantsPanelOpenForId,
    closeParticipantsPanel,
  ]);

  // 창을 맨 앞으로
  const bringToFront = useCallback(
    (id: string) => {
      setActiveId(id);
      setZIndices((currentZIndices) => {
        let maxZ = BASE_Z_INDEX;
        openIds
          .filter((openId) => !minimizedIds.includes(openId) && openId !== id)
          .forEach((otherId) => {
            if (currentZIndices[otherId] && currentZIndices[otherId] > maxZ) {
              maxZ = currentZIndices[otherId];
            }
          });
        return { ...currentZIndices, [id]: maxZ + 1 };
      });
    },
    [openIds, minimizedIds]
  );

  // 채팅방 열기
  const openRoom = useCallback(
    (id: string) => {
      if (!chatrooms.find((room) => room.id === id)) {
        console.warn(`Attempted to open non-existent room ID: ${id}`);
        return;
      }
      if (openIds.includes(id)) {
        if (minimizedIds.includes(id)) {
          setMinimizedIds((ids) => ids.filter((v) => v !== id));
        }
      } else {
        setOpenIds((ids) => [...ids, id]);
        setMinimizedIds((ids) => ids.filter((v) => v !== id));
        setPos((p) => {
          const visibleWindows = openIds.filter(
            (oid) => !minimizedIds.includes(oid)
          ).length;
          const initialX = 320 + visibleWindows * 20;
          const initialY = 70 + visibleWindows * 20;
          return { ...p, [id]: { x: initialX, y: initialY } };
        });
      }
      bringToFront(id);
    },
    [openIds, minimizedIds, bringToFront, chatrooms]
  );

  // 채팅방 닫기
  const closeChatWindow = useCallback(
    (idToClose: string) => {
      if (settingsOpenForId === idToClose) {
        closeSettingsPanel();
      }
      if (participantsPanelOpenForId === idToClose) {
        closeParticipantsPanel();
      }

      setOpenIds((ids) => ids.filter((v) => v !== idToClose));
      setMinimizedIds((ids) => ids.filter((v) => v !== idToClose));
      setPinnedIds((ids) => ids.filter((v) => v !== idToClose));
      setPos((currentPos) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [idToClose]: _, ...rest } = currentPos;
        return rest;
      });
      setZIndices((currentZIndices) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [idToClose]: _, ...rest } = currentZIndices;
        return rest;
      });

      if (activeId === idToClose) {
        let nextActiveId: string | null = null;
        let maxZ = BASE_Z_INDEX - 1;

        const remainingOpenIds = openIds.filter(
          (oid) => oid !== idToClose && !minimizedIds.includes(oid)
        );
        remainingOpenIds.forEach((oid) => {
          const z = zIndices[oid];
          if (z !== undefined && z > maxZ) {
            maxZ = z;
            nextActiveId = oid;
          }
        });
        setActiveId(nextActiveId);
      }
    },
    [
      activeId,
      openIds,
      minimizedIds,
      zIndices,
      settingsOpenForId,
      participantsPanelOpenForId,
      closeSettingsPanel,
      closeParticipantsPanel,
    ]
  );

  // 방 드래그
  const moveRoom = useCallback(
    (id: string, x: number, y: number) => {
      if (settingsOpenForId === id) closeSettingsPanel();
      if (participantsPanelOpenForId === id) closeParticipantsPanel();
      setPos((p) => ({ ...p, [id]: { x, y } }));
      bringToFront(id);
    },
    [
      bringToFront,
      settingsOpenForId,
      closeSettingsPanel,
      participantsPanelOpenForId,
      closeParticipantsPanel,
    ]
  );

  // 방 나가기
  const performActualLeaveRoom = useCallback(
    (idToRemove: string) => {
      if (settingsOpenForId === idToRemove) closeSettingsPanel();
      if (participantsPanelOpenForId === idToRemove) closeParticipantsPanel();

      setOpenIds((ids) => ids.filter((v) => v !== idToRemove));
      setMinimizedIds((ids) => ids.filter((v) => v !== idToRemove));
      setPinnedIds((ids) => ids.filter((v) => v !== idToRemove));
      setPos((currentPos) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [idToRemove]: _, ...rest } = currentPos;
        return rest;
      });
      setZIndices((currentZIndices) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [idToRemove]: _, ...rest } = currentZIndices;
        return rest;
      });
      setChatrooms((currentChatrooms) =>
        currentChatrooms.filter((room) => room.id !== idToRemove)
      );

      if (activeId === idToRemove) {
        let nextActiveId: string | null = null;
        let maxZ = BASE_Z_INDEX - 1;
        const remainingOpenIds = openIds.filter(
          (oid) => oid !== idToRemove && !minimizedIds.includes(oid)
        );
        remainingOpenIds.forEach((oid) => {
          const z = zIndices[oid]; // 여기서 zIndices는 상태 업데이트 전의 값일 수 있음
          if (z !== undefined && z > maxZ) {
            maxZ = z;
            nextActiveId = oid;
          }
        });
        setActiveId(nextActiveId);
      }
      console.log(
        `Chatroom with ID ${idToRemove} was permanently left and removed.`
      );
    },
    [
      activeId,
      openIds,
      minimizedIds,
      zIndices,
      settingsOpenForId,
      participantsPanelOpenForId,
      closeSettingsPanel,
      closeParticipantsPanel,
    ]
  );

  // 방 진짜 나갈지 물어봄
  const requestLeaveChatroom = useCallback(
    (idToRemove: string) => {
      setLeaveConfirmModalForId(idToRemove);

      if (settingsOpenForId === idToRemove) {
        closeSettingsPanel();
      }
    },
    [settingsOpenForId, closeSettingsPanel]
  );

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

  // 초대모달 열기
  const openInviteModal = useCallback(
    (roomId: string) => {
      closeSettingsPanel();
      closeParticipantsPanel();
      setInviteModalForRoomId(roomId);
    },
    [closeSettingsPanel, closeParticipantsPanel]
  );

  // 초대모달 닫기
  const closeInviteModal = useCallback(() => {
    setInviteModalForRoomId(null);
  }, []);

  // 사용자 초대
  const handleInviteUsersToRoom = useCallback(
    async (roomId: string | null, usersToInvite: Participant[]) => {
      if (!roomId) {
        console.error("초대할 방의 ID가 없습니다.");
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("초대를 위해서는 로그인이 필요합니다.");
        return;
      }

      // [수정] 직접 fetch를 호출하는 대신, api.ts의 함수를 호출합니다.
      const invitePromises = usersToInvite.map((user) =>
        inviteUserToRoom(roomId, user.id)
      );

      const results = await Promise.allSettled(invitePromises);

      const successfulInvites: Participant[] = [];
      const failedInvites: string[] = [];

      results.forEach((result, index) => {
        const user = usersToInvite[index];
        if (result.status === "fulfilled") {
          successfulInvites.push(user);
        } else {
          // result.reason에 inviteUserToRoom에서 던진 Error 객체가 들어있습니다.
          console.error(result.reason);
          failedInvites.push(user.nickName);
        }
      });

      // 성공한 사용자들만 UI에 반영하는 로직은 동일합니다.
      if (successfulInvites.length > 0) {
        setChatrooms((currentChatrooms) =>
          currentChatrooms.map((room) => {
            if (String(room.id) === roomId) {
              const existingParticipantIds = new Set(
                room.participants.map((p) => p.id)
              );
              const newParticipants = successfulInvites.filter(
                (user) => !existingParticipantIds.has(user.id)
              );
              if (newParticipants.length > 0) {
                return {
                  ...room,
                  participants: [...room.participants, ...newParticipants],
                };
              }
            }
            return room;
          })
        );
      }

      // 사용자에게 최종 결과를 알려주는 로직도 동일합니다.
      if (failedInvites.length > 0) {
        alert(
          `초대 실패: ${failedInvites.join(
            ", "
          )}\n나머지 사용자는 성공적으로 초대되었습니다.`
        );
      } else {
        alert("선택한 모든 사용자를 성공적으로 초대했습니다.");
      }

      closeInviteModal();
    },
    [closeInviteModal]
  );

  // 방 최소화
  const minimizeRoom = useCallback(
    (id: string) => {
      if (settingsOpenForId === id) closeSettingsPanel();
      if (participantsPanelOpenForId === id) closeParticipantsPanel();
      setMinimizedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));

      if (activeId === id) {
        let nextActiveId: string | null = null;
        let maxZ = BASE_Z_INDEX - 1;
        const newlyMinimizedIds = [...minimizedIds, id];
        openIds
          .filter((oid) => oid !== id && !newlyMinimizedIds.includes(oid))
          .forEach((oid) => {
            const z = zIndices[oid];
            if (z !== undefined && z > maxZ) {
              maxZ = z;
              nextActiveId = oid;
            }
          });
        setActiveId(nextActiveId);
      }
    },
    [
      activeId,
      openIds,
      minimizedIds,
      zIndices,
      settingsOpenForId,
      closeSettingsPanel,
      participantsPanelOpenForId,
      closeParticipantsPanel,
    ]
  );

  // 최소화 된 방 복구
  const restoreRoom = useCallback(
    (id: string) => {
      setMinimizedIds((ids) => ids.filter((v) => v !== id));
      bringToFront(id);
    },
    [bringToFront]
  );

  // 채팅방 고정
  const togglePin = useCallback((id: string) => {
    setPinnedIds((ids) =>
      ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id]
    );
  }, []);

  const activeWindows = openIds.filter(
    (id) => !minimizedIds.includes(id) && chatrooms.some((cr) => cr.id === id)
  );
  const minimizedWindows = openIds.filter(
    (id) => minimizedIds.includes(id) && chatrooms.some((cr) => cr.id === id)
  );

  // 백드롭 요소 클릭 감지
  const handleBackdropClick = useCallback(() => {
    activeWindows.forEach((id) => {
      if (!pinnedIds.includes(id)) {
        minimizeRoom(id);
      }
    });
    if (settingsOpenForId !== null) {
      const settingsRoomIsPinned =
        pinnedIds.includes(settingsOpenForId) &&
        activeWindows.includes(settingsOpenForId);
      if (!settingsRoomIsPinned) closeSettingsPanel();
    }
    if (participantsPanelOpenForId !== null) {
      const participantsRoomIsPinned =
        pinnedIds.includes(participantsPanelOpenForId) &&
        activeWindows.includes(participantsPanelOpenForId);
      if (!participantsRoomIsPinned) closeParticipantsPanel();
    }
  }, [
    activeWindows,
    pinnedIds,
    minimizeRoom,
    closeSettingsPanel,
    closeParticipantsPanel,
    settingsOpenForId,
    participantsPanelOpenForId,
  ]);

  const currentRoomForSettings =
    settingsOpenForId !== null
      ? chatrooms.find((r) => r.id === settingsOpenForId)
      : null;
  const currentRoomForParticipants =
    participantsPanelOpenForId !== null
      ? chatrooms.find((r) => r.id === participantsPanelOpenForId)
      : null;
  const roomToLeave =
    leaveConfirmModalForId !== null
      ? chatrooms.find((room) => room.id === leaveConfirmModalForId)
      : null;
  const roomForInvite =
    inviteModalForRoomId !== null
      ? chatrooms.find((r) => r.id === inviteModalForRoomId)
      : null;

  return (
    <DndProvider backend={HTML5Backend}>
      {(activeWindows.some((id) => !pinnedIds.includes(id)) ||
        settingsOpenForId !== null ||
        participantsPanelOpenForId !== null) && (
        <div
          onClick={handleBackdropClick}
          className={styles.backdrop}
          style={{ zIndex: BACKDROP_Z_INDEX }}
        />
      )}

      <div className={styles.sidebar} style={{ zIndex: SIDEBAR_Z_INDEX }}>
        <div>
          <div
            onClick={() => navigate("/generator")}
            className={`${styles.sidebarIcon} ${styles.sidebarIconTop}`}
            title="홈으로 가기"
          >
            🏠
          </div>

          <div
            onClick={() => setDrawerOpen((o) => !o)}
            className={`${styles.sidebarIcon} ${styles.sidebarIconTop}`}
            title={drawerOpen ? "목록 닫기" : "목록 열기"}
          >
            💬
          </div>
        </div>
        <div
          className={`${styles.sidebarIcon} ${styles.sidebarIconBottom}`}
          title="전체 설정 (미구현)"
        >
          ⚙️
        </div>
      </div>

      <div
        className={styles.drawer}
        style={{ left: drawerOpen ? 60 : -240, zIndex: DRAWER_Z_INDEX }}
      >
        <div className={styles.drawerHeaderContainer}>
          <h3 className={styles.drawerHeader}>채팅 목록</h3>
          <button
            className={styles.addRoomButton}
            onClick={() => setIsAddRoomOpen(true)}
            title="새 채팅방 추가"
          >
            ⊕
          </button>
        </div>
        <ul className={styles.drawerList}>
          {chatrooms.map((r) => (
            <li
              key={r.id}
              onClick={() => openRoom(r.id)}
              className={styles.drawerListItem}
            >
              {r.name}
            </li>
          ))}
        </ul>
      </div>

      {currentUser &&
        activeWindows.map((id) => {
          const room = chatrooms.find((r) => r.id === id)!;
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
              currentUser={currentUser}
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

      <div
        className={styles.minimizedBar}
        style={{ zIndex: MINIMIZED_BAR_Z_INDEX }}
      >
        {minimizedWindows.map((id) => {
          const room = chatrooms.find((r) => r.id === id);
          if (!room) return null;
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
      </div>

      {isAddRoomOpen && (
        <AddRoom
          onClose={() => setIsAddRoomOpen(false)}
          onAdd={handleAddRoom}
        />
      )}

      {settingsOpenForId !== null &&
        settingsPanelPosition !== null &&
        currentRoomForSettings && (
          <ChatWindowSettingsPanel
            roomId={settingsOpenForId}
            top={settingsPanelPosition.top}
            left={settingsPanelPosition.left}
            zIndex={SETTINGS_PANEL_Z_INDEX}
            onClose={closeSettingsPanel}
            onLeaveRoom={requestLeaveChatroom}
            onOpenInviteModal={openInviteModal}
          />
        )}

      {participantsPanelOpenForId !== null &&
        participantsPanelPosition !== null &&
        currentRoomForParticipants &&
        currentUser && (
          <ChatRoomParticipantsPanel
            //roomId={participantsPanelOpenForId}
            participants={currentRoomForParticipants.participants}
            currentUser={currentUser}
            top={participantsPanelPosition.top}
            left={participantsPanelPosition.left}
            zIndex={PARTICIPANTS_PANEL_Z_INDEX}
            onClose={closeParticipantsPanel}
          />
        )}

      <ConfirmModal
        isOpen={leaveConfirmModalForId !== null}
        title="채팅방 나가기"
        message={
          roomToLeave ? (
            <>
              <strong>{roomToLeave.name}</strong> 채팅방을
              <br />
              정말로 나가시겠습니까?
            </>
          ) : (
            "채팅방을 정말로 나가시겠습니까?"
          )
        }
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
        confirmText="나가기"
        cancelText="취소"
        zIndex={CONFIRM_MODAL_Z_INDEX}
      />

      {inviteModalForRoomId !== null && roomForInvite && (
        <InviteModal
          isOpen={true}
          onClose={closeInviteModal}
          currentRoomId={inviteModalForRoomId}
          currentRoomName={roomForInvite.name}
          currentParticipants={roomForInvite.participants}
          allUsers={allParticipants}
          onInviteConfirm={(usersToInvite) =>
            handleInviteUsersToRoom(inviteModalForRoomId, usersToInvite)
          }
          zIndex={INVITE_MODAL_Z_INDEX}
        />
      )}
    </DndProvider>
  );
}
