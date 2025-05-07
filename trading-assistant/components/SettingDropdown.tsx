'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { SettingsModal } from './modals/SettingsModal';

type DropdownItem = {
  label: string;
  onClick: (setShowFunction: React.Dispatch<React.SetStateAction<boolean>>) => void;
};

const dropdownItems: DropdownItem[] = [
  { label: 'Settings', onClick: (setShowSettings: React.Dispatch<React.SetStateAction<boolean>>) => setShowSettings(true) },
];

export const SettingsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();
  const { signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const autoSignOut = async () => {
      if (!isConnected) await signOut(false);
    };
    autoSignOut();
  }, []);

  if (!isConnected) {
    return null;
  }

  return (
    <div
      className="relative inline-block text-left"
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-[#1a1a1a] ${isOpen ? 'rounded-t-xl' : 'rounded-xl'} px-3 py-2 transition`}
      >
        <FiSettings className="text-xl" />
        <span className="font-medium">Settings</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-48 rounded-l-xl rounded-br-xl border bg-[#1a1a1a] shadow-xl">
          {dropdownItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick(setShowSettingsModal);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};
