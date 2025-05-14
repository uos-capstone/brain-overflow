// src/components/ConfirmModal.tsx
import React from 'react';
import styles from '../css/ConfirmModal.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode; // �޽����� JSX ���� �����ϵ��� React.ReactNode ���
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
    confirmText = "Ȯ��",
    cancelText = "���",
    zIndex = 15000, // �⺻ z-index (�ٸ� �гε麸�� ����)
}) => {
    if (!isOpen) {
        return null;
    }

    // ��� ���� Ŭ�� �� �̺�Ʈ ���� �ߴ� (���� Ŭ�� ����)
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