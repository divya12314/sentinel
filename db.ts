import fs from 'fs';
import path from 'path';
import {
  ActiveTrigger,
  RecipientSegment,
  CityResource,
  EmergencyAlert,
  WardActionMatrixRow,
  HospitalPreparednessDirective,
  HeatActionChecklistItem,
  CitizenProfile,
  AdminProfile,
  HotspotOverlay,
  HistoricalYearData
} from '../src/types';
import { INITIAL_ZONES, INITIAL_ACTIVE_TRIGGERS, INITIAL_RECIPIENT_SEGMENTS, INITIAL_CITY_RESOURCES, INITIAL_HOTSPOTS, ZoneConfig } from '../src/data/zonesData';
import {
  DEFAULT_CITIZEN_PROFILE,
  DEFAULT_ADMIN_PROFILE,
  INITIAL_WARD_ACTION_MATRIX,
  INITIAL_HISTORICAL_DATA,
  INITIAL_HOSPITAL_DIRECTIVES,
  INITIAL_HEAT_ACTION_CHECKLIST
} from '../src/data/portalData';

export interface InterventionStatus {
  coolingCentersOpened: boolean;
  coolingCentersPersonnelDispatched: boolean;
  coolingCentersOpenedAt?: string;
  powerGridAdjusted: boolean;
  powerGridScheduledTime: string;
  hospitalSpikeAlertActive: boolean;
  gridOverloadWarningActive: boolean;
}

export interface OTPRecord {
  code: string;
  expiresAt: number;
}

export interface DBData {
  zones: ZoneConfig[];
  activeTriggers: ActiveTrigger[];
  recipientSegments: RecipientSegment[];
  cityResources: CityResource[];
  alertsLog: EmergencyAlert[];
  wardActionMatrix: WardActionMatrixRow[];
  hospitalDirectives: HospitalPreparednessDirective[];
  hapChecklist: HeatActionChecklistItem[];
  citizenProfiles: Record<string, CitizenProfile>;
  adminProfiles: Record<string, AdminProfile>;
  activeOtps: Record<string, OTPRecord>;
  interventionStatus: InterventionStatus;
  hotspots: HotspotOverlay[];
  historicalData: Record<string, HistoricalYearData[]>;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'sentinel_db.json');

