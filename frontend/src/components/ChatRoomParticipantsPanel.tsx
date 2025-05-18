import React from 'react';
import styles from '../css/ChatRoomParticipantsPanel.module.css';
import { Participant } from '../util/api';

interface ChatRoomParticipantsPanelProps {
    //roomId: string;
    participants: Participant[];
    currentUser: Participant;
    top: number;
    left: number;
    zIndex: number;
    onClose: () => void;
}

export const ChatRoomParticipantsPanel: React.FC<ChatRoomParticipantsPanelProps> = ({
    //roomId,
    participants,
    currentUser,
    top,
    left,
    zIndex,
    onClose,
}) => {
    const handlePanelInteraction = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className={styles.participantsPanel}
            style={{ top: `${top}px`, left: `${left}px`, zIndex }}
            onClick={handlePanelInteraction}
            onMouseDown={handlePanelInteraction}
        >
            <div className={styles.header}>
                <h4 className={styles.title}>참여자 ({participants.length})</h4>
                <button onClick={onClose} className={styles.closeButton} title="닫기">✕</button>
            </div>
            {participants.length > 0 ? (
                <ul className={styles.participantsList}>
                    {participants.map((participant) => (
                        <li key={participant.id} className={styles.participantItem}>
                            {participant.userName}
                            {participant.userName === currentUser.userName && <span className={styles.meIndicator}> (나)</span>}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.noParticipants}>참여자가 없습니다.</p>
            )}
        </div>
    );
};