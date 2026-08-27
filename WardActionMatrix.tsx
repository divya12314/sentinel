import React, { useState } from 'react';
import { WardActionMatrixRow, RiskLevel } from '../../types';

interface WardActionMatrixProps {
  matrix: WardActionMatrixRow[];
  onTriggerAction: (wardId: string, actionType: 'tankers' | 'cooling' | 'general') => void;
  onOpenAlertsModal?: () => void;
}

export const WardActionMatrix: React.FC<WardActionMatrixProps> = ({
  matrix,
  onTriggerAction
}) => {
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string>('');

  const filtered = matrix.filter((row) => {
    if (selectedZoneFilter === 'all') return true;
    return row.zone.toLowerCase().includes(selectedZoneFilter.toLowerCase());
  });

  const handleAction = (wardId: string, actionType: 'tankers' | 'cooling' | 'general') => {
    onTriggerAction(wardId, actionType);
    setDispatchSuccessMsg(`Emergency directive successfully dispatched for ${wardId}. Protocol updated.`);
    setTimeout(() => setDispatchSuccessMsg(''), 4000);
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'Critical':
        return 'bg-red-100 text-red-900 border-red-300 animate-pulse';
      case 'Severe':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'High':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
  };

  // Metrics
  const criticalCount = matrix.filter((r) => r.heatRisk === 'Critical').length;
  const avgSurge = Math.round(
    matrix.reduce((acc, r) => acc + r.hospitalizationSurge, 0) / matrix.length
  );
  const totalWaterStock = matrix.reduce((acc, r) => acc + r.waterStockRemainingLiters, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-700">grid_view</span>
            Ward-Level Vulnerability & Action Matrix
          </h1>
          <p className="text-xs text-gray-500">
            Real-time municipal matrix coordinating localized Heat Action Plan (HAP) trigger protocols
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600">Filter Zone:</span>
          <select
            value={selectedZoneFilter}
            onChange={(e) => setSelectedZoneFilter(e.target.value)}
            className="bg-white border border-gray-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-red-500 focus:outline-none shadow-2xs"
          >
            <option value="all">All City Wards ({matrix.length})</option>
            <option value="west">West Zone</option>
            <option value="central">Central Zone</option>
            <option value="north">North Zone</option>
            <option value="east">East Zone</option>
            <option value="south">South Zone</option>
          </select>
        </div>
      </div>

      {dispatchSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-base text-emerald-700">task_alt</span>
          {dispatchSuccessMsg}
        </div>
      )}

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider block">
              Critical Wards Under Code Red
            </span>
            <span className="text-2xl font-extrabold font-mono text-gray-900 mt-1 block">
              {criticalCount} of {matrix.length} Wards
            </span>
            <span className="text-[11px] text-red-600 font-medium">Immediate HAP Level 3 Trigger Required</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Avg Hospitalization Surge
            </span>
            <span className="text-2xl font-extrabold font-mono text-amber-700 mt-1 block">
              +{avgSurge}%
            </span>
            <span className="text-[11px] text-gray-500 font-medium">Above baseline non-heatwave load</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <span className="material-symbols-outlined text-2xl">local_hospital</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Emergency Water Reserve
            </span>
            <span className="text-2xl font-extrabold font-mono text-blue-700 mt-1 block">
              {totalWaterStock.toLocaleString()} Liters
            </span>
            <span className="text-[11px] text-blue-600 font-medium">Potable tanker fleet standby</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <span className="material-symbols-outlined text-2xl">water_bottle</span>
          </div>
        </div>
      </div>

      {/* Ward Action Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-700 text-lg">table_chart</span>
            <span className="font-bold text-sm text-gray-900">Municipal Ward Action Protocols</span>
          </div>
          <span className="text-xs font-mono text-gray-500">Live Synchronized</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Ward / Zone</th>
                <th className="py-3 px-3">Heat Risk</th>
                <th className="py-3 px-3 font-mono">WBGT</th>
                <th className="py-3 px-3 font-mono">Mortality Spike</th>
                <th className="py-3 px-3 font-mono">Hospital Surge</th>
                <th className="py-3 px-4">Cooling Center Occupancy</th>
                <th className="py-3 px-4">Recommended Directive</th>
                <th className="py-3 px-4 text-right">Trigger Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {filtered.map((row) => (
                <tr key={row.wardId} className="hover:bg-gray-50/80 transition-colors">
                  {/* Ward */}
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    <div>{row.wardName}</div>
                    <span className="text-[10px] text-gray-400 font-normal">{row.zone}</span>
                  </td>

                  {/* Heat Risk */}
                  <td className="py-3.5 px-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getRiskBadge(row.heatRisk)}`}>
                      {row.heatRisk}
                    </span>
                  </td>

                  {/* WBGT */}
                  <td className="py-3.5 px-3 font-mono font-bold text-red-700">
                    {row.wbgt}°C
                  </td>

                  {/* Mortality */}
                  <td className="py-3.5 px-3 font-mono font-bold text-red-600">
                    +{row.mortalityRisk}%
                  </td>

                  {/* Hospitalization */}
                  <td className="py-3.5 px-3 font-mono font-bold text-amber-700">
                    +{row.hospitalizationSurge}%
                  </td>

                  {/* Cooling */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-gray-800">{row.coolingAccessOccupancy}</div>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      Water: {row.waterStockRemainingLiters.toLocaleString()} L
                    </span>
                  </td>

                  {/* Recommended Action */}
                  <td className="py-3.5 px-4 max-w-xs text-gray-700 text-[11px] leading-relaxed">
                    {row.recommendedAction}
                  </td>

                  {/* Action Button */}
                  <td className="py-3.5 px-4 text-right">
                    {row.actionStatus === 'Dispatched' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <span className="material-symbols-outlined text-xs">check</span>
                        Dispatched
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleAction(row.wardId, 'tankers')}
                          title="Dispatch Potable Tanker"
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] rounded-lg border border-blue-200 transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">local_shipping</span>
                          Tanker
                        </button>
                        <button
                          onClick={() => handleAction(row.wardId, 'cooling')}
                          title="Activate Full Cooling Hub Capacity"
                          className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">bolt</span>
                          Trigger HAP
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
