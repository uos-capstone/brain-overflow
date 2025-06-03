// src/components/InviteModal.tsx
import React, { useState, useMemo, useCallback } from 'react';
import styles from '../css/InviteModal.module.css';
import { Participant } from '../util/api'; // Sidebar에서 타입 가져오기

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRoomId: string;
    currentRoomName: string;
    currentParticipants: Participant[];
    allUsers: Participant[]; // 초대 가능한 전체 사용자 목록
    onInviteConfirm: (usersToInvite: Participant[]) => void;
    zIndex?: number;
}

export const InviteModal: React.FC<InviteModalProps> = ({
    isOpen,
    onClose,
    currentRoomName,
    currentParticipants,
    allUsers,
    onInviteConfirm,
    zIndex = 15050, // 기본 z-index
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Participant[]>([]);

    const currentParticipantIds = useMemo(() => new Set(currentParticipants.map(p => p.id)), [currentParticipants]);

    const filteredAndAvailableUsers = useMemo(() => {
        return allUsers.filter(user =>
            !currentParticipantIds.has(user.id) && // 이미 방에 없는 유저
            !selectedUsers.some(selected => selected.id === user.id) && // 아직 선택 목록에 없는 유저
            user.nickName.toLowerCase().includes(searchTerm.toLowerCase()) // 검색어와 일치하는 유저
        );
    }, [allUsers, currentParticipantIds, selectedUsers, searchTerm]);

    const handleSelectUser = useCallback((user: Participant) => {
        setSelectedUsers(prev => [...prev, user]);
    }, []);

    const handleDeselectUser = useCallback((userId: string) => {
        setSelectedUsers(prev => prev.filter(user => user.id !== userId));
    }, []);

    const handleConfirm = () => {
        if (selectedUsers.length > 0) {
            onInviteConfirm(selectedUsers);
        }
        // onClose(); // onInviteConfirm 내부에서 Sidebar가 모달을 닫음
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.modalBackdrop} style={{ zIndex }} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.modalTitle}>'{currentRoomName}' 방에 사용자 초대</h3>

                <div className={styles.inviteSectionsContainer}>
                    {/* 왼쪽: 검색 및 사용자 목록 */}
                    <div className={styles.userListSection}>
                        <input
                            type="text"
                            placeholder="초대할 사용자 검색..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <ul className={styles.userList}>
                            {filteredAndAvailableUsers.length > 0 ? (
                                filteredAndAvailableUsers.map(user => (
                                    <li key={user.id} className={styles.userListItem}>
                                        <span>{user.nickName} ({user.userName})</span>
                                        <button onClick={() => handleSelectUser(user)} className={styles.addButton}>추가</button>
                                    </li>
                                ))
                            ) : (
                                <li className={styles.noResults}>검색 결과가 없습니다.</li>
                            )}
                        </ul>
                    </div>

                    {/* 오른쪽: 선택된 사용자 (초대 목록) */}
                    <div className={styles.selectedUsersSection}>
                        <h4 className={styles.selectedUsersTitle}>초대할 사용자 ({selectedUsers.length})</h4>
                        <ul className={styles.selectedUserList}>
                            {selectedUsers.length > 0 ? (
                                selectedUsers.map(user => (
                                    <li key={user.id} className={styles.selectedUserItem}>
                                        <span>{user.nickName}</span>
                                        <button onClick={() => handleDeselectUser(user.id)} className={styles.removeButton}>X</button>
                                    </li>
                                ))
                            ) : (
                                <li className={styles.noSelectedUsers}>선택된 사용자가 없습니다.</li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button onClick={onClose} className={`${styles.modalButton} ${styles.cancelButton}`}>취소</button>
                    <button
                        onClick={handleConfirm}
                        className={`${styles.modalButton} ${styles.confirmButton}`}
                        disabled={selectedUsers.length === 0}
                    >
                        초대 ({selectedUsers.length})
                    </button>
                </div>
            </div>
        </div>
    );
};