import React from 'react';

export function Footer({ 
  isDraft, 
  setIsDraft, 
  onCreateClick, 
  disabled, 
  processing 
}) {
  return (
    <div className="p-2 bg-white space-y-2">
      <label className="flex items-center gap-2 text-sm text-[#323130] px-1">
        <span className="order-2">סמן כטיוטה</span>
        <input
          type="checkbox"
          checked={isDraft}
          onChange={(e) => setIsDraft(e.target.checked)}
          className="order-1 rounded border-gray-300 text-[#0078d4] focus:ring-[#0078d4]"
        />
      </label>
      <button
        className="w-full px-4 py-1.5 bg-[#0078d4] text-white rounded-md hover:bg-[#106ebe] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled || processing}
        onClick={onCreateClick}
      >
        {processing ? 'מעבד...' : 'צור'}
      </button>
    </div>
  );
}