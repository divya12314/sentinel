import React, { useEffect, useState } from 'react';
import { EmergencyAlert } from '../types';

interface FcmNotificationBannerProps {
  alert: EmergencyAlert | null;
  onDismiss: () => void;
  onViewAlert: (alert: EmergencyAlert) => void;
}

export const FcmNotificationBanner: React.FC<FcmNotificationBannerProps> = ({
  alert,
  onDismiss,
  onViewAlert
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setVisible(true);
      // Auto play Web Audio gentle ping
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch {
        // AudioContext restricted before user interaction
      }
    } else {
      setVisible(false);
    }
  }, [alert]);

  if (!alert || !visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-[#131b2e] text-white p-4 rounded-2xl shadow-2xl border border-red-500/50 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400">
              <span className="material-symbols-outlined text-lg animate-ping">crisis_alert</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-600 text-white tracking-wider">
                  FCM LIVE PUSH
                </span>
                <span className="text-xs font-semibold text-gray-300">{alert.zone}</span>
              </div>
              <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-1">{alert.title}</h4>
            </div>
          </div>

          <button
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 bg-white/5 p-2.5 rounded-xl border border-white/5 font-medium">
          {alert.message}
        </p>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
          <span className="text-[10px] text-gray-400 font-mono">
            {alert.recipientsCount?.toLocaleString()} notified via FCM / SMS
          </span>
          <button
            onClick={() => {
              setVisible(false);
              onViewAlert(alert);
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
          >
            View Advisory &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
