'use client';

import { useState, useTransition, forwardRef, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  SortableTree,
  SimpleTreeItemWrapper,
  TreeItemComponentProps,
  TreeItem,
  TreeItems,
} from 'dnd-kit-sortable-tree';

// ItemChangedReason is not exported from the package, define it locally
type ItemChangedReason<T> = {
  type: 'removed';
  item: TreeItem<T>;
} | {
  type: 'dropped';
  draggedItem: TreeItem<T>;
  droppedToParent: TreeItem<T> | null;
  draggedFromParent: TreeItem<T> | null;
} | {
  type: 'collapsed' | 'expanded';
  item: TreeItem<T>;
};
import { cn } from '@/lib/utils';
import { reorderModules } from '@/lib/module-actions';
import { reorderLessons, moveLessonToModule } from '@/lib/lesson-actions';
import { LessonForm } from '@/components/admin/lesson-form';
import type { ModuleWithLessons, LessonStatus } from '@/types/course';

// Context to pass add lesson handler to tree items
interface TreeContextValue {
  addingLessonToModule: string | null;
  onAddLessonClick: (moduleId: string) => void;
  onAddLessonCancel: () => void;
  onAddLessonSuccess: () => void;
  courseId: string;
}

const TreeContext = createContext<TreeContextValue | null>(null);

// Custom data for tree items
interface TreeItemData {
  value: string;
  type: 'module' | 'lesson';
  status?: LessonStatus;
  moduleId?: string; // For lessons, reference to parent module
}

interface CourseTreeProps {
  courseId: string;
  modules: ModuleWithLessons[];
  currentLessonId?: string;
}

