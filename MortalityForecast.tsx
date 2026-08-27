import React, { useEffect, useState } from 'react';
import { WardMetric, ForecastDay } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface MortalityForecastProps {
  selectedZone: WardMetric;
}

export const MortalityForecast: React.FC<MortalityForecastProps> = ({ selectedZone }) => {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [coolingCentersOpen, setCoolingCentersOpen] = useState(true);
  const [powerGridAdjusted, setPowerGridAdjusted] = useState(false);
  const [triggerNotes, setTriggerNotes] = useState<string | null>(null);

  useEffect(() => {
    async function loadForecast() {
      setLoading(true);
      try {
        const res = await fetch(`/api/forecast/${selectedZone.id}`);
        if (res.ok) {
          const data = await res.json();
          setForecast(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadForecast();
  }, [selectedZone.id]);

  const handleToggleCooling = async () => {
    const nextVal = !coolingCentersOpen;
    setCoolingCentersOpen(nextVal);
    setTriggerNotes(nextVal ? 'Cooling Centers personnel dispatched to sector hubs.' : 'Cooling Centers placed on standby.');
    await fetch('/api/interventions/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intervention: 'coolingCenters', value: nextVal })
    });
  };

  const handleToggleGrid = async () => {
    const nextVal = !powerGridAdjusted;
    setPowerGridAdjusted(nextVal);
    setTriggerNotes(nextVal ? 'Power Grid load shedding scheduled for Thursday 22:00.' : 'Power Grid adjustment cancelled.');
    await fetch('/api/interventions/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intervention: 'powerGrid', value: nextVal })
    });
  };

  // Format data for chart
  const chartData = forecast.map((f, i) => ({
    name: f.dayName,
    date: f.date,
    htsi: f.htsi,
    mortality: f.mortalityRiskPercent,
    wbgt: f.wbgt,
    temp: f.tempMax,
    isPeak: i === 2 // Friday is peak
  }));

  return (
    <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-[24px] md:text-[32px] font-black text-[#0b1c30] tracking-tight leading-tight">
          3-5 Day Forecast
        </h2>
        <p className="text-[14px] text-[#45464d] mt-0.5 font-medium">
          Mortality Risk Assessment &bull; {selectedZone.name}
        </p>
      </div>

      {/* HTSI vs Mortality Chart Card */}
      <section className="bg-white border border-[#c6c6cd] rounded-xl p-4 sm:p-6 shadow-xs relative">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[18px] sm:text-[20px] font-bold text-[#0b1c30] tracking-tight">
            HTSI vs. Mortality
          </h3>
          <span className="text-[11px] sm:text-[12px] font-black text-[#da3437] uppercase tracking-wider bg-red-50 border border-red-200 px-2 py-0.5 rounded">
            EXTREME RISK ZONE
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4 text-[12px] font-bold">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-[#131b2e] inline-block rounded-full"></span>
            <span className="text-[#131b2e] uppercase tracking-wider">HTSI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-[#da3437] inline-block rounded-full"></span>
            <span className="text-[#da3437] uppercase tracking-wider">MORTALITY</span>
          </div>
        </div>

        {/* Recharts Line/Area Graph */}
        <div className="w-full h-56 sm:h-72">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  stroke="#45464d"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val, i) => (i === 2 ? `${val} (Peak)` : val)}
                />
                <YAxis
                  stroke="#45464d"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-sm text-red-400">
                            {data.name} — {data.date}
                          </p>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-300">Thermal Stress (HTSI):</span>
                            <span className="font-bold">{data.htsi}/100</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-red-300">Mortality Increase:</span>
                            <span className="font-bold text-red-400">+{data.mortality}%</span>
                          </div>
                          <div className="flex justify-between gap-4 text-[10px] text-gray-400">
                            <span>WBGT / Peak Temp:</span>
                            <span>{data.wbgt}°C / {data.temp}°C</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* HTSI Line (Dark Bold) */}
                <Line
                  type="monotone"
                  dataKey="htsi"
                  stroke="#131b2e"
                  strokeWidth={3.5}
                  dot={{ r: 4, fill: '#131b2e' }}
                  activeDot={{ r: 7 }}
                />

                {/* Mortality Line (Red Bold) */}
                <Line
                  type="monotone"
                  dataKey="mortality"
                  stroke="#da3437"
                  strokeWidth={3.5}
                  dot={{ r: 4, fill: '#da3437' }}
                  activeDot={{ r: 7, fill: '#b61722' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="text-center text-[12px] font-bold text-gray-500 uppercase tracking-wider mt-3">
          Forecast Window (Days)
        </div>
      </section>

      {/* Critical Vulnerability Card */}
      <section className="bg-white border border-[#c6c6cd] rounded-xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
        <div className="text-[#da3437] mt-0.5 shrink-0">
          <span className="material-symbols-outlined text-2xl" data-icon="warning" data-weight="fill">
            warning
          </span>
        </div>
        <div className="space-y-1">
          <h4 className="text-[16px] font-bold text-[#0b1c30]">Critical Vulnerability</h4>
          <p className="text-[14px] text-[#45464d] leading-relaxed">
            Peak projected for Friday. High vulnerability in elderly populations (Age 65+) and construction zones.
          </p>
        </div>
      </section>

      {/* Intervention Triggers Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0b1c30] text-xl" data-icon="splitscreen">
            splitscreen
          </span>
          <h3 className="text-[20px] font-bold text-[#0b1c30] tracking-tight">
            Intervention Triggers
          </h3>
        </div>

        {triggerNotes && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs px-3 py-2 rounded-lg animate-in fade-in">
            &bull; {triggerNotes}
          </div>
        )}

        <div className="bg-white border border-[#c6c6cd] rounded-xl overflow-hidden shadow-xs divide-y divide-[#c6c6cd]/50">
          {/* Card 1: Open Cooling Centers */}
          <div className="p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-gray-50/60 transition-colors">
            <div className="flex items-start gap-3.5">
              <label className="relative flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={coolingCentersOpen}
                  onChange={handleToggleCooling}
                  className="w-5 h-5 rounded border-gray-300 text-[#131b2e] focus:ring-[#131b2e] cursor-pointer"
                />
              </label>
              <div>
                <h4 className="text-[16px] font-bold text-[#0b1c30]">
                  Open Cooling Centers
                </h4>
                <p className="text-[13px] sm:text-[14px] text-[#45464d] mt-1 leading-relaxed">
                  Automated dispatch of personnel to designated sector facilities.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold tracking-tight uppercase ${
                coolingCentersOpen ? 'bg-[#131b2e] text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {coolingCentersOpen ? 'ACTIVE' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Card 2: Adjust Power Grid */}
          <div className="p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-gray-50/60 transition-colors">
            <div className="flex items-start gap-3.5">
              <label className="relative flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={powerGridAdjusted}
                  onChange={handleToggleGrid}
                  className="w-5 h-5 rounded border-gray-300 text-[#131b2e] focus:ring-[#131b2e] cursor-pointer"
                />
              </label>
              <div>
                <h4 className="text-[16px] font-bold text-[#0b1c30]">
                  Adjust Power Grid
                </h4>
                <p className="text-[13px] sm:text-[14px] text-[#45464d] mt-1 leading-relaxed">
                  Pre-emptive load shedding in non-critical sectors to preserve hospital supply.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="bg-[#eff4ff] text-[#131b2e] border border-[#bec6e0] px-2.5 py-1 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                THURSDAY 22:00
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
