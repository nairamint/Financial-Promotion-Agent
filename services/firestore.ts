
import { 
    PromotionDocument, 
    SubmissionDocument, 
    ControlTestDocument, 
    ApprovalDocument, 
    AuditTrailDocument, 
    ARValidationDocument,
    RiskRating,
    ComplianceStatus,
    AgentResult,
    ARProfile
} from '../types';

/**
 * MOCK FIRESTORE SERVICE
 * 
 * This service mimics the Google Cloud Firestore SDK.
 * It uses localStorage to persist data across refreshes, adhering to the 
 * schema defined in the architecture plan.
 */

const STORAGE_KEYS = {
    PROMOTIONS: 'complia_firestore_promotions',
    SUBMISSIONS: 'complia_firestore_submissions',
    CONTROL_TESTS: 'complia_firestore_control_tests',
    APPROVALS: 'complia_firestore_approvals',
    AUDIT_TRAILS: 'complia_firestore_audit_trails',
    AR_VALIDATIONS: 'complia_firestore_ar_validations',
    AR_PROFILES: 'complia_firestore_ar_profiles',
    WORKFLOW_CONFIG: 'complia_firestore_workflow_config'
};

// --- Helper Functions ---

const loadCollection = <T>(key: string): Record<string, T> => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error(`Error loading collection ${key}`, e);
        return {};
    }
};

