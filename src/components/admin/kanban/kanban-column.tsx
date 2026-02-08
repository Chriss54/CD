'use client';

import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanCard } from './kanban-card';
import type { KanbanCardData } from '@/lib/kanban-actions';

interface KanbanColumnProps {
    id: string;
    title: string;
    color: string;
    icon: React.ReactNode;
    cards: KanbanCardData[];
    onEdit: (card: KanbanCardData) => void;
    onDelete: (id: string) => void;
    onAddCard?: () => void;
}

export function KanbanColumn({
    id,
    title,
    color,
    icon,
    cards,
    onEdit,
    onDelete,
    onAddCard,
}: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            className={`
        flex flex-col min-w-[300px] max-w-[380px] flex-1 rounded-2xl transition-all duration-200
        ${isOver ? 'ring-2 ring-blue-400/50 bg-blue-50/30' : 'bg-gray-50/80'}
      `}
        >
            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                        <span className="text-xs text-gray-400">{cards.length} {cards.length === 1 ? 'Karte' : 'Karten'}</span>
                    </div>
                </div>
                {onAddCard && (
                    <button
                        onClick={onAddCard}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Neue Karte"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Cards area */}
            <div
                ref={setNodeRef}
                className="flex-1 px-3 pb-3 space-y-2.5 min-h-[120px]"
            >
                <SortableContext
                    items={cards.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {cards.map((card) => (
                        <KanbanCard
                            key={card.id}
                            card={card}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </SortableContext>

                {cards.length === 0 && (
                    <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-200 text-gray-300 text-xs">
                        Karten hierher ziehen
                    </div>
                )}
            </div>
        </div>
    );
}