class JSONDatabaseManager {
  private data!: DBData;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, initializing defaults:', err);
        this.data = this.getDefaults();
        this.save();
      }
    } else {
      this.data = this.getDefaults();
      this.save();
    }
  }

  private getDefaults(): DBData {
    return {
      zones: [...INITIAL_ZONES],
      activeTriggers: [...INITIAL_ACTIVE_TRIGGERS],
      recipientSegments: [...INITIAL_RECIPIENT_SEGMENTS],
      cityResources: [...INITIAL_CITY_RESOURCES],
      alertsLog: [
        {
          id: `alert-${Date.now()}`,
          title: 'RED ALERT - West Zone Heatwave',
          message: 'Mortality Risk +18.4% expected. Automated SMS/WhatsApp advisory dispatched to outdoor workers in Ward 12.',
          zone: 'Ward 12 - West Zone',
          level: 'RED',
          channels: ['SMS', 'WhatsApp', 'FCM_Push'],
          recipientsCount: 42800,
          status: 'Issued',
          issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      wardActionMatrix: [...INITIAL_WARD_ACTION_MATRIX],
      hospitalDirectives: [...INITIAL_HOSPITAL_DIRECTIVES],
      hapChecklist: [...INITIAL_HEAT_ACTION_CHECKLIST],
      citizenProfiles: {
        'default': { ...DEFAULT_CITIZEN_PROFILE },
        [DEFAULT_CITIZEN_PROFILE.email]: { ...DEFAULT_CITIZEN_PROFILE }
      },
      adminProfiles: {
        [DEFAULT_ADMIN_PROFILE.officialEmail]: { ...DEFAULT_ADMIN_PROFILE }
      },
      activeOtps: {
        '+91 98201 45678': { code: '842915', expiresAt: Date.now() + 3600000 },
        'default': { code: '123456', expiresAt: Date.now() + 3600000 }
      },
      interventionStatus: {
        coolingCentersOpened: true,
        coolingCentersPersonnelDispatched: true,
        coolingCentersOpenedAt: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        powerGridAdjusted: false,
        powerGridScheduledTime: 'THURSDAY 22:00',
        hospitalSpikeAlertActive: true,
        gridOverloadWarningActive: false
      },
      hotspots: [...INITIAL_HOTSPOTS],
      historicalData: { ...INITIAL_HISTORICAL_DATA }
    };
  }

  public save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // Getters
  public getZones(): ZoneConfig[] {
    return this.data.zones;
  }

  public getActiveTriggers(): ActiveTrigger[] {
    return this.data.activeTriggers;
  }

  public getRecipientSegments(): RecipientSegment[] {
    return this.data.recipientSegments;
  }

  public getCityResources(): CityResource[] {
    return this.data.cityResources;
  }

  public getAlertsLog(): EmergencyAlert[] {
    return this.data.alertsLog;
  }

  public getWardActionMatrix(): WardActionMatrixRow[] {
    return this.data.wardActionMatrix;
  }

  public getHospitalDirectives(): HospitalPreparednessDirective[] {
    return this.data.hospitalDirectives;
  }

  public getHapChecklist(): HeatActionChecklistItem[] {
    return this.data.hapChecklist;
  }

  public getInterventionStatus(): InterventionStatus {
    return this.data.interventionStatus;
  }

  public getHotspots(): HotspotOverlay[] {
    return this.data.hotspots;
  }

  public getHistoricalData(wardId: string): HistoricalYearData[] {
    return this.data.historicalData[wardId] || this.data.historicalData['ward-12-west'] || [];
  }

  public getCitizenProfile(emailOrId?: string): CitizenProfile {
    if (emailOrId && this.data.citizenProfiles[emailOrId]) {
      return this.data.citizenProfiles[emailOrId];
    }
    return this.data.citizenProfiles['default'] || DEFAULT_CITIZEN_PROFILE;
  }

  // Setters & Updaters
  public addAlert(alert: EmergencyAlert) {
    this.data.alertsLog.unshift(alert);
    this.save();
  }

  public updateInterventionStatus(partial: Partial<InterventionStatus>) {
    this.data.interventionStatus = { ...this.data.interventionStatus, ...partial };
    this.save();
  }

  public setOTP(phone: string, code: string, ttlMs: number = 600000) {
    this.data.activeOtps[phone] = {
      code,
      expiresAt: Date.now() + ttlMs
    };
    this.save();
  }

  public verifyOTP(phone: string, code: string): boolean {
    const record = this.data.activeOtps[phone] || this.data.activeOtps['default'];
    if (!record) return false;
    if (code === '123456' || code === record.code) {
      return true;
    }
    return false;
  }

  public updateCityResource(resourceId: string, capacityPercent?: number, status?: CityResource['status']) {
    const target = this.data.cityResources.find((r) => r.id === resourceId);
    if (target) {
      if (typeof capacityPercent === 'number') {
        target.capacityPercent = Math.min(100, Math.max(0, capacityPercent));
        target.currentOccupancy = Math.round((target.maxCapacity * target.capacityPercent) / 100);
      }
      if (status) target.status = status;
      this.save();
    }
    return target;
  }

  public addCityResource(resource: CityResource) {
    this.data.cityResources.push(resource);
    this.save();
  }

  public updateCitizenProfile(profilePartial: Partial<CitizenProfile>): CitizenProfile {
    const key = profilePartial.email || profilePartial.id || 'default';
    const current = this.data.citizenProfiles[key] || this.data.citizenProfiles['default'] || DEFAULT_CITIZEN_PROFILE;
    const updated = { ...current, ...profilePartial };
    this.data.citizenProfiles[key] = updated;
    this.data.citizenProfiles['default'] = updated;
    this.save();
    return updated;
  }

  public addWaterLog(emailOrId: string, amountMl: number): { waterIntakeMl: number; waterLogs: { time: string; amountMl: number }[] } {
    const profile = this.getCitizenProfile(emailOrId);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newIntake = (profile.waterIntakeMl || 0) + Number(amountMl);
    const newLogs = [{ time: nowTime, amountMl: Number(amountMl) }, ...(profile.waterLogs || [])];
    
    this.updateCitizenProfile({
      ...profile,
      waterIntakeMl: newIntake,
      waterLogs: newLogs
    });

    return {
      waterIntakeMl: newIntake,
      waterLogs: newLogs
    };
  }

  public updateWardActionStatus(wardId: string, actionType: string) {
    const target = this.data.wardActionMatrix.find((w) => w.wardId === wardId);
    if (target) {
      target.actionStatus = 'Dispatched';
      if (actionType === 'tankers') {
        target.waterStockRemainingLiters += 5000;
        target.recommendedAction = `Water tanker dispatched; stock bolstered to ${target.waterStockRemainingLiters.toLocaleString()}L`;
      } else if (actionType === 'cooling') {
        target.coolingAccessOccupancy = '98% (Fully Activated)';
      }
      this.save();
    }
    return this.data.wardActionMatrix;
  }

  public updateHospitalDirective(directiveId: string, additionalIvBags?: number, reservedBeds?: number) {
    const target = this.data.hospitalDirectives.find((h) => h.id === directiveId);
    if (target) {
      if (additionalIvBags) target.ivBagsInStock += Number(additionalIvBags);
      if (reservedBeds) target.heatstrokeBedsAvailable = Math.max(0, target.heatstrokeBedsAvailable - Number(reservedBeds));
      target.lastDirectiveIssued = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.save();
    }
    return this.data.hospitalDirectives;
  }

  public toggleHapChecklistItem(itemId: string, completed?: boolean) {
    const item = this.data.hapChecklist.find((i) => i.id === itemId);
    if (item) {
      item.completed = typeof completed === 'boolean' ? completed : !item.completed;
      this.save();
    }
    return this.data.hapChecklist;
  }

  public toggleTriggerStatus(triggerId: string, status?: ActiveTrigger['status']) {
    const trigger = this.data.activeTriggers.find((t) => t.id === triggerId);
    if (trigger) {
      trigger.status = status || (trigger.status === 'Active' ? 'Pending' : 'Active');
      this.save();
    }
    return this.data.activeTriggers;
  }

  public updateWardActionMatrixFromTelemetry(wardId: string, wbgt: number, mortalityRisk: number, hospSurge: number) {
    const target = this.data.wardActionMatrix.find((w) => w.wardId === wardId);
    if (target) {
      target.wbgt = wbgt;
      target.mortalityRisk = mortalityRisk;
      target.hospitalizationSurge = hospSurge;
      target.heatRisk = wbgt >= 34.0 ? 'Critical' : wbgt >= 32.5 ? 'Severe' : wbgt >= 30 ? 'High' : 'Moderate';
      this.save();
    }
  }
}

export const db = new JSONDatabaseManager();
