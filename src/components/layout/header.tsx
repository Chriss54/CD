import Image from 'next/image';
import Link from 'next/link';
import { UserMenu } from '@/components/auth/user-menu';
import { SearchBar } from '@/components/search/search-bar';
import { getCommunitySettings } from '@/lib/settings-actions';

export async function Header() {
  const settings = await getCommunitySettings();

  return (
    <header className="h-16 border-b border-border bg-white">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center gap-6">
        {/* Left column - matches Categories sidebar width (w-64 = 256px) */}
        <div className="w-64 shrink-0">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {settings.communityLogo ? (
              <Image
                src={settings.communityLogo}
                alt={`${settings.communityName} logo`}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                {settings.communityName?.slice(0, 2).toUpperCase() || 'GS'}
              </div>
            )}
            <span className="text-lg font-semibold text-gray-900">{settings.communityName}</span>
          </Link>
        </div>

        {/* Center column - matches posts area, search is centered here */}
        <div className="flex-1 min-w-0 flex justify-center">
          <SearchBar />
        </div>

        {/* Right column - matches right sidebar width (w-72 = 288px) */}
        <div className="w-72 shrink-0 flex items-center justify-end gap-3">
          {/* Plus button */}
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          {/* User menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
