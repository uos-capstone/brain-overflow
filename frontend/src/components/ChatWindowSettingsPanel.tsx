//ChatWindowSettingsPanel.tsx 

import React from 'react';
import styles from '../css/ChatWindowSettingsPanel.module.css';

interface ChatWindowSettingsPanelProps {
    top: number;
    left: number;
    zIndex: number;
    onClose: () => void;
    roomId: number;
    onLeaveRoom: (id: number) => void;
    onOpenInviteModal: (roomId: number) => void;
}

export const ChatWindowSettingsPanel: React.FC<ChatWindowSettingsPanelProps> = ({
    top,
    left,
    zIndex,
    onClose,
    roomId,
    onLeaveRoom,
    onOpenInviteModal,
}) => {
    const handlePanelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
    }

    const menuItems = [
        { label: "알림 설정", action: () => console.log("알림 설정 클릭됨") },
        {
            label: "초대하기",
            action: () => {
                onOpenInviteModal(roomId); // [수정] 초대 모달 열기 함수 호출
                // onClose(); // 설정 패널은 초대 모달이 열리면 Sidebar에서 닫아줄 수 있음 (openInviteModal 내부에서)
            }
        },
        { type: 'divider' as const }, // 구분선 타입
        {
            label: "채팅방 나가기",
            action: () => {
                console.log(`채팅방 나가기 클릭됨 for room ${roomId}`);
                onLeaveRoom(roomId);
                onClose(); 
            }
        },
    ];

    return (
        <div
            className={styles.settingsPanel}
            style={{ top: `${top}px`, left: `${left}px`, zIndex }}
            onClick={handlePanelClick}
            onMouseDown={handleMouseDown}
        >
            <ul className={styles.settingsList}>
                {menuItems.map((item, index) => {
                    if (item.type === 'divider') {
                        return <hr key={`divider-${index}`} className={styles.separator} />;
                    }
                    return (
                        <li
                            key={item.label}
                            onClick={() => {
                                item.action();
                                onClose();
                            }}
                        >
                            {item.label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};