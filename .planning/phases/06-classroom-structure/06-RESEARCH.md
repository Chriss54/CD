# Phase 6: Classroom Structure - Research

**Researched:** 2026-01-23
**Domain:** LMS course authoring (admin), rich text editing, drag-and-drop tree navigation, file attachments
**Confidence:** HIGH

## Summary

Phase 6 implements admin-facing course hierarchy management: courses, modules, and lessons with rich content editing. The research covers four key domains: database schema for hierarchical course content, enhanced Tiptap editor with code blocks/tables/links, drag-and-drop tree navigation for course structure, and file attachments via Supabase Storage.

The project already has Tiptap v3.17 and Supabase configured from previous phases, so extending those is straightforward. The main new additions are: Tiptap extensions for code blocks, tables, and links; dnd-kit-sortable-tree for the sidebar tree; and Supabase Storage for file attachments.

**Primary recommendation:** Extend existing Tiptap setup with @tiptap/extension-code-block, @tiptap/extension-table, and @tiptap/extension-link. Use dnd-kit-sortable-tree for sidebar navigation with cross-module lesson dragging. Store attachments in Supabase Storage with signed URLs.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tiptap/extension-code-block | 3.17.x | Code blocks in lesson content | Official Tiptap extension, 351 npm dependents |
| @tiptap/extension-table | 3.17.x | Tables in lesson content | Official Tiptap extension, includes TableRow/Cell/Header |
| @tiptap/extension-link | 3.17.x | Hyperlinks in lesson content | Official Tiptap extension, 1,337 npm dependents |
| dnd-kit-sortable-tree | latest | Sidebar course tree with drag-drop | Built on dnd-kit, supports nested hierarchies out of box |
| @dnd-kit/core | latest | Drag-and-drop foundation | Peer dependency for dnd-kit-sortable-tree |
| @dnd-kit/sortable | latest | Sortable presets | Peer dependency for dnd-kit-sortable-tree |
| @dnd-kit/utilities | latest | Helper utilities | Peer dependency for dnd-kit-sortable-tree |
| @supabase/supabase-js | 2.91.1 | File storage (already installed) | Already in project, handles file attachments |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tiptap/extension-code-block-lowlight | 3.17.x | Syntax highlighting | If syntax highlighting needed (optional) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dnd-kit-sortable-tree | pragmatic-drag-and-drop | Smaller bundle but requires more manual tree implementation |
| dnd-kit-sortable-tree | dnd-kit (raw) | More control but must build tree logic yourself |
| Tiptap code-block | CodeMirror | Overkill for simple code display, adds complexity |

**Installation:**
```bash
npm install @tiptap/extension-code-block @tiptap/extension-table @tiptap/extension-link dnd-kit-sortable-tree @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(main)/
│   ├── admin/
│   │   └── courses/
│   │       ├── page.tsx              # Course list for admins
│   │       └── [courseId]/
│   │           ├── page.tsx          # Course editor with sidebar tree
│   │           └── lessons/
│   │               └── [lessonId]/
│   │                   └── page.tsx  # Lesson editor
│   └── classroom/
│       └── ...                       # Phase 7 (student view)
├── components/
│   ├── admin/
│   │   ├── course-tree.tsx           # Sidebar tree component
│   │   ├── course-form.tsx           # Create/edit course form
│   │   ├── module-form.tsx           # Create/edit module form
│   │   └── lesson-editor.tsx         # Enhanced Tiptap for lessons
│   └── video/
│       └── video-embed.tsx           # (already exists)
├── lib/
│   ├── course-actions.ts             # Server actions for courses
│   ├── module-actions.ts             # Server actions for modules
│   ├── lesson-actions.ts             # Server actions for lessons
│   ├── attachment-actions.ts         # Server actions for file uploads
│   └── validations/
│       ├── course.ts                 # Course validation schema
│       ├── module.ts                 # Module validation schema
│       └── lesson.ts                 # Lesson validation schema
└── types/
    └── course.ts                     # Course/Module/Lesson types
```

