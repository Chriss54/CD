'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { uploadCourseImage } from '@/lib/course-actions';

interface CourseImageUploadProps {
    courseId: string;
    currentImageUrl?: string | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function CourseImageUpload({ courseId, currentImageUrl }: CourseImageUploadProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        // Client-side validation
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Please upload an image (JPEG, PNG, GIF, or WebP)');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError('Image must be less than 5MB');
            return;
        }

        // Show preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const result = await uploadCourseImage(courseId, formData);

            if ('error' in result) {
                const errorMsg = typeof result.error === 'string'
                    ? result.error
                    : 'Upload failed';
                setError(errorMsg);
                // Revert preview on error
                setPreviewUrl(currentImageUrl || null);
            } else {
                // Update preview with actual URL
                if (result.url) {
                    setPreviewUrl(result.url);
                }
                router.refresh();
            }
        } catch {
            setError('An unexpected error occurred');
            setPreviewUrl(currentImageUrl || null);
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium mb-1">
                Cover Image
            </label>

            <div className="flex items-start gap-4">
                {/* Image Preview */}
                <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt="Course cover"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </div>
                    )}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Upload Button */}
                <div className="flex flex-col gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id={`course-image-upload-${courseId}`}
                        disabled={isUploading}
                    />

                    <label
                        htmlFor={`course-image-upload-${courseId}`}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border cursor-pointer transition-colors ${isUploading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        {isUploading ? 'Uploading...' : previewUrl ? 'Change Image' : 'Upload Image'}
                    </label>

                    <p className="text-xs text-gray-500">
                        JPEG, PNG, GIF, or WebP. Max 5MB.
                    </p>
                </div>
            </div>

            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}
        </div>
    );
}
