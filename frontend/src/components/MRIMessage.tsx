// src/components/MRIMessage.tsx
import React from 'react';
import { ChatMessageData } from '../util/api';

interface MRIMessageProps {
  chat: ChatMessageData;
  onClick: (content: string) => void;
}

export const MRIMessage: React.FC<MRIMessageProps> = ({ chat, onClick }) => {
  // "<MRI>" 접두사 제거
  const payload = chat.content.replace(/^<MRI>\s*/, '');

  // 클릭 핸들러: content(즉 "<MRI> ...") 전체를 인자로 보냄
  const handleClick = () => {
    onClick(chat.content);
  };

  return (
    <div
      style={{
        padding: '8px',
        background: '#f0f8ff',
        borderRadius: '4px',
        margin: '4px 0',
        border: '1px solid #a0c4ff',
        cursor: 'pointer' // 클릭 가능하다는 걸 시각적으로 표시
      }}
      onClick={handleClick}
    >
      {/* 보낸 사람 이름 */}
      <div
        style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#333',
          marginBottom: '4px'
        }}
      >
        {chat.senderName}
      </div>

      {/* 실제 MRI 페이로드 */}
      <div style={{ fontSize: '1rem', color: '#000' }}>
        🧠 {payload}
      </div>

      {/* 타임스탬프 */}
      <div
        style={{
          fontSize: '0.75rem',
          color: '#666',
          textAlign: 'right',
          marginTop: '6px'
        }}
      >
        {chat.timestamp}
      </div>
    </div>
  );
};
