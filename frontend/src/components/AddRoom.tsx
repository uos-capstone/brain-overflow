// AddRoom.tsx
import React from 'react';
import styles from '../css/AddRoom.module.css';

interface AddRoomProps {
    onClose: () => void;
    onAdd: (name: string) => void;
}

export const AddRoom: React.FC<AddRoomProps> = ({ onClose, onAdd }) => {
    const [roomName, setRoomName] = React.useState('');

    const handleAddClick = () => {
        if (roomName.trim()) {
            onAdd(roomName.trim());
            console.log("Adding room:", roomName.trim());
            onClose();
        } else {
            alert("채팅방 이름을 입력해주세요.");
        }
    };

    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={stopPropagation}>
                <h2 className={styles.modalTitle}>새 채팅방 추가</h2>
                <input
                    type="text"
                    placeholder="채팅방 이름"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className={styles.inputField}
                    autoFocus
                />
                <div className={styles.buttonGroup}>
                    <button onClick={onClose} className={styles.button}>
                        취소
                    </button>
                    <button
                        onClick={handleAddClick}
                        className={`${styles.button} ${styles.primaryButton}`}
                    >
                        추가
                    </button>
                </div>
            </div>
        </div>
    );
};