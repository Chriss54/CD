'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PostEditor } from './post-editor';
import { VideoInput } from '@/components/video/video-input';
import { VideoEmbedPlayer } from '@/components/video/video-embed';
import { createPost } from '@/lib/post-actions';
import type { VideoEmbed } from '@/types/post';
import { Avatar } from '@/components/ui/avatar';

interface Category {
    id: string;
    name: string;
    color: string;
}

interface CreatePostModalProps {
    categories: Category[];
    userImage?: string | null;
    userName?: string | null;
}

// Category color map for the pill buttons
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    General: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
    Announcements: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    Introductions: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    Questions: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
};

export function CreatePostModal({ categories, userImage, userName }: CreatePostModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [content, setContent] = useState<object | null>(null);
    const [embeds, setEmbeds] = useState<VideoEmbed[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Set default category when modal opens
    useEffect(() => {
        if (isOpen && categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0].id);
        }
    }, [isOpen, categories, selectedCategory]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!content) return;

        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.set('content', JSON.stringify(content));
        formData.set('embeds', JSON.stringify(embeds));
        if (selectedCategory) {
            formData.set('categoryId', selectedCategory);
        }

        const result = await createPost(formData);

        if ('error' in result) {
            setError(typeof result.error === 'string' ? result.error : 'An error occurred');
            setIsSubmitting(false);
            return;
        }

        // Success - close modal and refresh
        setIsOpen(false);
        setContent(null);
        setEmbeds([]);
        setSelectedCategory(null);
        router.refresh();
    };

    const removeEmbed = (index: number) => {
        setEmbeds(embeds.filter((_, i) => i !== index));
    };

    const getCategoryStyle = (categoryName: string) => {
        return categoryColors[categoryName] || categoryColors.General;
    };

    return (
        <>
            {/* Trigger - "Write something..." input */}
            <div
                onClick={() => setIsOpen(true)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Avatar src={userImage} name={userName} size="sm" />
                    <div className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-gray-500 text-sm">
                        Write something...
                    </div>
                </div>
            </div>

            {/* Modal overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal content */}
                    <div className="relative bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Neuen Post erstellen</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-5 space-y-5">
                                {/* Category selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((category) => {
                                            const style = getCategoryStyle(category.name);
                                            const isSelected = selectedCategory === category.id;
                                            return (
                                                <button
                                                    key={category.id}
                                                    type="button"
                                                    onClick={() => setSelectedCategory(category.id)}
                                                    className={`
                            px-4 py-1.5 rounded-full text-sm font-medium border transition-all
                            ${isSelected
                                                            ? `${style.bg} ${style.text} ${style.border}`
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                        }
                          `}
                                                >
                                                    {category.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Inhalt *</label>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <PostEditor
                                            onChange={(json) => setContent(json)}
                                            placeholder="Was möchtest du teilen?"
                                        />
                                    </div>
                                </div>

                                {/* Video embeds */}
                                {embeds.length > 0 && (
                                    <div className="space-y-3">
                                        {embeds.map((embed, i) => (
                                            <div key={`${embed.service}-${embed.id}-${i}`} className="relative">
                                                <VideoEmbedPlayer embed={embed} />
                                                <button
                                                    type="button"
                                                    onClick={() => removeEmbed(i)}
                                                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/70"
                                                    aria-label="Remove video"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {error && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-5 border-t border-gray-100">
                                <div className="flex gap-2">
                                    <VideoInput
                                        onAdd={(embed) => setEmbeds([...embeds, embed])}
                                        disabled={isSubmitting}
                                        compact
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="px-5 py-2 rounded-full text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !content}
                                        className="px-5 py-2 rounded-full text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSubmitting ? 'Wird gepostet...' : 'Posten'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
