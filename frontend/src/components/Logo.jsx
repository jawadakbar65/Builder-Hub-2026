import React, { useId } from 'react';

// BuilderHub mark: layered "building blocks" inside a rounded gradient tile.
// Scales from favicon (16px) up to hero size, works on dark and light themes.
export function LogoMark({ size = 34, className = 'logo-mark' }) {
  const id = useId().replace(/[:]/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`bh-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="16" fill={`url(#bh-${id})`} />
      <path d="M32 13 51 23.5 32 34 13 23.5Z" fill="#ffffff" />
      <path d="M13 31.5 32 42 51 31.5" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
      <path d="M13 39.5 32 50 51 39.5" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".5" />
    </svg>
  );
}

export default function Logo({ size = 34, large = false, showText = true, className = '' }) {
  return (
    <span className={`logo ${large ? 'logo-lg' : ''} ${className}`.trim()}>
      <LogoMark size={large ? 52 : size} />
      {showText && <span className="logo-text"><b>Builder</b><i>Hub</i></span>}
    </span>
  );
}
