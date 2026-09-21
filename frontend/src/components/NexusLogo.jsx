import React from 'react';

const NexusLogo = ({ size = 32, gradientId = 'neon-grad-default', showText = true, textClassName = '' }) => {
  const gradId = `nexus-${gradientId}`;
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="30,3 54,16 54,44 30,57 6,44 6,16"
          fill="#0f0f12"
          stroke={`url(#${gradId})`}
          strokeWidth="4"
        />
        <path
          d="M18 42V18L42 42V18"
          stroke={`url(#${gradId})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="30" cy="30" r="3" fill="#2bf2fb" />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b535f6" />
            <stop offset="100%" stopColor="#2bf2fb" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`text-base font-black tracking-wide text-white ${textClassName}`}>
          NEXUS{' '}
          <span className="bg-gradient-to-r from-[#b535f6] to-[#2bf2fb] bg-clip-text text-transparent">
            TECH
          </span>
        </span>
      )}
    </div>
  );
};

export default NexusLogo;
