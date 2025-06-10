import React from "react";

interface NotificationToastProps {
  mriId: string;
  resultId: string;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  mriId,
  resultId,
  onClose,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        backgroundColor: "#1e293b",
        color: "white",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        zIndex: 9999,
        minWidth: "240px",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        🧠 MRI 생성 완료
        <br />
        <b>MRI ID:</b> {mriId}
        <br />
        <b>결과 ID:</b> {resultId}
      </div>
      <button
        onClick={onClose}
        style={{
          background: "#3b82f6",
          border: "none",
          color: "white",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        확인
      </button>
    </div>
  );
};