const saveCollection = <T>(key: string, data: Record<string, T>) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving collection ${key}`, e);
    }
};

const getList = <T>(key: string): T[] => {
    const col = loadCollection<T>(key);
    return Object.values(col); // Firestore returns unsorted lists usually, we can sort later
};

const getDoc = <T>(key: string, id: string): T | null => {
    const col = loadCollection<T>(key);
    return col[id] || null;
};

const setDoc = <T extends { id: string }>(key: string, doc: T) => {
    const col = loadCollection<T>(key);
    col[doc.id] = doc;
    saveCollection(key, col);
};

// --- Seeding Data (To match Dashboard Mock) ---
const seedData = () => {
    // FIX: Clean up legacy invalid audit mocks if present to prevent tampering errors
    const existingAudits = localStorage.getItem(STORAGE_KEYS.AUDIT_TRAILS);
    if (existingAudits && existingAudits.includes('SHA-256:init...')) {
        console.log("Cleaning up invalid mock audit logs...");
        localStorage.removeItem(STORAGE_KEYS.AUDIT_TRAILS);
    }

    if (localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) return; // Already seeded

    console.log("Seeding Firestore with initial data...");

    // Seed Promotions
    const promotions: PromotionDocument[] = [
        { id: 'PROMO-001', title: 'Q1 Yield Factsheet', type: 'Factsheet', submission_date: '2023-10-23T09:00:00Z', status: 'Approved', ar_id: '712934', submitted_by: 'john.doe@firm.com', firm_id: 'FIRM_001', risk_rating: RiskRating.LOW, is_favorite: true, is_deleted: false, assigned_to: 'Paul Munson (SMF16)', sla_status: 'On Track' },
        { id: 'PROMO-002', title: 'Crypto Growth Deck', type: 'Presentation', submission_date: '2023-10-24T10:30:00Z', status: 'Rejected', ar_id: '123456', submitted_by: 'mike.ross@firm.com', firm_id: 'FIRM_001', risk_rating: RiskRating.CRITICAL, is_favorite: false, is_deleted: false, assigned_to: 'Julia Black (SMF9)', sla_status: 'Breached' },
        { id: 'PROMO-003', title: 'Pension Transfer Guide', type: 'Website', submission_date: '2023-10-25T14:15:00Z', status: 'Under Review', ar_id: '555555', submitted_by: 'sarah.j@firm.com', firm_id: 'FIRM_001', risk_rating: RiskRating.MEDIUM, is_favorite: false, is_deleted: false, assigned_to: 'Sarah Jenkins', sla_status: 'At Risk' },
        { id: 'PROMO-004', title: 'ESG Future Fund', type: 'Advertorial', submission_date: '2023-10-26T11:00:00Z', status: 'Ready for Review', ar_id: '712934', submitted_by: 'david.k@firm.com', firm_id: 'FIRM_001', risk_rating: RiskRating.HIGH, is_favorite: true, is_deleted: false, assigned_to: 'Paul Munson (SMF16)', sla_status: 'On Track' },
        { id: 'PROMO-005', title: 'Generic Market Update', type: 'Email', submission_date: '2023-10-27T08:45:00Z', status: 'Approved', ar_id: '712934', submitted_by: 'john.doe@firm.com', firm_id: 'FIRM_001', risk_rating: RiskRating.LOW, is_favorite: false, is_deleted: false, assigned_to: 'System', sla_status: 'On Track' }
    ];

    const promoMap: Record<string, PromotionDocument> = {};
    promotions.forEach(p => promoMap[p.id] = p);
    saveCollection(STORAGE_KEYS.PROMOTIONS, promoMap);

    // Seed Audit Trails
    const audits: AuditTrailDocument[] = [];
    const auditMap: Record<string, AuditTrailDocument> = {};
    audits.forEach(a => auditMap[a.id] = a);
    saveCollection(STORAGE_KEYS.AUDIT_TRAILS, auditMap);

    // Seed AR Profiles
    const arProfiles: ARProfile[] = [
        { 
            id: 'ar-001', name: 'Principal Investment Management Ltd', frn: '712934', 
            fcaStatus: { frn: '712934', firmName: 'Principal Investment Management Ltd', status: 'Authorised', statusEffectiveDate: '2020-01-01', timestamp: new Date().toISOString() },
            riskScore: 12, submissionsCount: 45, violationsCount: 0, lastAuditDate: '2023-11-15', primaryContact: 'Sarah Jenkins',
            revenue_ytd: 450000, complaints_ytd: 1
        },
        { 
            id: 'ar-002', name: 'RiskAdvisors LLP', frn: '123456', 
            fcaStatus: { frn: '123456', firmName: 'RiskAdvisors LLP', status: 'Suspended', statusEffectiveDate: '2023-12-01', timestamp: new Date().toISOString() },
            riskScore: 88, submissionsCount: 12, violationsCount: 5, lastAuditDate: '2023-10-01', primaryContact: 'Mike Ross',
            revenue_ytd: 120000, complaints_ytd: 8
        },
        { 
            id: 'ar-003', name: 'Crypto Futures Trading', frn: '888888', 
            fcaStatus: { frn: '888888', firmName: 'Crypto Futures Trading', status: 'De-authorised', statusEffectiveDate: '2023-09-15', timestamp: new Date().toISOString() },
            riskScore: 95, submissionsCount: 0, violationsCount: 8, lastAuditDate: '2023-08-01', primaryContact: 'Unknown',
            revenue_ytd: 0, complaints_ytd: 12
        },
        { 
            id: 'ar-004', name: 'Example Wealth Planning', frn: '555555', 
            fcaStatus: { frn: '555555', firmName: 'Example Wealth Planning', status: 'Appointed Representative', statusEffectiveDate: '2021-05-20', timestamp: new Date().toISOString() },
            riskScore: 25, submissionsCount: 30, violationsCount: 1, lastAuditDate: '2023-12-10', primaryContact: 'David Kim',
            revenue_ytd: 280000, complaints_ytd: 0
        },
    ];
    const arMap: Record<string, ARProfile> = {};
    arProfiles.forEach(p => arMap[p.id] = p);
    saveCollection(STORAGE_KEYS.AR_PROFILES, arMap);

    // Seed Workflow Config (Default)
    if (!localStorage.getItem(STORAGE_KEYS.WORKFLOW_CONFIG)) {
        localStorage.setItem(STORAGE_KEYS.WORKFLOW_CONFIG, JSON.stringify([]));
    }
};


// --- Service Class ---

export const FirestoreService = {
    initialize: () => {
        seedData();
    },

    promotions: {
        list: () => getList<PromotionDocument>(STORAGE_KEYS.PROMOTIONS).sort((a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()),
        get: (id: string) => getDoc<PromotionDocument>(STORAGE_KEYS.PROMOTIONS, id),
        create: (doc: PromotionDocument) => {
            // Ensure defaults
            doc.is_favorite = doc.is_favorite || false;
            doc.is_deleted = doc.is_deleted || false;
            // Default Assignment
            doc.assigned_to = doc.assigned_to || "Unassigned";
            doc.sla_status = doc.sla_status || "On Track";
            setDoc(STORAGE_KEYS.PROMOTIONS, doc)
        },
        updateStatus: (id: string, status: PromotionDocument['status']) => {
            const doc = getDoc<PromotionDocument>(STORAGE_KEYS.PROMOTIONS, id);
            if (doc) {
                doc.status = status;
                setDoc(STORAGE_KEYS.PROMOTIONS, doc);
            }
        },
        toggleFavorite: (id: string) => {
            const doc = getDoc<PromotionDocument>(STORAGE_KEYS.PROMOTIONS, id);
            if (doc) {
                doc.is_favorite = !doc.is_favorite;
                setDoc(STORAGE_KEYS.PROMOTIONS, doc);
            }
        },
        softDelete: (id: string) => {
            const doc = getDoc<PromotionDocument>(STORAGE_KEYS.PROMOTIONS, id);
            if (doc) {
                doc.is_deleted = true;
                setDoc(STORAGE_KEYS.PROMOTIONS, doc);
                // Log Audit
                const auditEntry: AuditTrailDocument = {
                    id: `LOG-DEL-${Date.now()}`,
                    sequence_number: Date.now(),
                    payload_snapshot: JSON.stringify({ action: 'soft_delete' }),
                    promotion_id: id,
                    action: 'DOCUMENT_DELETED',
                    actor: 'User',
                    timestamp: new Date().toISOString(),
                    hash: `SHA-256:${Date.now()}`, 
                    previous_hash: '...'
                };
                FirestoreService.auditTrails.log(auditEntry);
            }
        },
        restore: (id: string) => {
            const doc = getDoc<PromotionDocument>(STORAGE_KEYS.PROMOTIONS, id);
            if (doc) {
                doc.is_deleted = false;
                setDoc(STORAGE_KEYS.PROMOTIONS, doc);
                // Log Audit
                const auditEntry: AuditTrailDocument = {
                    id: `LOG-RES-${Date.now()}`,
                    sequence_number: Date.now(),
                    payload_snapshot: JSON.stringify({ action: 'restore' }),
                    promotion_id: id,
                    action: 'DOCUMENT_RESTORED',
                    actor: 'User',
                    timestamp: new Date().toISOString(),
                    hash: `SHA-256:${Date.now()}`,
                    previous_hash: '...'
                };
                FirestoreService.auditTrails.log(auditEntry);
            }
        },
        permanentDelete: (id: string) => {
            const col = loadCollection<PromotionDocument>(STORAGE_KEYS.PROMOTIONS);
            delete col[id];
            saveCollection(STORAGE_KEYS.PROMOTIONS, col);
        }
    },

    controlTests: {
        save: (doc: ControlTestDocument & { full_text?: string }) => setDoc(STORAGE_KEYS.CONTROL_TESTS, doc),
        get: (id: string) => getDoc<ControlTestDocument & { full_text?: string }>(STORAGE_KEYS.CONTROL_TESTS, id)
    },

    approvals: {
        save: (doc: ApprovalDocument) => setDoc(STORAGE_KEYS.APPROVALS, doc),
        get: (id: string) => getDoc<ApprovalDocument>(STORAGE_KEYS.APPROVALS, id),
        // Helper to find approval by promotion ID
        getByPromotionId: (promoId: string) => getList<ApprovalDocument>(STORAGE_KEYS.APPROVALS).find(a => a.promotion_id === promoId)
    },

    auditTrails: {
        log: (entry: AuditTrailDocument) => setDoc(STORAGE_KEYS.AUDIT_TRAILS, entry),
        list: () => getList<AuditTrailDocument>(STORAGE_KEYS.AUDIT_TRAILS).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    },

    arValidations: {
        log: (entry: ARValidationDocument) => setDoc(STORAGE_KEYS.AR_VALIDATIONS, entry),
        list: () => getList<ARValidationDocument>(STORAGE_KEYS.AR_VALIDATIONS)
    },

    arProfiles: {
        list: () => getList<ARProfile>(STORAGE_KEYS.AR_PROFILES),
        save: (profile: ARProfile) => setDoc(STORAGE_KEYS.AR_PROFILES, profile)
    },

    workflowConfig: {
        get: () => {
            const data = localStorage.getItem(STORAGE_KEYS.WORKFLOW_CONFIG);
            return data && data !== '[]' ? JSON.parse(data) : null;
        },
        save: (config: any[]) => localStorage.setItem(STORAGE_KEYS.WORKFLOW_CONFIG, JSON.stringify(config))
    },
    
    // Analytics Helpers for Dashboard
    analytics: {
        getExecutiveDashboardStats: () => {
             const promos = getList<PromotionDocument>(STORAGE_KEYS.PROMOTIONS);
             const ars = getList<ARProfile>(STORAGE_KEYS.AR_PROFILES);
             
             // 1. KPI Calculation
             const total = promos.length;
             const pending = promos.filter(p => (p.status === 'Ready for Review' || p.status === 'Under Review') && !p.is_deleted).length;
             const rejected = promos.filter(p => p.status === 'Rejected' && !p.is_deleted).length;
             const approved = promos.filter(p => (p.status === 'Approved' || p.status === 'Locked') && !p.is_deleted).length;
             const critical = promos.filter(p => p.risk_rating === RiskRating.CRITICAL && !p.is_deleted).length;
             const highRisk = promos.filter(p => p.risk_rating === RiskRating.HIGH && !p.is_deleted).length;
             
             // 2. SM&CR Pending (Mock logic: anything High Risk + Pending needs SMF signoff)
             const pendingSMCR = promos.filter(p => p.risk_rating === RiskRating.HIGH && (p.status === 'Ready for Review' || p.status === 'Under Review')).length;
             
             // 3. AR Health
             const highRiskARs = ars.filter(ar => ar.riskScore > 75).length;
             const totalARs = ars.length;

             // 4. SLA Logic
             const slaBreaches = promos.filter(p => p.sla_status === 'Breached' && !p.is_deleted).length;
             const slaAtRisk = promos.filter(p => p.sla_status === 'At Risk' && !p.is_deleted).length;

             // 5. Trend Data (Mock 7 day)
             const trendData = [
                { name: 'Mon', risk: 2, compliance: 95 },
                { name: 'Tue', risk: 5, compliance: 88 },
                { name: 'Wed', risk: 3, compliance: 92 },
                { name: 'Thu', risk: 8, compliance: 85 }, // Breach Event
                { name: 'Fri', risk: 4, compliance: 90 },
                { name: 'Sat', risk: 1, compliance: 98 },
                { name: 'Sun', risk: 0, compliance: 100 },
             ];
             
             return {
                 total, pending, rejected, approved, critical, highRisk,
                 pendingSMCR, highRiskARs, totalARs,
                 slaBreaches, slaAtRisk,
                 trendData
             };
        },
        getStats: () => {
            const promos = getList<PromotionDocument>(STORAGE_KEYS.PROMOTIONS);
            const total = promos.length;
            const pending = promos.filter(p => (p.status === 'Ready for Review' || p.status === 'Under Review') && !p.is_deleted).length;
            const rejected = promos.filter(p => p.status === 'Rejected' && !p.is_deleted).length;
            const approved = promos.filter(p => (p.status === 'Approved' || p.status === 'Locked') && !p.is_deleted).length;
            
            // Last 5 days activity
            const last5Days = [...Array(5)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (4 - i));
                const dateStr = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                
                const dayPromos = promos.filter(p => p.submission_date.startsWith(dateStr) && !p.is_deleted);
                return {
                    name: dayName,
                    approved: dayPromos.filter(p => p.status === 'Approved').length,
                    rejected: dayPromos.filter(p => p.status === 'Rejected').length,
                    referred: dayPromos.filter(p => p.status === 'Under Review').length + Math.floor(Math.random() * 2) // smooth out graph
                };
            });

            return { total, pending, rejected, approved, last5Days };
        },
        getRecentFailures: () => {
             const promos = getList<PromotionDocument>(STORAGE_KEYS.PROMOTIONS);
             return promos
                .filter(p => (p.risk_rating === RiskRating.HIGH || p.risk_rating === RiskRating.CRITICAL) && !p.is_deleted)
                .sort((a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime())
                .slice(0, 5);
        },
        // For Reports Page
        getVolumeByType: () => {
            const promos = getList<PromotionDocument>(STORAGE_KEYS.PROMOTIONS).filter(p => !p.is_deleted);
            const types = {} as Record<string, number>;
            promos.forEach(p => {
                types[p.type] = (types[p.type] || 0) + 1;
            });
            return Object.entries(types).map(([name, value]) => ({ name, value }));
        }
    }
};

// Initialize on file load
FirestoreService.initialize();
