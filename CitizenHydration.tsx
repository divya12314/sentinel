import React, { useState, useEffect } from 'react';
import { CitizenProfile, WardMetric } from '../../types';
import { calculateDailyWaterRequirement } from '../../utils/hydrationCalculator';

interface CitizenHydrationProps {
  profile: CitizenProfile;
  zone: WardMetric;
  onLogWater: (amountMl: number) => void;
  onUpdateTarget: (targetMl: number) => void;
  onNavigateBack: () => void;
}

export const CitizenHydration: React.FC<CitizenHydrationProps> = ({
  profile,
  zone,
  onLogWater,
  onUpdateTarget,
  onNavigateBack
}) => {
  const hydration = calculateDailyWaterRequirement(profile, zone);
  const [customMl, setCustomMl] = useState<string>('300');
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(
    hydration.recommendedIntakeIntervalMinutes * 60
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [timerAlertFired, setTimerAlertFired] = useState<boolean>(false);

  const targetMl = profile.dailyWaterTargetMl || hydration.totalTargetMl;
  const currentMl = profile.waterIntakeMl || 0;
  const percentComplete = Math.min(100, Math.round((currentMl / targetMl) * 100));

  // Interval timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setTimerAlertFired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsLeft]);

  const handleResetTimer = (amountMl?: number) => {
    if (amountMl) {
      onLogWater(amountMl);
    }
    setTimerSecondsLeft(hydration.recommendedIntakeIntervalMinutes * 60);
    setTimerAlertFired(false);
    setIsTimerRunning(true);
  };

  const handleAddCustomWater = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(customMl);
    if (val > 0) {
      onLogWater(val);
      handleResetTimer();
    }
  };

  const minutes = Math.floor(timerSecondsLeft / 60);
  const seconds = timerSecondsLeft % 60;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 transition-all"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">water_drop</span>
              Personalized Hydration Calculator
            </h1>
            <p className="text-xs text-gray-500">
              Real-time physiological hydration tracking based on body mass and localized WBGT
            </p>
          </div>
        </div>

        <button
          onClick={() => onUpdateTarget(hydration.totalTargetMl)}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
        >
          Recalculate Dynamic Target
        </button>
      </div>

      {/* Main Hydration Card with Visual Fill Ring */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Circular Progress Gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50/50 to-cyan-50/50 rounded-2xl border border-blue-100">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-gray-200 stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-blue-600 stroke-current transition-all duration-700 ease-out"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * percentComplete) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Inner Text */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold font-mono text-gray-900">
                  {percentComplete}%
                </span>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mt-0.5">
                  Hydrated
                </span>
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="text-sm font-extrabold text-gray-900 font-mono">
                {currentMl.toLocaleString()} / {targetMl.toLocaleString()} ml
              </span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                Remaining: <strong className="text-blue-700">{Math.max(0, targetMl - currentMl).toLocaleString()} ml</strong>
              </span>
            </div>
          </div>

          {/* Hydration Science Breakdown */}
          <div className="md:col-span-2 space-y-3">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2">
                Hydration Requirement Formula
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-500 font-semibold block">Body Weight Baseline</span>
                  <span className="text-sm font-mono font-bold text-gray-800">{hydration.baseRequirementMl} ml</span>
                  <span className="text-[10px] text-gray-400 block">{profile.weightKg} kg × 35ml</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-red-200">
                  <span className="text-[10px] text-red-600 font-semibold block">WBGT Heat Surcharge</span>
                  <span className="text-sm font-mono font-bold text-red-700">+{hydration.heatStressBonusMl} ml</span>
                  <span className="text-[10px] text-red-500 block">{zone.wbgt}°C Thermal Load</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                  <span className="text-[10px] text-blue-600 font-semibold block">Physical Exertion</span>
                  <span className="text-sm font-mono font-bold text-blue-700">+{hydration.laborBonusMl} ml</span>
                  <span className="text-[10px] text-blue-500 block capitalize">{profile.activityIntensity}</span>
                </div>
              </div>
            </div>

            {/* Electrolytes Advice */}
            {hydration.electrolytesNeeded && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                <span className="material-symbols-outlined text-amber-700 text-lg mt-0.5">science</span>
                <div>
                  <strong className="block text-amber-900">Electrolyte & ORS Replenishment Advised</strong>
                  Due to high sweating in WBGT &gt; 31°C, pure water alone can cause water intoxication (hyponatremia). Consume 1 packet of WHO-formula ORS or lemon-salt water for every 1.5L of water intake.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Hydration Sip Timer */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-600">notifications_active</span>
              Mandatory Hydration Interval Alarm
            </h2>
            <p className="text-xs text-gray-500">
              Under current {zone.wbgt}°C WBGT, you must take sips every {hydration.recommendedIntakeIntervalMinutes} minutes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
              {soundEnabled ? 'Sound On' : 'Muted'}
            </button>
          </div>
        </div>

        {/* Timer Box */}
        <div
          className={`p-5 rounded-2xl border text-center transition-all ${
            timerAlertFired
              ? 'bg-red-50 border-red-500 animate-pulse'
              : 'bg-cyan-50/50 border-cyan-200'
          }`}
        >
          {timerAlertFired ? (
            <div className="space-y-3">
              <span className="text-red-700 font-extrabold text-sm uppercase tracking-wider block">
                🚨 TIME TO DRINK WATER & TAKE A 5-MIN SHADE BREAK!
              </span>
              <p className="text-xs text-red-900 font-medium max-w-md mx-auto">
                Drink at least 250ml of water or electrolyte solution immediately.
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  id="btn-confirm-drank-250"
                  onClick={() => handleResetTimer(250)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  Drank 250ml & Reset Timer
                </button>
                <button
                  onClick={() => handleResetTimer(500)}
                  className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">water_bottle</span>
                  Drank 500ml & Reset Timer
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-mono text-4xl sm:text-5xl font-extrabold text-cyan-950 tracking-wider">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <span className="text-xs text-cyan-800 font-semibold block">
                Until next mandatory hydration reminder
              </span>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-4 py-1.5 bg-white border border-cyan-300 text-cyan-900 font-bold text-xs rounded-lg hover:bg-cyan-100"
                >
                  {isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
                </button>
                <button
                  onClick={() => handleResetTimer()}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Reset Interval
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Hydration Intake Form & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Log Buttons & Custom Input */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">add_circle</span>
            Log Water Intake
          </h2>

          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <button
              onClick={() => onLogWater(250)}
              className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-blue-600 text-xl block mb-1">local_drink</span>
              <div className="text-xs font-bold text-blue-950">+250 ml</div>
              <div className="text-[10px] text-blue-700">Small Cup / Glass</div>
            </button>

            <button
              onClick={() => onLogWater(500)}
              className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-blue-600 text-xl block mb-1">water_bottle</span>
              <div className="text-xs font-bold text-blue-950">+500 ml</div>
              <div className="text-[10px] text-blue-700">Water Bottle</div>
            </button>

            <button
              onClick={() => onLogWater(750)}
              className="p-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl text-left transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-cyan-600 text-xl block mb-1">medical_services</span>
              <div className="text-xs font-bold text-cyan-950">+750 ml ORS</div>
              <div className="text-[10px] text-cyan-700">Oral Electrolyte Solution</div>
            </button>

            <button
              onClick={() => onLogWater(1000)}
              className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-blue-600 text-xl block mb-1">water</span>
              <div className="text-xs font-bold text-blue-950">+1.0 Liter</div>
              <div className="text-[10px] text-blue-700">Large Flask</div>
            </button>
          </div>

          <form onSubmit={handleAddCustomWater} className="flex gap-2">
            <input
              id="input-custom-water"
              type="number"
              min="50"
              max="2500"
              step="50"
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              placeholder="Custom ml (e.g. 350)"
              className="flex-1 px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Add Custom
            </button>
          </form>
        </div>

        {/* Water Log Activity History */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-600">history</span>
                Today's Water Intake Log
              </h2>
              <span className="text-[11px] font-mono text-gray-500">
                {profile.waterLogs?.length || 0} entries
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 pr-1">
              {profile.waterLogs && profile.waterLogs.length > 0 ? (
                profile.waterLogs.map((log, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="font-semibold text-gray-800">+{log.amountMl} ml</span>
                    </div>
                    <span className="font-mono text-gray-500">{log.time}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No water logs recorded yet today. Drink a cup and log above!
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-500">
              Total Recorded Today: <strong className="text-blue-700 font-mono">{currentMl} ml</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