### Pattern 1: Hierarchical Course Schema
**What:** Course -> Module -> Lesson hierarchy with position ordering and draft states
**When to use:** Any hierarchical content structure with reordering
**Example:**
```prisma
// Source: Prisma self-relations documentation
enum CourseStatus {
  DRAFT
  PUBLISHED
}

enum LessonStatus {
  DRAFT
  PUBLISHED
}

model Course {
  id          String       @id @default(cuid())
  title       String
  description String?      @db.Text
  status      CourseStatus @default(DRAFT)

  modules     Module[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([status])
}

model Module {
  id        String   @id @default(cuid())
  title     String
  position  Int      // For ordering within course
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  lessons   Lesson[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([courseId])
  @@index([courseId, position])
}

model Lesson {
  id        String       @id @default(cuid())
  title     String
  position  Int          // For ordering within module
  status    LessonStatus @default(DRAFT)
  videoUrl  String?      // Optional video embed at top
  content   Json         // Tiptap JSON document
  moduleId  String
  module    Module       @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  attachments Attachment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([moduleId])
  @@index([moduleId, position])
}

model Attachment {
  id        String   @id @default(cuid())
  name      String   // Original filename
  url       String   // Supabase storage URL
  size      Int      // File size in bytes
  mimeType  String
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([lessonId])
}
```

### Pattern 2: Enhanced Tiptap Editor
**What:** Extend existing PostEditor with code blocks, tables, and links
**When to use:** Lesson content editing
**Example:**
```typescript
// Source: Tiptap official documentation
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';

export function LessonEditor({ content, onChange }: LessonEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CodeBlock.configure({
        exitOnTripleEnter: true,
        exitOnArrowDown: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
    ],
    content: content ? JSON.parse(content) : '',
    immediatelyRender: false, // CRITICAL: SSR compatibility
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });
  // ... toolbar and EditorContent
}
```

### Pattern 3: Sortable Tree for Course Structure
**What:** dnd-kit-sortable-tree for sidebar navigation with drag-drop reordering
**When to use:** Sidebar showing modules and lessons with drag-to-reorder
**Example:**
```typescript
// Source: dnd-kit-sortable-tree documentation
import { SortableTree, SimpleTreeItemWrapper } from 'dnd-kit-sortable-tree';
import React, { forwardRef } from 'react';

interface TreeItem {
  id: string;
  value: string;
  type: 'module' | 'lesson';
  children?: TreeItem[];
}

const TreeItemComponent = forwardRef<HTMLDivElement, TreeItemComponentProps>((props, ref) => (
  <SimpleTreeItemWrapper {...props} ref={ref}>
    <div className={props.item.type === 'module' ? 'font-semibold' : 'pl-4'}>
      {props.item.value}
    </div>
  </SimpleTreeItemWrapper>
));

export function CourseTree({ modules, onItemsChanged }: CourseTreeProps) {
  const items: TreeItem[] = modules.map(m => ({
    id: m.id,
    value: m.title,
    type: 'module',
    children: m.lessons.map(l => ({
      id: l.id,
      value: l.title,
      type: 'lesson',
    })),
  }));

  return (
    <SortableTree
      items={items}
      onItemsChanged={onItemsChanged}
      TreeItemComponent={TreeItemComponent}
    />
  );
}
```

