import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

export function AppIcon({ name, color = '#FFFFFF', size = 24 }) {
  const common = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    search: <Path {...common} d="M11 19a8 8 0 1 1 5.65-2.34L22 22" />,
    bell: <Path {...common} d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" />,
    plus: <Path {...common} d="M12 5v14M5 12h14" />,
    mic: <Path {...common} d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />,
    home: <Path {...common} d="M3 10.5 12 3l9 7.5V21H3zM9 21v-6h6v6" />,
    report: <Path {...common} d="M20 12a8 8 0 1 1-8-8v8zM13 3a8 8 0 0 1 8 8h-8z" />,
    budget: <Path {...common} d="M4 7h16M6 4h12v16H6zM9 12h6M9 16h3" />,
    user: <Path {...common} d="M20 21a8 8 0 0 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />,
    back: <Path {...common} d="m14 18-6-6 6-6M8 12h12" />,
    mail: <Path {...common} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" />,
    lock: <Path {...common} d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4" />,
    eye: <Path {...common} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />,
    eyeOff: <Path {...common} d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />,
    google: (
      <G>
        <Path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
        <Path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
        <Path fill="#FBBC05" d="M5.6 13.8c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2L1.9 6.5C.7 8.9 0 10.4 0 12s.7 3.1 1.9 5.5l3.7-2.9c0-.3 0-.5 0-.8z" />
        <Path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
      </G>
    ),
    apple: (
      <Path
        fill="#FFFFFF"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.78c.67-.82 1.13-1.96.99-3.1-.98.04-2.19.66-2.88 1.47-.62.72-1.16 1.89-1.01 3.01 1.1.09 2.23-.55 2.9-1.38z"
      />
    ),
    facebook: (
      <Path
        fill="#1877F2"
        d="M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12z"
      />
    ),
    food: <Path {...common} d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c3 2 3 7 0 9" />,
    transport: <Path {...common} d="m5 11 2-5h10l2 5M3 11h18v7H3zM7 18v3M17 18v3M7 14h.01M17 14h.01" />,
    bills: <Path {...common} d="M9 18h6M10 21h4M9 15h6M8 12a6 6 0 1 1 8 0c-1.1 1-1.7 1.9-1.7 3H9.7c0-1.1-.6-2-1.7-3" />,
    shopping: <Path {...common} d="M5 8h14v12H5zM8 8a4 4 0 0 1 8 0" />,
    health: <Path {...common} d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8" />,
    groceries: <Path {...common} d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />,
    rent: <Path {...common} d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" />,
    education: <Path {...common} d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c0 2 6 2 6 2s6 0 6-2v-5" />,
    entertainment: <Path {...common} d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    other: <Path {...common} d="M12 5v14M5 12h14M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />,
    salary: <Path {...common} d="M4 7h16v12H4zM8 7V5h8v2M8 13h8M12 11v4" />,
    bonus: <Path {...common} d="M20 12v10H4V12M2 7h20v5H2zM12 7v15M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />,
    freelance: <Path {...common} d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55A1 1 0 0 1 20.38 20H3.62a1 1 0 0 1-.9-1.45L4 16" />,
    investment: <Path {...common} d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />,
    cashback: <Path {...common} d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
    fun: <Path {...common} d="M5 10h14l2 5a4 4 0 0 1-6 4l-3-2-3 2a4 4 0 0 1-6-4zM8 14h4M10 12v4M17 13h.01M19 15h.01" />
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24">{icons[name] || icons.other}</Svg>;
}
