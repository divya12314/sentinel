import React, { useState } from 'react';
import { EmergencyAlert, CitizenProfile, WardMetric } from '../../types';

interface CitizenAlertsFeedProps {
  alerts: EmergencyAlert[];
  profile: CitizenProfile;
  zone: WardMetric;
  onNavigateBack: () => void;
  onToggleFcm: () => void;
}

export const CitizenAlertsFeed: React.FC<CitizenAlertsFeedProps> = ({
  alerts,
  profile,
  zone,
  onNavigateBack,
  onToggleFcm
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'red' | 'fcm'>('all');
  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<string, boolean>>({});

  const filtered = alerts.filter((a) => {
    if (activeTab === 'red') return a.level === 'RED';
    if (activeTab === 'fcm') return a.channels.includes('FCM_Push');
    return true;
  });

  const handleAcknowledge = (id: string) => {
    setAcknowledgedMap((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 transition-all"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">campaign</span>
              Real-Time Emergency Alerts & Regional FCM Push Feed
            </h1>
            <p className="text-xs text-gray-500">
              Direct municipal broadcast channel for heatwave warnings and labor stop-work orders
            </p>
          </div>
        </div>

        {/* FCM Push Notification Toggle Button */}
        <button
          id="btn-toggle-fcm-push"
          onClick={onToggleFcm}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs ${
            profile.fcmPushEnabled
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {profile.fcmPushEnabled ? 'notifications_active' : 'notifications_off'}
          </span>
          {profile.fcmPushEnabled ? 'FCM Push Alerts Active' : 'Enable FCM Push Alerts'}
        </button>
      </div>

      {/* FCM & SMS Status Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-700 text-2xl mt-0.5">crisis_alert</span>
        <div className="text-xs text-gray-800 space-y-1">
          <span className="font-bold text-amber-950 block text-sm">
            Municipal Real-Time Broadcast Integration
          </span>
          <p className="leading-relaxed">
            When city administration or automated thermal algorithms trigger a Heat Action Plan alert, it is automatically pushed to your device via Firebase Cloud Messaging (FCM), WhatsApp, and regional SMS gateways.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'all', label: `All Advisories (${alerts.length})` },
          { id: 'red', label: `Code Red (${alerts.filter((a) => a.level === 'RED').length})` },
          { id: 'fcm', label: 'FCM Automated Triggers' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'all' | 'red' | 'fcm')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#131b2e] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Stream */}
      <div className="space-y-4">
        {filtered.map((alert) => {
          const isAck = acknowledgedMap[alert.id];
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                alert.level === 'RED'
                  ? 'border-red-300 ring-1 ring-red-500/20'
                  : 'border-amber-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                      alert.level === 'RED' ? 'bg-red-700' : 'bg-amber-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {alert.level === 'RED' ? 'warning' : 'info'}
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          alert.level === 'RED'
                            ? 'bg-red-100 text-red-900 border border-red-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {alert.level} HEATWAVE ADVISORY
                      </span>
                      <span className="text-xs font-semibold text-gray-500">{alert.zone}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{alert.title}</h3>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-gray-500 flex sm:flex-col items-center sm:items-end gap-1">
                  <span>{alert.issuedAt || 'Just now'}</span>
                  <span className="text-blue-600 font-semibold">
                    {alert.recipientsCount?.toLocaleString()} Recipients
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 p-3.5 rounded-xl border border-gray-100 mb-3">
                {alert.message}
              </p>

              {/* Channels & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="font-semibold text-gray-700">Broadcast via:</span>
                  {alert.channels.map((ch, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px] font-bold border border-gray-200"
                    >
                      {ch}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {isAck ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Safety Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-4 py-1.5 bg-[#131b2e] hover:bg-[#1f2b48] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">thumb_up</span>
                      Acknowledge & Mark Safe
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
