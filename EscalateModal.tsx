import React, { useState } from 'react';
import { WardMetric } from '../types';

interface EscalateModalProps {
  zone: WardMetric;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EscalateModal: React.FC<EscalateModalProps> = ({
  zone,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'confirm' | 'dispatching' | 'completed'>('confirm');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['SMS', 'WhatsApp', 'IVR']);
  const [actionNotes, setActionNotes] = useState(
    `Immediate Heat Action Protocol Level 3: Halt outdoor labor 11:00-16:00. Open Ward 12 Community Hall cooling center. Dispatch 2 hydration tankers.`
  );

  if (!isOpen) return null;

  const handleEscalate = async () => {
    setIsSubmitting(true);
    setStep('dispatching');

    try {
      const response = await fetch('/api/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: zone.id,
          actionNotes,
          channels: selectedChannels
        })
      });

      if (response.ok) {
        setTimeout(() => {
          setStep('completed');
          setIsSubmitting(false);
          onSuccess();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setStep('confirm');
    }
  };

  const toggleChannel = (ch: string) => {
    if (selectedChannels.includes(ch)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter(c => c !== ch));
      }
    } else {
      setSelectedChannels([...selectedChannels, ch]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#131b2e] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-red-400 text-2xl" data-icon="warning">
              warning
            </span>
            <div>
              <h3 className="font-bold text-base tracking-tight uppercase">Emergency Escalation Dispatch</h3>
              <p className="text-xs text-gray-400">{zone.name} &bull; WBGT: {zone.wbgt}°C</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {step === 'confirm' && (
            <>
              <div className="bg-red-50 border-l-4 border-red-600 p-3.5 rounded-r-lg">
                <span className="text-xs font-bold uppercase text-red-800 tracking-wider block mb-1">
                  High Risk Trigger Activated
                </span>
                <p className="text-xs text-red-950 leading-relaxed font-medium">
                  Mortality Surge projection is <strong className="text-red-700 font-black">+{zone.mortalityRiskIncreasePercent}%</strong>. 
                  Escalating this protocol will broadcast emergency alerts to <strong>42,800 registered outdoor workers</strong> and open municipal cooling centers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Broadcast Alert Channels
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['SMS', 'WhatsApp', 'IVR Sirens'].map((ch) => {
                    const isSelected = selectedChannels.some(c => ch.startsWith(c));
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChannel(ch.split(' ')[0])}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Action Directives & Advisory Notes
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 font-sans"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-[11px] text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Target Zone:</span>
                  <span className="font-bold text-gray-800">{zone.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Laborers & Vendors:</span>
                  <span className="font-bold text-gray-800">42,800</span>
                </div>
                <div className="flex justify-between">
                  <span>Cooling Centers Auto-Trigger:</span>
                  <span className="font-bold text-green-700">Ward 12 Community Hall + 3 Hubs</span>
                </div>
              </div>
            </>
          )}

          {step === 'dispatching' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Broadcasting Emergency Advisories</h4>
                <p className="text-xs text-gray-500 mt-1">Connecting to Telecom Gateways (SMS/WhatsApp)...</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 max-w-xs overflow-hidden">
                <div className="bg-red-600 h-2 rounded-full animate-pulse" style={{ width: '85%' }}></div>
              </div>
            </div>
          )}

          {step === 'completed' && (
            <div className="py-4 text-center space-y-3">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Escalation Protocol Active</h4>
                <p className="text-xs text-gray-600 mt-1">
                  42,800 SMS/WhatsApp messages delivered. Municipal Cooling Centers opened. Hospital triage placed on Code Red.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 p-2.5 rounded-lg text-left text-xs text-green-900 font-mono">
                &bull; Broadcast ID: #DISP-99281<br />
                &bull; Status: 100% Dispatched<br />
                &bull; Cooling Centers: 4 Active
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex justify-end gap-2">
          {step === 'confirm' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEscalate}
                disabled={isSubmitting}
                className="bg-[#da3437] hover:bg-red-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">bolt</span>
                Confirm &amp; Broadcast Alert
              </button>
            </>
          )}
          {step === 'completed' && (
            <button
              type="button"
              onClick={onClose}
              className="bg-[#131b2e] text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-black transition-all w-full"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
