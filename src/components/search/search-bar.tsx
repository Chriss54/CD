'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  compact?: boolean;
  placeholder?: string;
}

export function SearchBar({ compact, placeholder }: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  // Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const defaultPlaceholder = compact ? 'Search...' : 'Search... ⌘K';

  return (
    <form onSubmit={handleSubmit} className={compact ? 'w-full' : ''}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || defaultPlaceholder}
        className={`
          px-3 py-2 text-sm rounded-full bg-gray-100 text-gray-900 placeholder:text-gray-500 
          focus:ring-2 focus:ring-blue-500 focus:outline-none border-0
          ${compact ? 'w-full' : 'w-64 px-4'}
        `}
      />
    </form>
  );
}