### Pattern 4: Supabase Storage for Attachments
**What:** File upload via server action to Supabase Storage bucket
**When to use:** Lesson file attachments (PDFs, documents)
**Example:**
```typescript
// Source: Supabase Storage documentation
'use server';

import { createClient } from '@/lib/supabase/server';

export async function uploadAttachment(formData: FormData) {
  const file = formData.get('file') as File;
  const lessonId = formData.get('lessonId') as string;

  const supabase = createClient();
  const path = `lessons/${lessonId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  // Get public URL (or signed URL for private bucket)
  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(path);

  // Save to database
  await db.attachment.create({
    data: {
      name: file.name,
      url: publicUrl,
      size: file.size,
      mimeType: file.type,
      lessonId,
    },
  });

  return { success: true };
}
```

### Anti-Patterns to Avoid
- **Nested SortableContext without flattening:** dnd-kit nested contexts don't allow cross-level dragging. Flatten the tree structure with ancestorsIds for cross-module lesson moves.
- **Updating all positions on reorder:** Only update the affected items' positions, not the entire list.
- **Deeply nested Prisma includes:** Prisma doesn't support recursive includes. Explicitly specify depth or use raw queries for deep hierarchies.
- **Missing immediatelyRender: false:** Tiptap SSR hydration errors without this option.
- **Forgetting Table companion extensions:** Table extension requires TableRow, TableCell, and TableHeader.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tree drag-drop | Custom drag-drop tree | dnd-kit-sortable-tree | Handles nested items, cross-level moves, keyboard accessibility |
| Code blocks | Custom `<pre><code>` | @tiptap/extension-code-block | Integrates with Tiptap, handles keyboard shortcuts, proper escaping |
| Tables in editor | Custom table HTML | @tiptap/extension-table | Cell merging, resizing, proper selection handling |
| File uploads | Custom upload handler | Supabase Storage + server actions | Already configured, handles streaming, large files |
| Video parsing | Regex URL parsing | get-video-id (already installed) | Handles all URL formats for YouTube/Vimeo/Loom |

**Key insight:** LMS course builders are a solved problem. Tiptap extensions exist for all common rich text needs. dnd-kit-sortable-tree handles the complex tree reordering. Supabase Storage handles file uploads. Don't reinvent.

## Common Pitfalls

### Pitfall 1: Position Field Race Conditions
**What goes wrong:** Multiple users reordering simultaneously causes position collisions
**Why it happens:** Optimistic updates without conflict resolution
**How to avoid:** Use database transactions for reorder operations; revalidate positions server-side
**Warning signs:** Items appearing in wrong order after refresh

### Pitfall 2: Orphaned Attachments in Storage
**What goes wrong:** Files remain in Supabase Storage after lesson deletion
**Why it happens:** Prisma cascade delete only removes database records, not storage files
**How to avoid:** Use Prisma middleware or explicit cleanup in delete action
**Warning signs:** Storage usage grows unexpectedly; broken file links

### Pitfall 3: Tiptap Table Extension Missing Companions
**What goes wrong:** Tables don't render, errors about missing node types
**Why it happens:** Table extension requires TableRow, TableCell, TableHeader extensions
**How to avoid:** Always install and configure all four table-related extensions
**Warning signs:** "Unknown node type" errors, tables not appearing

### Pitfall 4: Draft Course Content Leaking to Students
**What goes wrong:** Unpublished lessons visible via direct URL
**Why it happens:** Missing status checks in data fetching
**How to avoid:** Server-side status checks on all student-facing queries; middleware for route protection
**Warning signs:** Students reporting seeing incomplete content

### Pitfall 5: Position Gaps After Deletion
**What goes wrong:** Position values like [1, 3, 4] instead of [1, 2, 3] after deletions
**Why it happens:** Deleting middle items without recompacting positions
**How to avoid:** Either recompact positions after delete, or use sparse positions (acceptable)
**Warning signs:** Ordering becomes unpredictable over time

### Pitfall 6: Large File Upload Timeouts
**What goes wrong:** Uploads fail for files >1MB
**Why it happens:** Next.js server action body size limit (default 1MB)
**How to avoid:** Already configured 5MB limit in project (03-01); for larger files, use signed URLs
**Warning signs:** "Request body too large" errors

## Code Examples

Verified patterns from official sources:

### Reordering Items with Position Updates
```typescript
// Server action for reordering modules
'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function reorderModules(
  courseId: string,
  orderedIds: string[]
) {
  // Use transaction to prevent race conditions
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.module.update({
        where: { id },
        data: { position: index },
      })
    )
  );

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true };
}
```

### Moving Lesson Between Modules
```typescript
// Server action for moving lesson to different module
'use server';

