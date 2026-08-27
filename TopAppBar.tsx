import React, { useState } from 'react';
import { EmergencyAlert, AdminProfile } from '../types';

interface TopAppBarProps {
  alerts: EmergencyAlert[];
  adminProfile?: AdminProfile | null;
  onOpenAlerts: () => void;
  onSelectAlert?: (alert: EmergencyAlert) => void;
  onSwitchPortal?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  alerts,
  adminProfile,
  onOpenAlerts,
  onSwitchPortal
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-[#131b2e] border-b border-[#3f465c]/40 text-white shadow-md select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
          <span className="material-symbols-outlined text-2xl text-[#bec6e0]" data-icon="security">security</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[16px] md:text-[19px] font-extrabold tracking-tight text-[#bec6e0] uppercase font-mono">
              SENTINEL RESPONSE
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
              ADMIN COMMAND
            </span>
          </div>
          <span className="text-[11px] text-[#7c839b] font-medium hidden sm:inline">
            {adminProfile?.departmentRole || 'National Heatwave & Mortality Impact Monitoring'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 relative">
        {/* Switch Portal Button */}
        {onSwitchPortal && (
          <button
            id="btn-switch-to-citizen"
            onClick={onSwitchPortal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            title="Switch to Citizen / Worker Health Portal"
          >
            <span className="material-symbols-outlined text-sm">engineering</span>
            <span className="hidden sm:inline">Citizen Portal</span>
          </button>
        )}

        <button
          id="btn-notifications"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-[#bec6e0]"
          title="Emergency Notifications"
        >
          <span className="material-symbols-outlined text-2xl" data-icon="notifications">notifications</span>
          {alerts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#131b2e] animate-ping" />
          )}
          {alerts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#131b2e]" />
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-[#ffffff] text-[#0b1c30] rounded-xl shadow-2xl border border-[#c6c6cd] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <span className="font-bold text-sm text-[#0b1c30] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-red-600 text-lg">crisis_alert</span>
                Active Broadcast Advisories
              </span>
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {alerts.length} Total
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      {alert.level} ALERT
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{alert.issuedAt || 'Just now'}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-relaxed">
                    {alert.message}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500">
                    <span>{alert.zone}</span>
                    <span className="text-blue-600 font-semibold">{alert.recipientsCount.toLocaleString()} workers notified</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  setShowNotifications(false);
                  onOpenAlerts();
                }}
                className="text-xs font-bold text-red-700 hover:text-red-800 hover:underline w-full py-1"
              >
                Go to Emergency Alerts Hub &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

