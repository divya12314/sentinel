import React from 'react';
import { NavigationScreen } from '../types';

interface BottomNavBarProps {
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  hasUnreadAlerts?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentScreen,
  onNavigate,
  hasUnreadAlerts = true
}) => {
  const navItems: { id: NavigationScreen; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'GIS Heat Map', icon: 'grid_view' },
    { id: 'matrix', label: 'Ward Matrix', icon: 'table_chart' },
    { id: 'historical', label: 'Historical Impact', icon: 'query_stats' },
    { id: 'forecast', label: 'Mortality Forecast', icon: 'show_chart' },
    { id: 'alerts', label: 'Triggers & Alerts', icon: 'campaign' },
    { id: 'resources', label: 'City Resources', icon: 'local_hospital' }
  ];

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-1 sm:px-2 py-2 pb-safe bg-[#ffffff] border-t border-[#c6c6cd] shadow-lg md:hidden overflow-x-auto"
    >
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center rounded-xl px-2.5 py-1 transition-all relative shrink-0 ${
              isActive
                ? 'bg-[#da3437] text-white scale-95 shadow-sm font-bold'
                : 'text-[#45464d] hover:bg-gray-100 font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {item.icon}
            </span>
            {item.id === 'alerts' && hasUnreadAlerts && !isActive && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-[#b61722] rounded-full border border-white" />
            )}
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

