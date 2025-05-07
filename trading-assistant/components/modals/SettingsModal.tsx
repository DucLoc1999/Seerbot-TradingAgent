'use client';

import { useEffect, useRef, useState } from 'react';
import { AiFillEye, AiFillEyeInvisible, AiFillInfoCircle } from 'react-icons/ai';
import { toast } from 'sonner';
import { useAccount, useDisconnect } from 'wagmi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [input, setInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const inputRef = useRef<HTMLInputElement>(null);

  // Get private key if exist
  useEffect(() => {
    const fetchPk = async () => {
      const res = await fetch('api/settings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.status !== 200) return;
      const { pk } = await res.json();
      setInput(pk.value);
    };
    if (isConnected) fetchPk();
  }, [isOpen, isConnected]);

  // Close with ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPassword(false);
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    const inputElement = inputRef.current;

    if (!inputElement) return;

    const handleWheel = (e: WheelEvent) => {
      // Check for horizontal overflow
      if (inputElement.scrollWidth > inputElement.clientWidth) {
        // Only prevent default if scrolling horizontally is needed
        if (e.deltaY !== 0) {
          e.preventDefault();
          // Adjust scrollLeft based on vertical wheel movement
          inputElement.scrollLeft += e.deltaY;
        }
      }
    };

    inputElement.addEventListener('wheel', handleWheel, { passive: false }); // Use passive: false to allow preventDefault

    return () => {
      inputElement.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  const handleSave = async () => {
    try {
      const res = await fetch('api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, address }),
      });
      if (res.status === 401) {
        disconnect();
        setShowPassword(false);
        onClose();
      }
      if (res.status === 400) {
        const text = await res.text();
        toast.error(text);
      }
    } catch (err) {
      console.log('Error occured:', err);
    }
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#1a1a1a]">
        {/* Close button */}
        <button
          onClick={() => {
            setShowPassword(false);
            onClose();
          }}
          className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600 dark:hover:text-white"
        >
          ✕
        </button>

        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>

        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <form className="flex flex-col p-2">
            <label
              className="flex flex-row text-sm font-medium text-gray-200"
              htmlFor="privateSecret"
            >
              Private secret
              <div className="group relative ml-1 flex flex-row items-center">
                <AiFillInfoCircle
                  size={16}
                  className="cursor-pointer text-gray-400 hover:text-white"
                />

                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max -translate-x-1/2 rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  Your private secret is will be encrypted and will expires after 1 hour.
                  <br />
                  Seerbot only use your private secret for swap function and do not store this in any other way.
                </div>
              </div>
            </label>
            <div className="mt-2 flex flex-row">
              {/* <div className="overflow-x-auto w-full"> */}
              <input
                ref={inputRef}
                id="privateSecret"
                type={showPassword ? 'text' : 'password'}
                className="w-full min-w-0 overflow-x-auto rounded-md bg-gray-700 text-white"
                value={input}
                spellCheck={false}
                onChange={(e) => setInput(e.target.value)}
              />
              {/* </div> */}

              <div className="group relative">
                <button
                  type="button"
                  // onMouseDown={() => setShowPassword(true)}
                  // onMouseUp={() => setShowPassword(false)}
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 flex items-center text-gray-400 hover:text-white"
                >
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max -translate-x-1/2 rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                    Click to show your private key
                  </div>
                  {showPassword ? <AiFillEye size={18} /> : <AiFillEyeInvisible size={18} />}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Save button area */}
        <div className="mt-6 flex justify-end">
          <button
            className="rounded-md bg-white px-4 py-2 text-black transition hover:bg-gray-300"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="ml-2 rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
