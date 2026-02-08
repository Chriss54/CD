import { Suspense } from 'react';
import { Metadata } from 'next';
import { getKanbanCards } from '@/lib/kanban-actions';
import { KanbanBoard } from '@/components/admin/kanban/kanban-board';

export const metadata: Metadata = {
    title: 'Kanban Board | Admin',
};

async function KanbanContent() {
    const cards = await getKanbanCards();

    return <KanbanBoard initialData={cards} />;
}

export default function KanbanPage() {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Kanban Board</h1>
                <p className="text-muted-foreground mt-1">
                    Projekte verwalten und den Fortschritt verfolgen.
                </p>
            </div>

            <Suspense
                fallback={
                    <div className="p-8 text-center text-muted-foreground">
                        Board wird geladen...
                    </div>
                }
            >
                <KanbanContent />
            </Suspense>
        </div>
    );
}
