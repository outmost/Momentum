'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-4xl mb-4">⚠️</p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
      <button onClick={reset} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
        Try again
      </button>
    </div>
  );
}
