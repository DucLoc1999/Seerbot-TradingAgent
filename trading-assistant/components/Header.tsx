import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ConnectWallet } from './ConnectWallet';
import { SettingsDropdown } from './SettingDropdown';

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 items-center bg-[#F5F5F5] px-4">
        <div className="flex items-center gap-2 font-semibold text-[#1A64F0]">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold"
          >
            <span className="text-xl">Seerbot Swap</span>
          </Link>
        </div>

        <nav className="mx-6 hidden flex-1 items-center space-x-4 md:flex lg:space-x-6">
          <Button
            asChild
            variant="ghost"
            className="hover:bg-[#1A64F0] hover:text-white"
          >
            <Link
              href="/assistant"
              className="text-sm font-semibold text-[#1A64F0]"
            >
              AI Assistant
            </Link>
          </Button>
        </nav>
        <div className="flex items-center gap-4">
          {/* <SettingsDropdown /> */}
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
