// src/components/ConfirmModal.tsx
import React from 'react';
import styles from '../css/ConfirmModal.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode; // 메시지에 JSX 포함 가능하도록 React.ReactNode 사용
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    zIndex?: number;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "확인",
    cancelText = "취소",
    zIndex = 15000, // 기본 z-index (다른 패널들보다 높게)
}) => {
    if (!isOpen) {
        return null;
    }

    // 모달 내부 클릭 시 이벤트 전파 중단 (백드롭 클릭 방지)
    const handleModalContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className={styles.modalBackdrop} style={{ zIndex }} onClick={onCancel}>
            <div className={styles.modalContent} onClick={handleModalContentClick}>
                <h3 className={styles.modalTitle}>{title}</h3>
                <div className={styles.modalMessage}>{message}</div>
                <div className={styles.modalActions}>
                    <button onClick={onCancel} className={`${styles.modalButton} ${styles.cancelButton}`}>
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className={`${styles.modalButton} ${styles.confirmButton}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};