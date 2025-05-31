import React from 'react';

export function Header({ title }) {
  return (
    <div className="h-10 flex items-center px-3 border-b border-[#e1dfdd] bg-white">
      <h2 className="text-base font-semibold text-[#323130] truncate">
        {title}
      </h2>
    </div>
  );
}