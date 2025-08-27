import React from 'react';
import { FileOutput } from 'lucide-react';

export function Footer({ 
  isDraft, 
  setIsDraft, 
  onCreateClick, 
  disabled, 
  processing 
}) {
  return (
    <div className="py-4 px-4 bg-white">
      <div className="flex items-center justify-between gap-4">
        {/* Draft Checkbox - Left side (RTL) */}
        <label className="flex items-center gap-2 text-sm text-[#323130]">
          <span className="order-2">סמן כטיוטה</span>
          <input
            type="checkbox"
            checked={isDraft}
            onChange={(e) => setIsDraft(e.target.checked)}
            className="order-1 rounded border-gray-300 text-[#0078d4] focus:ring-[#0078d4]"
          />
        </label>

        {/* Generate Document Button - Right side (RTL) */}
        <button
          className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-[#0078d4] text-white rounded-md hover:bg-[#106ebe] transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled || processing}
          onClick={onCreateClick}
        >
          <FileOutput className="w-4 h-4" />
          הפק מסמך
        </button>
      </div>
    </div>
  );
}