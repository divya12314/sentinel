import React, { useState } from 'react';
import { HeatActionChecklistItem, EmergencyAlert, WardMetric } from '../../types';

interface AutomatedTriggersChecklistProps {
  checklist: HeatActionChecklistItem[];
  onToggleItem: (id: string, completed: boolean) => void;
  onDispatchFcmBroadcast: (title: string, message: string, targetWard: string, level: 'YELLOW' | 'ORANGE' | 'RED') => void;
  allZones: WardMetric[];
}

export const AutomatedTriggersChecklist: React.FC<AutomatedTriggersChecklistProps> = ({
  checklist,
  onToggleItem,
  onDispatchFcmBroadcast,
  allZones
}) => {
  const [selectedWard, setSelectedWard] = useState<string>(allZones[0]?.name || 'Ward 12 - West Zone');
  const [broadcastTitle, setBroadcastTitle] = useState<string>('RED ALERT: Mandatory Work Halt 11am-4pm');
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    'WBGT has exceeded 34.0°C. All outdoor construction and street vending must cease immediately. Proceed to nearest air-cooled community shelter with free drinking water.'
  );
  const [broadcastLevel, setBroadcastLevel] = useState<'YELLOW' | 'ORANGE' | 'RED'>('RED');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string>('');

  const completedCount = checklist.filter((i) => i.completed).length;

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    setTimeout(() => {
      onDispatchFcmBroadcast(broadcastTitle, broadcastMessage, selectedWard, broadcastLevel);
      setIsBroadcasting(false);
      setBroadcastSuccess(`FCM automated push & SMS broadcast successfully dispatched to 52,400 registered recipients in ${selectedWard}!`);
      setTimeout(() => setBroadcastSuccess(''), 6000);
    }, 600);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Critical':
        return 'bg-red-100 text-red-900 border-red-300 font-bold';
      case 'High':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-300 font-semibold';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-700">checklist_rtl</span>
            Automated Triggers & Heat Action Plan (HAP) Checklist
          </h1>
          <p className="text-xs text-gray-500">
            Algorithmic threshold triggers for Firebase Cloud Messaging (FCM), WhatsApp, and inter-agency municipal execution
          </p>
        </div>

        <div className="text-xs font-bold text-gray-700 bg-gray-100 border border-gray-300 px-3.5 py-1.5 rounded-xl font-mono">
          Protocol Completion: <strong className="text-red-700">{completedCount}/{checklist.length} Actions Active</strong>
        </div>
      </div>

      {broadcastSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-lg text-emerald-700">notifications_active</span>
          {broadcastSuccess}
        </div>
      )}

      {/* Grid: Left Checklist / Right FCM Dispatch Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* HAP Interactive Checklist (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-700">task_alt</span>
              Municipal Heat Action Plan Protocols
            </h2>
            <span className="text-[11px] text-gray-500">Auto-triggered by WBGT algorithms</span>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                  item.completed
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-gray-50/70 border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => onToggleItem(item.id, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded text-red-700 focus:ring-red-500 border-gray-300 cursor-pointer"
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-xs font-bold ${item.completed ? 'text-emerald-950' : 'text-gray-900'}`}>
                      {item.title}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-600 leading-relaxed mb-2">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="material-symbols-outlined text-xs text-purple-700">smart_toy</span>
                    <span className="font-mono text-purple-900 font-semibold">{item.autoTriggeredBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Firebase Cloud Messaging & WhatsApp Push Dispatcher (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="material-symbols-outlined text-red-600 text-xl">send_to_mobile</span>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Regional FCM Push & SMS Dispatcher</h2>
                <span className="text-[11px] text-gray-500">Pushes automated alert to Citizen portal & mobile phones</span>
              </div>
            </div>

            {/* Target Ward */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Target Zone / Ward
              </label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                {allZones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name} ({z.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Advisory Severity Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'YELLOW', label: 'Yellow', color: 'bg-yellow-400 text-gray-900' },
                  { id: 'ORANGE', label: 'Orange', color: 'bg-orange-500 text-white' },
                  { id: 'RED', label: 'Red (Critical)', color: 'bg-red-700 text-white font-extrabold' }
                ].map((lvl) => (
                  <button
                    type="button"
                    key={lvl.id}
                    onClick={() => setBroadcastLevel(lvl.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      broadcastLevel === lvl.id
                        ? `${lvl.color} shadow-xs border-transparent`
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Alert Title
              </label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            {/* Broadcast Message */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Broadcast Advisory Body
              </label>
              <textarea
                rows={4}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Push Channels */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
              <span className="font-bold text-gray-800 block mb-1">Automated Delivery Gateways:</span>
              <div className="flex flex-wrap gap-1.5">
                {['FCM Web Push', 'WhatsApp Business API', 'NIC SMS Gateway', 'IVR Voice Call'].map((ch, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white text-gray-700 font-mono text-[10px] font-bold rounded border border-gray-300"
                  >
                    ✓ {ch}
                  </span>
                ))}
              </div>
            </div>

            <button
              id="btn-trigger-fcm-broadcast"
              type="submit"
              disabled={isBroadcasting}
              className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">crisis_alert</span>
              {isBroadcasting ? 'Broadcasting via FCM & SMS...' : 'Dispatch Automated Broadcast Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