// Custom tree item component
const TreeItemComponent = forwardRef<HTMLDivElement, TreeItemComponentProps<TreeItemData>>(
  (props, ref) => {
    const pathname = usePathname();
    const treeContext = useContext(TreeContext);
    const { item, depth, collapsed, onCollapse, childCount } = props;
    const isModule = item.type === 'module';
    const isLesson = item.type === 'lesson';

    // Extract courseId from pathname for lesson links
    const courseId = pathname.split('/courses/')[1]?.split('/')[0] ?? '';

    // Check if this lesson is currently active
    const isActive = isLesson && pathname.includes(`/lessons/${item.id}`);

    // Check if we're showing the add lesson form for this module
    const isAddingLesson = isModule && treeContext?.addingLessonToModule === item.id;

    const content = (
      <div
        className={cn(
          'group flex items-center gap-2 py-1.5 px-2 rounded text-sm cursor-pointer select-none',
          isModule && 'font-medium text-gray-900',
          isLesson && 'text-gray-700',
          isLesson && item.status === 'DRAFT' && 'text-gray-500',
          isActive && 'bg-blue-100 text-blue-900',
          !isActive && 'hover:bg-gray-100'
        )}
      >
        {isModule && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCollapse?.();
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700"
          >
            {collapsed ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        )}
        {isModule && (
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )}
        {isLesson && (
          <svg className="w-4 h-4 text-gray-400 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <span className="flex-1 truncate">{item.value}</span>
        {isLesson && item.status === 'DRAFT' && (
          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Draft</span>
        )}
        {isModule && childCount !== undefined && childCount > 0 && (
          <span className="text-xs text-gray-400">{childCount}</span>
        )}
        {isModule && treeContext && !isAddingLesson && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              treeContext.onAddLessonClick(item.id as string);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
            title="Add lesson"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    );

    // Wrap lessons in links, modules are not clickable (just expandable)
    if (isLesson) {
      return (
        <SimpleTreeItemWrapper {...props} ref={ref}>
          <Link href={`/admin/courses/${courseId}/lessons/${item.id}`} className="block w-full">
            {content}
          </Link>
        </SimpleTreeItemWrapper>
      );
    }

    return (
      <SimpleTreeItemWrapper {...props} ref={ref}>
        <div className="w-full">
          {content}
          {isAddingLesson && treeContext && (
            <div className="mt-2 ml-8 mr-2">
              <LessonForm
                moduleId={item.id as string}
                courseId={treeContext.courseId}
                onSuccess={treeContext.onAddLessonSuccess}
                onCancel={treeContext.onAddLessonCancel}
              />
            </div>
          )}
        </div>
      </SimpleTreeItemWrapper>
    );
  }
);
TreeItemComponent.displayName = 'TreeItemComponent';

export function CourseTree({ courseId, modules, currentLessonId }: CourseTreeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addingLessonToModule, setAddingLessonToModule] = useState<string | null>(null);

  // Context value for tree items
  const treeContextValue: TreeContextValue = {
    addingLessonToModule,
    onAddLessonClick: (moduleId: string) => setAddingLessonToModule(moduleId),
    onAddLessonCancel: () => setAddingLessonToModule(null),
    onAddLessonSuccess: () => {
      setAddingLessonToModule(null);
      router.refresh();
    },
    courseId,
  };

  // Transform modules to tree items
  const initialItems: TreeItems<TreeItemData> = modules.map((m) => ({
    id: m.id,
    value: m.title,
    type: 'module' as const,
    collapsed: false,
    canHaveChildren: true,
    children: m.lessons?.map((l) => ({
      id: l.id,
      value: l.title,
      type: 'lesson' as const,
      status: l.status as LessonStatus,
      moduleId: m.id,
      canHaveChildren: false,
    })) ?? [],
  }));

  const [items, setItems] = useState<TreeItems<TreeItemData>>(initialItems);

  // Handle tree changes (reorder, move)
  const handleItemsChanged = useCallback(
    (newItems: TreeItems<TreeItemData>, reason: ItemChangedReason<TreeItemData>) => {
      setItems(newItems);
      setError(null);

      if (reason.type === 'dropped') {
        const { draggedItem, droppedToParent, draggedFromParent } = reason;

        startTransition(async () => {
          try {
            if (draggedItem.type === 'module') {
              // Module reorder - get all module IDs in new order
              const moduleIds = newItems.map((item) => item.id as string);
              const result = await reorderModules(courseId, moduleIds);
              if ('error' in result) {
                setError(result.error as string);
                // Revert on error
                setItems(initialItems);
              }
            } else if (draggedItem.type === 'lesson') {
              // Lesson was moved or reordered
              const fromModuleId = draggedFromParent?.id as string;
              const toModuleId = droppedToParent?.id as string;

              if (fromModuleId === toModuleId) {
                // Reorder within same module
                const parentModule = newItems.find((m) => m.id === toModuleId);
                if (parentModule?.children) {
                  const lessonIds = parentModule.children.map((l) => l.id as string);
                  const result = await reorderLessons(toModuleId, lessonIds);
                  if ('error' in result) {
                    setError(result.error as string);
                    setItems(initialItems);
                  }
                }
              } else {
                // Move to different module
                const parentModule = newItems.find((m) => m.id === toModuleId);
                if (parentModule?.children) {
                  const newPosition = parentModule.children.findIndex(
                    (l) => l.id === draggedItem.id
                  );
                  const result = await moveLessonToModule(
                    draggedItem.id as string,
                    toModuleId,
                    newPosition
                  );
                  if ('error' in result) {
                    setError(result.error as string);
                    setItems(initialItems);
                  }
                }
              }
            }

            router.refresh();
          } catch (err) {
            console.error('Failed to update tree:', err);
            setError('Failed to save changes');
            setItems(initialItems);
          }
        });
      }
    },
    [courseId, initialItems, router]
  );

  return (
    <TreeContext.Provider value={treeContextValue}>
      <div className="w-full">
        {error && (
          <div className="mb-2 p-2 text-sm text-red-600 bg-red-50 rounded">
            {error}
          </div>
        )}
        {isPending && (
          <div className="mb-2 p-2 text-sm text-gray-500 bg-gray-50 rounded">
            Saving...
          </div>
        )}
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 px-2 py-4">
            No modules yet. Add a module to get started.
          </p>
        ) : (
          <SortableTree
            items={items}
            onItemsChanged={handleItemsChanged}
            TreeItemComponent={TreeItemComponent}
            indentationWidth={16}
            indicator
            canRootHaveChildren={(item) => item.type === 'module'}
          />
        )}
      </div>
    </TreeContext.Provider>
  );
}
