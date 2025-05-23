// Sidebar.tsx 최상단 import 옆에 추가
import { useDrag } from 'react-dnd';

// … DndProvider 바로 아래에
export function DebugDragBox() {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'DEBUG',
        item: {},
        collect: monitor => {
            console.log('🕹 DebugDragBox collect:', monitor.isDragging());
            return { isDragging: monitor.isDragging() };
        },
    }), []);

    // ✔️ 콜백 ref 패턴으로 drag(node) 호출
    return (
        <div
            ref={(node: HTMLDivElement | null) => {
                if (node) drag(node);
            }}
            style={{
                width: 80,
                height: 80,
                background: isDragging ? 'tomato' : 'skyblue',
                cursor: 'move',
                margin: 8,
            }}
        >
            Drag Me
        </div>
    );
}