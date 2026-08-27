import React, { useState, useEffect } from 'react';
import { WardMetric, ActiveTrigger, RecipientSegment, EmergencyAlert } from '../types';

interface AlertManagementProps {
  selectedZone: WardMetric;
  onAlertBroadcasted: () => void;
}

export const AlertManagement: React.FC<AlertManagementProps> = ({
  selectedZone,
  onAlertBroadcasted
}) => {
  const [broadcastMessage, setBroadcastMessage] = useState(
    `URGENT: Extreme Heat in ${selectedZone.zone}. Avoid outdoor work 11am-4pm. Nearest cooling center: Ward 12 Community Hall.`
  );
  const [triggers, setTriggers] = useState<ActiveTrigger[]>([]);
  const [segments, setSegments] = useState<RecipientSegment[]>([]);
  const [hospitalSpikeActive, setHospitalSpikeActive] = useState(true);
  const [gridOverloadActive, setGridOverloadActive] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [issueStatusMsg, setIssueStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetch('/api/alerts');
        if (res.ok) {
          const data = await res.json();
          setTriggers(data.activeTriggers);
          setSegments(data.recipientSegments);
          if (data.advisoryToggles) {
            setHospitalSpikeActive(data.advisoryToggles.hospitalSpikeAlert);
            setGridOverloadActive(data.advisoryToggles.gridOverloadWarning);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAlerts();
  }, []);

  const handleIssueAlert = async () => {
    setIsIssuing(true);
    try {
      const res = await fetch('/api/alerts/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone: selectedZone.name,
          message: broadcastMessage,
          channels: ['SMS', 'WhatsApp'],
          recipientsCount: 42800
        })
      });
      if (res.ok) {
        setIssueStatusMsg('Alert broadcasted successfully via SMS / WhatsApp gateway to 42,800 recipients!');
        onAlertBroadcasted();
        setTimeout(() => setIssueStatusMsg(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsIssuing(false);
    }
  };

  const handleGenerateAIAdvisory = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneName: selectedZone.name,
          wbgt: selectedZone.wbgt,
          temp: selectedZone.temp,
          humidity: selectedZone.humidity,
          mortalityIncrease: selectedZone.mortalityRiskIncreasePercent,
          vulnerableGroups: ['Outdoor workers', 'Elderly 65+', 'Slum residents']
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.smsDraft) {
          setBroadcastMessage(data.smsDraft);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleToggleAdvisory = async (type: 'hospitalSpike' | 'gridOverload') => {
    if (type === 'hospitalSpike') {
      const next = !hospitalSpikeActive;
      setHospitalSpikeActive(next);
      await fetch('/api/alerts/advisories/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'hospitalSpike', value: next })
      });
    } else {
      const next = !gridOverloadActive;
      setGridOverloadActive(next);
      await fetch('/api/alerts/advisories/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'gridOverload', value: next })
      });
    }
  };

  return (
    <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-[24px] md:text-[32px] font-black text-[#0b1c30] tracking-tight leading-tight">
          Emergency Alerts
        </h2>
        <p className="text-[14px] text-[#45464d] mt-0.5 font-medium">
          Automated advisory management.
        </p>
      </div>

      {issueStatusMsg && (
        <div className="bg-green-50 border border-green-300 text-green-900 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            {issueStatusMsg}
          </span>
          <button onClick={() => setIssueStatusMsg(null)} className="text-green-700 hover:text-green-900 font-bold">&times;</button>
        </div>
      )}

      {/* Broadcast Preview Card */}
      <section className="bg-white border border-[#c6c6cd] rounded-xl p-4 sm:p-5 shadow-xs border-l-4 border-l-[#da3437]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-[#da3437] text-2xl" data-icon="campaign">
              campaign
            </span>
            <h3 className="text-[18px] sm:text-[20px] font-bold text-[#0b1c30]">
              Broadcast Preview
            </h3>
          </div>
          <button
            onClick={handleGenerateAIAdvisory}
            disabled={isGeneratingAI}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded flex items-center gap-1 active:scale-95 transition-all"
          >
            <span className={`material-symbols-outlined text-sm ${isGeneratingAI ? 'animate-spin' : ''}`}>
              auto_awesome
            </span>
            {isGeneratingAI ? 'Refining with AI...' : 'AI Auto-Draft'}
          </button>
        </div>

        <div className="bg-[#eff4ff] rounded-lg p-4 border border-[#bec6e0]/50">
          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            rows={2}
            className="w-full bg-transparent border-none p-0 text-[15px] sm:text-[16px] text-[#0b1c30] font-medium leading-relaxed focus:ring-0 resize-none"
          />

          <div className="mt-3 flex justify-between items-center pt-2 border-t border-gray-200/60">
            <span className="text-[12px] font-bold text-[#45464d] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-green-600">chat</span>
              SMS / WhatsApp
            </span>
            <button
              id="btn-issue-alert"
              onClick={handleIssueAlert}
              disabled={isIssuing}
              className="bg-[#da3437] hover:bg-red-700 text-white px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all flex items-center space-x-1 shadow-xs active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>{isIssuing ? 'Issuing...' : 'ISSUE ALERT'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Active Triggers */}
      <section className="space-y-3">
        <h3 className="text-[18px] sm:text-[20px] font-bold text-[#0b1c30]">
          Active Triggers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Trigger 1: West Zone Heatwave */}
          <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 shadow-xs flex items-start space-x-4">
            <div className="bg-[#ffdad7] text-[#410004] rounded-full p-2.5 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl" data-icon="thermostat">
                thermostat
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[16px] font-bold text-[#0b1c30] truncate">West Zone Heatwave</h4>
              <p className="text-[13px] text-[#45464d]">Trigger: Temp &gt; 40°C</p>
              <div className="mt-2 flex space-x-2">
                <span className="bg-[#d3e4fe] text-[#0b1c30] px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                  Construction
                </span>
                <span className="bg-[#d3e4fe] text-[#0b1c30] px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                  Schools
                </span>
              </div>
            </div>
            <span className="text-[12px] font-black text-[#da3437] uppercase tracking-wider">
              11:00 AM
            </span>
          </div>

          {/* Trigger 2: North Ward Water Advisory */}
          <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 shadow-xs flex items-start space-x-4">
            <div className="bg-[#d3e4fe] text-[#0b1c30] rounded-full p-2.5 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl" data-icon="water_drop">
                water_drop
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[16px] font-bold text-[#0b1c30] truncate">North Ward Water Advisory</h4>
              <p className="text-[13px] text-[#45464d]">Trigger: Reservoir &lt; 20%</p>
              <div className="mt-2 flex space-x-2">
                <span className="bg-[#d3e4fe] text-[#0b1c30] px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                  Residents
                </span>
              </div>
            </div>
            <span className="text-[12px] font-bold text-[#45464d] uppercase tracking-wider">
              Pending
            </span>
          </div>
        </div>
      </section>

      {/* Advisory Management */}
      <section className="space-y-3">
        <h3 className="text-[18px] sm:text-[20px] font-bold text-[#0b1c30]">
          Advisory Management
        </h3>

        <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 shadow-xs divide-y divide-[#c6c6cd]/50">
          <div className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
            <div>
              <p className="text-[15px] sm:text-[16px] font-bold text-[#0b1c30]">Hospital Spike Alert</p>
              <p className="text-[13px] text-[#45464d]">Auto-notify admin on admission surge.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hospitalSpikeActive}
                onChange={() => handleToggleAdvisory('hospitalSpike')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#c6c6cd] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#c6c6cd] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#131b2e]"></div>
            </label>
          </div>

          <div className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
            <div>
              <p className="text-[15px] sm:text-[16px] font-bold text-[#0b1c30]">Grid Overload Warning</p>
              <p className="text-[13px] text-[#45464d]">Rolling blackout pre-warning.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={gridOverloadActive}
                onChange={() => handleToggleAdvisory('gridOverload')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#c6c6cd] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#c6c6cd] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#131b2e]"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Recipient Segments */}
      <section className="space-y-3 pb-8">
        <h3 className="text-[18px] sm:text-[20px] font-bold text-[#0b1c30]">
          Recipient Segments
        </h3>

        <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[14px] mb-1.5">
                <span className="font-semibold text-[#0b1c30]">Outdoor Workers</span>
                <span className="text-[#45464d] font-bold">85% Coverage</span>
              </div>
              <div className="w-full bg-[#d3e4fe] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#da3437] h-2.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[14px] mb-1.5">
                <span className="font-semibold text-[#0b1c30]">Healthcare Admin</span>
                <span className="text-[#45464d] font-bold">100% Coverage</span>
              </div>
              <div className="w-full bg-[#d3e4fe] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#131b2e] h-2.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[14px] mb-1.5">
                <span className="font-semibold text-[#0b1c30]">Vulnerable Residents</span>
                <span className="text-[#45464d] font-bold">62% Coverage</span>
              </div>
              <div className="w-full bg-[#d3e4fe] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#4edea3] h-2.5 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