export async function moveLessonToModule(
  lessonId: string,
  targetModuleId: string,
  newPosition: number
) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });

  if (!lesson) return { error: 'Lesson not found' };

  await db.$transaction([
    // Update lesson's module and position
    db.lesson.update({
      where: { id: lessonId },
      data: {
        moduleId: targetModuleId,
        position: newPosition,
      },
    }),
    // Recompact source module positions
    ...await getRecompactQueries(lesson.moduleId, lessonId),
    // Shift target module positions
    ...await getShiftQueries(targetModuleId, newPosition),
  ]);

  return { success: true };
}
```

### Module Deletion with Lesson Count Warning
```typescript
// Check for lessons before showing delete confirmation
export async function getModuleWithLessonCount(moduleId: string) {
  return db.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      title: true,
      _count: { select: { lessons: true } },
    },
  });
}

// In component: show modal warning if _count.lessons > 0
```

### Link Toolbar Button
```typescript
// Source: Tiptap Link extension docs
const setLink = () => {
  const previousUrl = editor.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);

  if (url === null) return; // Cancelled
  if (url === '') {
    editor.chain().focus().unsetLink().run();
    return;
  }

  editor.chain().focus().setLink({ href: url }).run();
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | dnd-kit or pragmatic-drag-and-drop | 2024 | rbd deprecated, Atlassian moved to pdnd |
| Custom position columns | dnd-kit-sortable-tree handles state | 2023+ | Less manual state management |
| Blob URLs for uploads | Supabase signed URLs | Standard | Better security, no memory leaks |
| DIY rich text tables | @tiptap/extension-table | Standard | Complex cell operations handled |

**Deprecated/outdated:**
- react-beautiful-dnd: Archived, no longer maintained. Migrate to pragmatic-drag-and-drop or dnd-kit.
- Tiptap v2: Project uses v3.17, which has breaking changes from v2.

## Open Questions

Things that couldn't be fully resolved:

1. **Syntax highlighting in code blocks**
   - What we know: @tiptap/extension-code-block-lowlight provides syntax highlighting
   - What's unclear: Whether highlighting is needed for this use case (LMS, not code-focused)
   - Recommendation: Start without highlighting, add if users request it (requires lowlight + language packs)

2. **File size limits for attachments**
   - What we know: Project has 5MB serverActions.bodySizeLimit; Supabase free tier has storage limits
   - What's unclear: Exact file size and type restrictions for this community
   - Recommendation: Start with 10MB limit, common file types (PDF, DOCX, ZIP); configurable later

3. **Preview mode implementation**
   - What we know: CONTEXT.md says "Preview button opens student view in new tab or modal"
   - What's unclear: Whether preview needs full student styling or just content preview
   - Recommendation: New tab to /classroom/courses/[id]/preview with ?preview=true query param, bypasses status check for admin

## Sources

### Primary (HIGH confidence)
- Tiptap official docs - CodeBlock, Table, Link extensions (tiptap.dev/docs)
- Prisma self-relations documentation (prisma.io/docs)
- Supabase Storage upload API (supabase.com/docs)
- dnd-kit-sortable-tree GitHub (github.com/Shaddix/dnd-kit-sortable-tree)
- dnd-kit official documentation (docs.dndkit.com)

### Secondary (MEDIUM confidence)
- [Top 5 Drag-and-Drop Libraries for React](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) - Library comparison
- [React + dnd-kit tree implementation](https://dev.to/fupeng_wang/react-dnd-kit-implement-tree-list-drag-and-drop-sortable-225l) - Tree flattening pattern
- [Complete Guide to File Uploads with Next.js and Supabase Storage](https://supalaunch.com/blog/file-upload-nextjs-supabase) - Upload patterns

### Tertiary (LOW confidence)
- LMS UI patterns from MasterStudy, Tutor LMS, LearnDash comparisons - General UI inspiration only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using official Tiptap extensions and well-documented dnd-kit ecosystem
- Architecture: HIGH - Follows established Prisma patterns and existing project conventions
- Pitfalls: HIGH - Common issues documented in official docs and GitHub issues
- File attachments: MEDIUM - Supabase Storage is straightforward but exact limits TBD

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain, established libraries)

---

*Phase: 06-classroom-structure*
*Researched by: gsd-phase-researcher*
