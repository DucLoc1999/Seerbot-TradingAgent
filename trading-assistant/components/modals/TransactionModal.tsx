import React from 'react';
import Image from 'next/image';

interface TransactionModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const TransactionModal = ({ isOpen, onClose }: TransactionModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <button
        onClick={() => {
          if (onClose) onClose();
        }}
        className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600 dark:hover:text-white"
      >
        ✕
      </button>
      <div className="relative aspect-square h-2/5">
        {/* Spinning circle */}
        <div className="absolute inset-0 animate-spin rounded-full border-[50px] border-white border-t-transparent" />
        {/* Logo in the center */}
        <Image
          src="/lace.png"
          alt="Wallet Logo"
          className="absolute inset-1 mx-auto my-auto aspect-square h-[200px] object-contain"
          width={200}
          height={200}
        />
      </div>
    </div>
  );
};

export default TransactionModal;
