import React, { useState } from 'react';
import { CitizenProfile, EmergencyAlert, WardMetric } from '../../types';

interface CitizenTopBarProps {
  profile: CitizenProfile;
  zone: WardMetric;
  alerts: EmergencyAlert[];
  onOpenAlerts: () => void;
  onSwitchPortal: () => void;
  onOpenProfile: () => void;
}

export const CitizenTopBar: React.FC<CitizenTopBarProps> = ({
  profile,
  zone,
  alerts,
  onOpenAlerts,
  onSwitchPortal,
  onOpenProfile
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-[#0f172a] border-b border-slate-700/50 text-white shadow-md select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <span className="material-symbols-outlined text-2xl">health_and_safety</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[16px] sm:text-[18px] font-extrabold tracking-tight text-white font-mono uppercase">
              SENTINEL WORKER PORTAL
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ACTIVE
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Worker Heat Safety & Hydration Command • {zone.name}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 relative">
        {/* Live Zone Telemetry Pill */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
          <span className="text-slate-400">WBGT:</span>
          <span className="font-mono font-bold text-red-400">{zone.wbgt}°C</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Temp:</span>
          <span className="font-mono font-bold text-slate-200">{zone.temp}°C</span>
        </div>

        {/* Notifications Icon */}
        <button
          id="btn-citizen-notifications"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-slate-200"
          title="Emergency Advisories"
        >
          <span className="material-symbols-outlined text-2xl">notifications</span>
          {alerts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-900 animate-ping" />
          )}
          {alerts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-900" />
          )}
        </button>

        {/* Profile Pill */}
        <button
          onClick={onOpenProfile}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
        >
          <span className="material-symbols-outlined text-sm text-blue-400">person</span>
          <span className="max-w-[120px] truncate">{profile.email.split('@')[0]}</span>
        </button>

        {/* Switch Portal Button */}
        <button
          id="btn-switch-to-admin"
          onClick={onSwitchPortal}
          className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          title="Switch to Municipal Corporation Admin Command"
        >
          <span className="material-symbols-outlined text-sm">shield_person</span>
          <span className="hidden sm:inline">Admin Portal</span>
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-red-600 text-base">campaign</span>
                Live Regional Advisories
              </span>
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {alerts.length} Active
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-3 hover:bg-gray-50 transition-colors text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-red-700 uppercase tracking-wide text-[10px]">
                      {alert.level} ALERT • {alert.zone}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{alert.issuedAt || 'Just now'}</span>
                  </div>
                  <p className="text-gray-800 line-clamp-2 leading-relaxed font-medium">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  setShowNotifications(false);
                  onOpenAlerts();
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline w-full py-1"
              >
                Open Full Emergency Alerts Feed &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
