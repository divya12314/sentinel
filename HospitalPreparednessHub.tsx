import React, { useState } from 'react';
import { HospitalPreparednessDirective } from '../../types';

interface HospitalPreparednessHubProps {
  directives: HospitalPreparednessDirective[];
  onUpdateDirective: (id: string, additionalIvBags: number, reservedBeds: number) => void;
}

export const HospitalPreparednessHub: React.FC<HospitalPreparednessHubProps> = ({
  directives,
  onUpdateDirective
}) => {
  const [successNotice, setSuccessNotice] = useState<string>('');

  const handleIssueIvOrder = (id: string, hospitalName: string) => {
    onUpdateDirective(id, 500, 0);
    setSuccessNotice(`Dispatched +500 Normal Saline (0.9%) infusion units to ${hospitalName}.`);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  const handleReserveBeds = (id: string, hospitalName: string) => {
    onUpdateDirective(id, 0, 10);
    setSuccessNotice(`Mandatory directive sent: 10 acute heatstroke triage beds reserved at ${hospitalName}.`);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  const getTriageBadge = (level: string) => {
    switch (level) {
      case 'Code Red':
        return 'bg-red-700 text-white animate-pulse';
      case 'Code Yellow':
        return 'bg-amber-500 text-gray-950';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600">local_hospital</span>
            Hospital & Facility Preparedness Directives
          </h1>
          <p className="text-xs text-gray-500">
            Emergency public health surge management: IV saline stocks, rapid ice immersion units, and heatstroke triage
          </p>
        </div>

        <div className="text-xs font-semibold bg-red-50 text-red-800 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          <span>Code Red Hospital Protocol Active</span>
        </div>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-base text-emerald-700">check_circle</span>
          {successNotice}
        </div>
      )}

      {/* Hospital Directives Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {directives.map((hosp) => {
          const ivStockPercent = Math.min(100, Math.round((hosp.ivBagsInStock / hosp.ivBagsRequiredTarget) * 100));
          const isDeficit = hosp.ivBagsInStock < hosp.ivBagsRequiredTarget;

          return (
            <div
              key={hosp.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between"
            >
              <div>
                {/* Hospital Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{hosp.hospitalName}</h2>
                    <span className="text-[11px] text-gray-500">{hosp.ward}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${getTriageBadge(hosp.triageAlertLevel)}`}>
                    {hosp.triageAlertLevel}
                  </span>
                </div>

                {/* IV Saline Bags Progress */}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 mb-3 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-blue-600 text-sm">water_drop</span>
                      IV Saline Bags in Stock
                    </span>
                    <span className="font-mono text-gray-900">
                      {hosp.ivBagsInStock.toLocaleString()} / {hosp.ivBagsRequiredTarget.toLocaleString()} units
                    </span>
                  </div>

                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ivStockPercent < 50 ? 'bg-red-500' : ivStockPercent < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${ivStockPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Target: {hosp.ivBagsRequiredTarget} units</span>
                    {isDeficit && (
                      <span className="text-red-600 font-bold">
                        Deficit: {hosp.ivBagsRequiredTarget - hosp.ivBagsInStock} units
                      </span>
                    )}
                  </div>
                </div>

                {/* Beds & Immersion Tubs */}
                <div className="grid grid-cols-2 gap-2.5 mb-3 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-500 block font-semibold">Heatstroke Beds</span>
                    <span className="text-sm font-mono font-extrabold text-gray-900">
                      {hosp.heatstrokeBedsAvailable} / {hosp.heatstrokeBedsTotal} Avail.
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Air-cooled ward</span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-500 block font-semibold">Cold Immersion Tubs</span>
                    <span className="text-sm font-mono font-extrabold text-blue-700">
                      {hosp.iceBathTubsAvailable} Units
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Rapid cooling</span>
                  </div>
                </div>

                {/* Directive Notes */}
                <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-xl text-[11px] text-red-950 mb-3 leading-relaxed">
                  <strong className="block text-red-900 font-semibold mb-0.5">Current Health Advisory:</strong>
                  {hosp.statusNotes}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleIssueIvOrder(hosp.id, hosp.hospitalName)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">inventory_2</span>
                  Dispatch +500 Saline IV Units
                </button>

                <button
                  onClick={() => handleReserveBeds(hosp.id, hosp.hospitalName)}
                  className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">single_bed</span>
                  Reserve 10 Emergency Triage Beds
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
