'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface PostEditorProps {
  content?: string;
  onChange?: (json: object) => void;
  placeholder?: string;
}

export function PostEditor({ content, onChange, placeholder }: PostEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content ? JSON.parse(content) : '',
    immediatelyRender: false, // CRITICAL: Prevents SSR hydration errors
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4">
      {/* Toolbar */}
      <div className="flex gap-1 mb-3 pb-3 border-b">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded hover:bg-gray-100 ${
            editor.isActive('bold') ? 'bg-gray-200 font-bold' : ''
          }`}
          aria-label="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded hover:bg-gray-100 ${
            editor.isActive('italic') ? 'bg-gray-200 italic' : ''
          }`}
          aria-label="Italic"
        >
          I
        </button>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-[100px] focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}
