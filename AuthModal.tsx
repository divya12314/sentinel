import React, { useState } from 'react';
import {
  CitizenProfile,
  AdminProfile,
  AdminRole,
  OutdoorExposureLevel,
  AgeBracket,
  ActivityIntensity
} from '../types';
import { DEFAULT_CITIZEN_PROFILE, DEFAULT_ADMIN_PROFILE } from '../data/portalData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCitizen?: (profile: CitizenProfile) => void;
  onSelectAdmin?: (profile: AdminProfile) => void;
  onCitizenLogin?: (profile: CitizenProfile) => void;
  onAdminLogin?: (profile: AdminProfile) => void;
  initialRole?: 'citizen' | 'admin';
  initialTab?: 'citizen' | 'admin';
  currentCitizenProfile?: CitizenProfile;
  currentAdminProfile?: AdminProfile | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSelectCitizen,
  onSelectAdmin,
  onCitizenLogin,
  onAdminLogin,
  initialRole,
  initialTab = 'citizen',
  currentCitizenProfile,
  currentAdminProfile
}) => {
  const [activeTab, setActiveTab] = useState<'citizen' | 'admin'>(initialRole || initialTab || 'citizen');

  // Citizen Form State
  const [citizenEmail, setCitizenEmail] = useState(currentCitizenProfile?.email || 'ramesh.kumar@worker.in');
  const [citizenAge, setCitizenAge] = useState<number>(currentCitizenProfile?.age || 38);
  const [citizenWeight, setCitizenWeight] = useState<number>(currentCitizenProfile?.weightKg || 68);
  const [outdoorExposure, setOutdoorExposure] = useState<OutdoorExposureLevel>(
    currentCitizenProfile?.outdoorExposure || 'high_exposure'
  );
  const [ageBracket, setAgeBracket] = useState<AgeBracket>(currentCitizenProfile?.ageBracket || 'adult');
  const [activityIntensity, setActivityIntensity] = useState<ActivityIntensity>(
    currentCitizenProfile?.activityIntensity || 'heavy_labor'
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    currentCitizenProfile?.preExistingConditions && currentCitizenProfile.preExistingConditions.length > 0
      ? currentCitizenProfile.preExistingConditions
      : ['Mild Hypertension']
  );

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState(currentAdminProfile?.officialEmail || 'officer.deshmukh@gcc.gov.in');
  const [adminPassword, setAdminPassword] = useState('••••••••••••');
  const [adminRole, setAdminRole] = useState<AdminRole>(
    currentAdminProfile?.departmentRole || 'Disaster Management & Public Health'
  );
  const [adminPhone, setAdminPhone] = useState(currentAdminProfile?.phone || '+91 98201 45678');
  const [otpStep, setOtpStep] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('842915');
  const [otpError, setOtpError] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAgeChange = (val: number) => {
    setCitizenAge(val);
    if (val < 18) setAgeBracket('child');
    else if (val >= 65) setAgeBracket('senior');
    else setAgeBracket('adult');
  };

  const toggleCondition = (cond: string) => {
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter(c => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions, cond]);
    }
  };

  const dispatchCitizenLogin = (profile: CitizenProfile) => {
    if (typeof onCitizenLogin === 'function') onCitizenLogin(profile);
    if (typeof onSelectCitizen === 'function') onSelectCitizen(profile);
    onClose();
  };

  const dispatchAdminLogin = (profile: AdminProfile) => {
    if (typeof onAdminLogin === 'function') onAdminLogin(profile);
    if (typeof onSelectAdmin === 'function') onSelectAdmin(profile);
    onClose();
  };

  const handleCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile: CitizenProfile = {
      ...DEFAULT_CITIZEN_PROFILE,
      id: currentCitizenProfile?.id || `cit-${Date.now()}`,
      email: citizenEmail,
      age: Number(citizenAge) || 35,
      weightKg: Number(citizenWeight) || 65,
      outdoorExposure,
      ageBracket,
      activityIntensity,
      preExistingConditions: selectedConditions,
      registeredAt: currentCitizenProfile?.registeredAt || new Date().toISOString()
    };
    dispatchCitizenLogin(profile);
  };

  const handleAdminRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingOtp(true);
    setOtpError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          departmentRole: adminRole,
          phone: adminPhone
        })
      });
      const data = await res.json();
      if (data.demoOtp) {
        setGeneratedOtp(data.demoOtp);
      }
      setOtpStep(true);
    } catch {
      setGeneratedOtp('842915');
      setOtpStep(true);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (!otpCode || otpCode.length < 4) {
      setOtpError('Please enter the 6-digit OTP code');
      return;
    }

    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          departmentRole: adminRole,
          phone: adminPhone,
          otp: otpCode
        })
      });
      const data = await res.json();
      if (data.authenticated) {
        dispatchAdminLogin(data.adminProfile);
      } else {
        setOtpError(data.error || 'Invalid OTP code. Please try again.');
      }
    } catch {
      // Fallback
      if (otpCode === generatedOtp || otpCode === '842915' || otpCode === '123456') {
        dispatchAdminLogin({
          officialEmail: adminEmail,
          departmentRole: adminRole,
          phone: adminPhone,
          isAuthenticated: true,
          loginTime: new Date().toISOString()
        });
      } else {
        setOtpError('Invalid OTP code. Use demo code ' + generatedOtp);
      }
    }
  };

  const fillQuickCitizenDemo = () => {
    dispatchCitizenLogin(DEFAULT_CITIZEN_PROFILE);
  };

  const fillQuickAdminDemo = () => {
    dispatchAdminLogin(DEFAULT_ADMIN_PROFILE);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Tabs */}
        <div className="bg-[#131b2e] px-6 pt-6 pb-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <span className="material-symbols-outlined text-lg">verified_user</span>
              </div>
              <span className="font-mono font-bold tracking-tight text-lg text-white">
                SENTINEL RESPONSE PORTAL
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <p className="text-xs text-gray-300 mb-4">
            Select your role to access personalized heat protection or municipal command controls.
          </p>

          <div className="grid grid-cols-2 gap-2 bg-[#0b1220] p-1 rounded-xl border border-white/10">
            <button
              id="tab-citizen-portal"
              type="button"
              onClick={() => {
                setActiveTab('citizen');
                setOtpStep(false);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'citizen'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-sm">engineering</span>
              Citizen / Worker Portal
            </button>
            <button
              id="tab-admin-portal"
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setOtpStep(false);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-red-700 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-sm">shield_person</span>
              Municipal Admin Portal
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'citizen' ? (
            /* CITIZEN FORM */
            <form onSubmit={handleCitizenSubmit} className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 text-xl mt-0.5">info</span>
                <div className="text-xs text-blue-950">
                  <span className="font-bold block text-blue-900">Personalized Thermal Health Protection</span>
                  Computes your custom WBGT heat risk threshold, daily hydration volume (liters), and immediate shade/rest intervals.
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address / Mobile ID
                </label>
                <input
                  id="input-citizen-email"
                  type="email"
                  required
                  value={citizenEmail}
                  onChange={(e) => setCitizenEmail(e.target.value)}
                  placeholder="worker@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Age and Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Age (Years): <span className="text-blue-700 font-extrabold">{citizenAge} yrs</span>
                  </label>
                  <input
                    id="input-citizen-age"
                    type="number"
                    min="5"
                    max="105"
                    required
                    value={citizenAge}
                    onChange={(e) => handleAgeChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Bracket: <strong className="uppercase text-gray-700">{ageBracket}</strong>
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Body Weight: <span className="text-blue-700 font-extrabold">{citizenWeight} kg</span>
                  </label>
                  <input
                    id="input-citizen-weight"
                    type="number"
                    min="20"
                    max="200"
                    required
                    value={citizenWeight}
                    onChange={(e) => setCitizenWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 block mt-0.5">Used for hydration multiplier</span>
                </div>
              </div>

              {/* Outdoor Work Exposure */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Outdoor Work Exposure:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: 'high_exposure',
                      label: 'High Exposure (6+ hrs outdoors)',
                      sub: 'Construction, Street Vendor, Delivery, Traffic Police, Agriculture'
                    },
                    {
                      id: 'moderate_exposure',
                      label: 'Moderate Exposure (2-5 hrs outdoors)',
                      sub: 'Transit Commuters, Logistics Loading, Field Inspectors'
                    },
                    {
                      id: 'low_exposure',
                      label: 'Low / Shaded Exposure (<2 hrs outdoors)',
                      sub: 'Indoor Office, Home, Retail Store'
                    }
                  ].map((exp) => (
                    <label
                      key={exp.id}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        outdoorExposure === exp.id
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="outdoorExposure"
                        checked={outdoorExposure === exp.id}
                        onChange={() => setOutdoorExposure(exp.id as OutdoorExposureLevel)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-800">{exp.label}</div>
                        <div className="text-[11px] text-gray-500">{exp.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Physical Activity Intensity */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Physical Activity Intensity:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sedentary', label: 'Light / Desk', icon: 'chair' },
                    { id: 'moderate', label: 'Moderate Walk', icon: 'directions_walk' },
                    { id: 'heavy_labor', label: 'Heavy Labor', icon: 'fitness_center' }
                  ].map((act) => (
                    <button
                      type="button"
                      key={act.id}
                      onClick={() => setActivityIntensity(act.id as ActivityIntensity)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        activityIntensity === act.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50 text-xs'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{act.icon}</span>
                      <span className="text-[11px]">{act.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Health Conditions */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Pre-Existing Medical Factors (Optional):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Hypertension / High BP', 'Diabetes', 'Cardiac History', 'Asthma / Respiratory', 'None'].map(
                    (cond) => {
                      const isSelected = selectedConditions.includes(cond);
                      return (
                        <button
                          type="button"
                          key={cond}
                          onClick={() => toggleCondition(cond)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {cond}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  id="btn-citizen-enter"
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">explore</span>
                  Enter Citizen / Worker Health Portal
                </button>
                <button
                  type="button"
                  onClick={fillQuickCitizenDemo}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all"
                >
                  ⚡ Instant 1-Click Demo Profile (Outdoor Construction Worker)
                </button>
              </div>
            </form>
          ) : (
            /* ADMIN FORM */
            <div className="space-y-4">
              {!otpStep ? (
                <form onSubmit={handleAdminRequestOtp} className="space-y-4">
                  <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-600 text-xl mt-0.5">admin_panel_settings</span>
                    <div className="text-xs text-red-950">
                      <span className="font-bold block text-red-900">Official Municipal Corporation Access</span>
                      Requires verified government credentials and 2-factor OTP verification for emergency escalation authority.
                    </div>
                  </div>

                  {/* Official Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Official Corporation Email
                    </label>
                    <input
                      id="input-admin-email"
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="officer@gcc.gov.in"
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Portal Password
                    </label>
                    <input
                      id="input-admin-password"
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Department Role Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Department Role:
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          role: 'Disaster Management & Public Health',
                          icon: 'health_and_safety',
                          desc: 'Full authority for Heat Action Plan (HAP) Level 1-3 triggers and public broadcasts'
                        },
                        {
                          role: 'Zonal Executive Officer',
                          icon: 'location_city',
                          desc: 'Ward-level resource dispatch, cooling centers, and water tanker logistics'
                        },
                        {
                          role: 'Emergency Services Response Head',
                          icon: 'local_fire_department',
                          desc: '108 Ambulance fleet coordination and hospital triage bed management'
                        }
                      ].map((item) => (
                        <label
                          key={item.role}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            adminRole === item.role
                              ? 'border-red-600 bg-red-50/50 shadow-sm'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="adminRole"
                            checked={adminRole === item.role}
                            onChange={() => setAdminRole(item.role as AdminRole)}
                            className="mt-1 text-red-600 focus:ring-red-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-red-700">{item.icon}</span>
                              {item.role}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Phone for 2FA */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Official Mobile Number (for 2FA OTP)
                    </label>
                    <input
                      id="input-admin-phone"
                      type="tel"
                      required
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="+91 98201 XXXXX"
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Next button */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      id="btn-admin-request-otp"
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-red-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">sms</span>
                      {isSendingOtp ? 'Sending Secure OTP...' : 'Send 2-Factor OTP to Mobile'}
                    </button>
                    <button
                      type="button"
                      onClick={fillQuickAdminDemo}
                      className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all"
                    >
                      ⚡ Instant 1-Click Demo Login (Disaster Management Officer)
                    </button>
                  </div>
                </form>
              ) : (
                /* 2FA OTP STEP */
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-xl mt-0.5">phonelink_lock</span>
                    <div className="text-xs text-emerald-950">
                      <span className="font-bold block text-emerald-900">OTP Sent Successfully</span>
                      A 6-digit verification code was dispatched to <strong>{adminPhone}</strong>.
                    </div>
                  </div>

                  <div className="text-center py-2">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Enter 6-Digit Security OTP
                    </label>
                    <input
                      id="input-admin-otp"
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-48 mx-auto text-center tracking-[0.6em] text-2xl font-mono py-2.5 border-2 border-red-500 rounded-xl bg-gray-50 focus:outline-none focus:ring-4 focus:ring-red-500/20"
                    />
                    {otpError && (
                      <div className="text-xs text-red-600 font-bold mt-2">{otpError}</div>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      Sandbox Demo OTP: <strong className="font-mono text-red-700">{generatedOtp}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(generatedOtp)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Auto-Fill OTP
                    </button>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="w-1/3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                    >
                      &larr; Back
                    </button>
                    <button
                      id="btn-admin-verify-enter"
                      type="submit"
                      className="w-2/3 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">verified</span>
                      Verify & Access Command Center
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
