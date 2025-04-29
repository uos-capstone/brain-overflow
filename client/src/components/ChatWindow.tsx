// ChatWindow.tsx
import React from 'react';
import { useDrag } from 'react-dnd';

export interface ChatWindowProps {
    id: number;
    title: string;
    x: number;
    y: number;
    zIndex: number;
    isPinned: boolean;
    onMove: (id: number, x: number, y: number) => void;
    onClose: (id: number) => void;
    onMinimize: (id: number) => void;
    onBringToFront: (id: number) => void;
    onTogglePin: (id: number) => void;
    children?: React.ReactNode;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    id,
    title,
    x,
    y,
    zIndex,
    isPinned,
    onMove,
    onClose,
    onMinimize,
    onBringToFront,
    onTogglePin,
    children,
}) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'CHAT_WINDOW',
        item: { id, startX: x, startY: y },
        collect: monitor => ({ isDragging: monitor.isDragging() }),
        end: (item, monitor) => {
            const diff = monitor.getDifferenceFromInitialOffset();
            if (diff && (diff.x !== 0 || diff.y !== 0)) {
                onMove(id, item.startX + diff.x, item.startY + diff.y);
            }
        },
    }), [id, x, y, onMove]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target instanceof HTMLElement && e.target.closest('button, input')) {
            return;
        }
        onBringToFront(id);
    };

    const buttonStyle: React.CSSProperties = {
        background: 'transparent',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '0 5px',
        lineHeight: '1',
        marginLeft: '5px',
        outline: 'none',
    };


    return (
        <div
            onMouseDown={handleMouseDown}
            style={{
                position: 'fixed',
                left: x,
                top: y,
                width: 450,
                height: 630,
                opacity: isDragging ? 0.75 : 1,
                background: '#fff',
                border: '1px solid #888',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,.25)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: zIndex,
                userSelect: 'none',
                overflow: 'hidden',
            }}
        >
            {/* 헤더 */}
            <div
                ref={drag}
                style={{
                    padding: '8px 12px',
                    background: '#4e4e4e',
                    color: '#fff',
                    borderTopLeftRadius: 7,
                    borderTopRightRadius: 7,
                    cursor: 'move',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                }}
            >
                <span>{title}</span>
                <div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onTogglePin(id); }}
                        style={buttonStyle}
                        title={isPinned ? "고정 해제" : "창 고정"}
                    >
                        {isPinned ? '📍' : '📌'}
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onMinimize(id); }}
                        style={buttonStyle} 
                        title="최소화"
                    >
                        _
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(id); }}
                        style={buttonStyle} 
                        title="닫기"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* 채팅내용 */}
            <div style={{ flex: 1, padding: 12, overflowY: 'auto', background: '#f9f9f9' }}>
                {children}
            </div>

            {/* 메시지적는칸 */}
            <div style={{ padding: 8, borderTop: '1px solid #eee', display: 'flex', background: '#fff', flexShrink: 0 }}>
                <input style={{ height: 30, flex: 1, padding: '6px 10px', fontSize: 16, border: '1px solid #ccc', borderRadius: 4 }} placeholder="메시지 입력" />
            </div>
        </div>
    );
};