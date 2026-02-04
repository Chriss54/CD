# GIF Picker Component

A reusable GIF picker component powered by the GIPHY API for selecting GIFs in posts and comments.

## Overview

The `GifPicker` component provides a modal interface for users to search and select GIFs from GIPHY's library. It displays trending GIFs by default and supports real-time search with debouncing.

## Setup

### Environment Variable

Add your GIPHY API key to `.env.local`:

```env
NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_api_key_here
```

**To get a GIPHY API key:**
1. Go to [GIPHY Developers](https://developers.giphy.com/)
2. Create an app and select "API" (not SDK)
3. Copy the API key

## Usage

```tsx
import { GifPicker } from '@/components/ui/gif-picker';

function MyComponent() {
  const [showPicker, setShowPicker] = useState(false);

  const handleGifSelect = (gifUrl: string) => {
    // gifUrl is the GIPHY CDN URL for the selected GIF
    console.log('Selected GIF:', gifUrl);
    setShowPicker(false);
  };

  return (
    <>
      <button onClick={() => setShowPicker(true)}>Add GIF</button>
      
      {showPicker && (
        <GifPicker
          onSelect={handleGifSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `onSelect` | `(gifUrl: string) => void` | Callback when a GIF is selected. Receives the GIF URL. |
| `onClose` | `() => void` | Callback when the picker should close (backdrop click or X button). |

## Features

- **Trending GIFs**: Loads 20 trending GIFs on initial open
- **Search**: Debounced search (300ms) for finding specific GIFs
- **Responsive Grid**: 2-column layout with lazy-loaded images
- **Rating Filter**: Only shows G-rated (family-friendly) content
- **Attribution**: Includes required "Powered by GIPHY" branding

## API Endpoints Used

- `GET /v1/gifs/trending` - Fetches trending GIFs
- `GET /v1/gifs/search` - Searches for GIFs by query

## Integration Points

### Post Creation (`create-post-modal.tsx`)

GIFs are stored in a `gifs` state array and included in the form data when submitting:

```tsx
formData.set('gifs', JSON.stringify(gifs));
```

### Comments (`comment-section.tsx`)

Selected GIFs are embedded in comment content using the format:

```
[GIF: https://media.giphy.com/...]
```

The `CommentContent` component parses this format and renders the GIF as an image.

## Files Modified

- `src/components/ui/gif-picker.tsx` - New component
- `src/components/feed/create-post-modal.tsx` - Added GIF button and state
- `src/components/feed/comment-section.tsx` - Integrated GifPicker, removed sample data
- `.env.local` - Added `NEXT_PUBLIC_GIPHY_API_KEY`
