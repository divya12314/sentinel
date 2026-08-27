import React from 'react';
import { NavigationScreen } from '../../types';

interface CitizenNavBarProps {
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  hasUnreadAlerts?: boolean;
}

export const CitizenNavBar: React.FC<CitizenNavBarProps> = ({
  currentScreen,
  onNavigate,
  hasUnreadAlerts = false
}) => {
  const navItems: { id: NavigationScreen; label: string; icon: string }[] = [
    { id: 'citizen_home', label: 'Health Home', icon: 'health_and_safety' },
    { id: 'citizen_hydration', label: 'Hydration', icon: 'water_drop' },
    { id: 'citizen_map', label: 'Cooling Hubs', icon: 'emergency_home' },
    { id: 'citizen_alerts', label: 'Alerts Feed', icon: 'campaign' }
  ];

  return (
    <nav
      id="citizen-bottom-nav"
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2.5 pb-safe bg-white border-t border-gray-200 shadow-lg"
    >
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center rounded-2xl px-3 sm:px-5 py-1.5 transition-all relative ${
              isActive
                ? 'bg-blue-600 text-white shadow-md scale-95 font-bold'
                : 'text-gray-600 hover:bg-gray-100 font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {item.icon}
            </span>
            {item.id === 'citizen_alerts' && hasUnreadAlerts && !isActive && (
              <span className="absolute top-1.5 right-4 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white" />
            )}
            <span className="text-[11px] tracking-tight mt-0.5">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
