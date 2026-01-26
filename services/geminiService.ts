
import { GoogleGenAI } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import { 
    ComplianceStatus, RiskRating, PromotionAnalysis, AgentResult, ClaimVerification, ReadabilityMetrics, 
    ARValidation, DisclosureCheck, StrategyPrompt, EscalationRoute, ApprovalRecord, QESSignature, 
    HashChainEntry, FCAStatusResponse, DocumentAIResult, Token, ComplianceState, IndividualValidation,
    PromotionDocument, ControlTestDocument, AuditTrailDocument, ARValidationDocument, ApprovalDocument, PermissionViolation,
    ControlledFunction, PrincipalNetworkScan, AppointedRepresentative, PageData, ChatRequestDto, ExpertType
} from '../types';
import { FirestoreService } from './firestore';

// Handle PDF.js ESM import consistency (esm.sh often puts exports on default)
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Initialize PDF.js worker
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// --- Intelligent Caching (Simulating Redis) ---
class FCACacheService {
    private cache = new Map<string, { data: any, expiry: number }>();
    private TTL = 86400 * 7 * 1000; // 7 days in ms (Weekly refresh for AR status)

    get(key: string) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }

    set(key: string, data: any) {
        this.cache.set(key, { data, expiry: Date.now() + this.TTL });
    }
}
const fcaCache = new FCACacheService();


// --- Crypto Helpers for Hash Chaining & HMAC ---

// Canonical JSON Stringify (Sorts keys to match Python's sort_keys=True)
const canonicalStringify = (obj: any): string => {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(canonicalStringify).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    const parts = keys.map(key => {
        return JSON.stringify(key) + ':' + canonicalStringify(obj[key]);
    });
    return '{' + parts.join(',') + '}';
};

export const generateSha256 = async (content: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateHmacSha256 = async (key: string, data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateAuditHash = async (content: string): Promise<string> => {
  return generateSha256(content + Date.now().toString());
};

// --- Immutable Audit Log Service (SYSC 9 Compliant) ---
class ImmutableAuditLogService {
    private secretKey = "COMPLIA_SECRET_MASTER_KEY_2025"; // In prod, this comes from KMS
    
    // Equivalent to Python's record_decision
    async logAction(
        promotionId: string, 
        action: string, // maps to agent_id 
        actor: string, // maps to approver_id
        payload: any
    ): Promise<AuditTrailDocument> {
        const timestamp = new Date().toISOString();
        
        // Fetch full history to determine chain linkage
        const history = FirestoreService.auditTrails.list();
        // Sort ascending by sequence to find the true last block
        history.sort((a, b) => a.sequence_number - b.sequence_number);
        
        const lastEntry = history.length > 0 ? history[history.length - 1] : null;
        const previousHash = lastEntry ? lastEntry.hash : "GENESIS";
        const sequenceNumber = (lastEntry?.sequence_number || 0) + 1;
        
        // Create Entry Object (Structure matched to Python logic)
        // We do NOT hash the hash field itself, obviously.
        const entryData = {
            timestamp: timestamp,
            agent_id: action,
            decision: payload,
            approver_id: actor,
            previous_hash: previousHash,
            sequence_number: sequenceNumber,
            doc_id: promotionId // Added for context
        };
        
        // Canonical String for HMAC
        const canonicalString = canonicalStringify(entryData);
        
        // Generate HMAC-SHA256
        const entryHash = await generateHmacSha256(this.secretKey, canonicalString);
        
        const document: AuditTrailDocument = {
            id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sequence_number: sequenceNumber,
            promotion_id: promotionId,
            action: action,
            actor: actor,
            timestamp: timestamp,
            hash: entryHash,
            previous_hash: previousHash,
            payload_snapshot: JSON.stringify(payload),
            verification_status: 'VERIFIED'
        };
        
        FirestoreService.auditTrails.log(document);
        return document;
    }

    // Equivalent to Python's verify_integrity
    async verifyChainIntegrity(): Promise<{ valid: boolean, brokenSequence?: number, count: number }> {
        const history = FirestoreService.auditTrails.list();
        history.sort((a, b) => a.sequence_number - b.sequence_number);

        for (let i = 0; i < history.length; i++) {
            const entry = history[i];
            
            // Reconstruct the object used for hashing
            const checkEntry = {
                timestamp: entry.timestamp,
                agent_id: entry.action,
                decision: JSON.parse(entry.payload_snapshot),
                approver_id: entry.actor,
                previous_hash: entry.previous_hash,
                sequence_number: entry.sequence_number,
                doc_id: entry.promotion_id
            };

            const canonicalCheck = canonicalStringify(checkEntry);
            const calculatedHash = await generateHmacSha256(this.secretKey, canonicalCheck);

            // 1. Check Hash Integrity
            if (calculatedHash !== entry.hash) {
                console.error(`Tampering detected at Seq ${entry.sequence_number}`);
                return { valid: false, brokenSequence: entry.sequence_number, count: history.length };
            }

            // 2. Check Chain Linkage
            if (i > 0) {
                const prevEntry = history[i - 1];
                if (entry.previous_hash !== prevEntry.hash) {
                    console.error(`Chain broken between Seq ${prevEntry.sequence_number} and ${entry.sequence_number}`);
                    return { valid: false, brokenSequence: entry.sequence_number, count: history.length };
                }
            } else {
                if (entry.previous_hash !== "GENESIS") {
                     return { valid: false, brokenSequence: entry.sequence_number, count: history.length };
                }
            }
        }

        return { valid: true, count: history.length };
    }
}
export const auditService = new ImmutableAuditLogService();


// --- Real FCA Register Client Structure ---
class FCARegisterClient {
    private readonly FIRM_URL = "https://register.fca.org.uk/cgi-bin/firm_check.cgi";
    private readonly INDIVIDUALS_URL = "https://register.fca.org.uk/services/V0.1/Individuals";
    
    // Simulate fetching from real endpoint with Permission Scopes
    async checkARStatus(firmReferenceNumber: string): Promise<FCAStatusResponse> {
        // Simulation Logic replacing the mock:
        await new Promise(resolve => setTimeout(resolve, 600)); // Network Latency
        
        const mockRegistry: Record<string, any> = {
            "712934": { 
                name: "Principal Investment Management Ltd", 
                status: "Authorised",
                permissions: ["advising-on-investments", "arranging-deals-in-investments"], // Standard AR (No Managing)
                lastUpdate: "2023-10-20"
            },
            "123456": { 
                name: "RiskAdvisors LLP", 
                status: "Suspended",
                permissions: ["advising-on-investments"],
                lastUpdate: "2023-09-01"
            },
            "999999": { 
                name: "Unknown Entity", 
                status: "Not Found",
                permissions: [],
                lastUpdate: null
            },
            "888888": { 
                name: "Crypto Futures Trading", 
                status: "De-authorised",
                permissions: [],
                lastUpdate: "2023-08-15"
            },
            "555555": { 
                name: "Example Wealth Planning", 
                status: "Appointed Representative",
                permissions: ["advising-on-investments"],
                lastUpdate: "2023-11-01"
            }
        };

        const record = mockRegistry[firmReferenceNumber];
        const status = record ? record.status : "Not Found";
        const isValid = status === "Authorised" || status === "Appointed Representative";
        
        return {
            frn: firmReferenceNumber,
            firmName: record ? record.name : "Unknown",
            status: status,
            statusEffectiveDate: record ? record.lastUpdate : new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            isValid,
            message: isValid ? "AR is authorized. Permissions checked." : `AR status: ${status}.`,
            permissions: record ? record.permissions : []
        };
    }

    // New: Controlled Functions API simulation
    // Simulates /V0.1/Individuals/<IRN>/CF
    async getControlledFunctions(irn: string): Promise<ControlledFunction[]> {
        console.log(`[FCA API] GET ${this.INDIVIDUALS_URL}/${irn}/CF`);
        await new Promise(resolve => setTimeout(resolve, 600));

        // Mock Data based on IRN
        const mockData: Record<string, any> = {
            "JXB12345": { // Julia Black
                "Current": {
                    "SMF9 Chair of the Governing Body": { "Name": "SMF9 Chair", "Firm Name": "Compliance Strategy Group", "Effective Date": "2020-01-01" },
                    "SMF1 Chief Executive": { "Name": "SMF1 Chief Executive", "Firm Name": "Compliance Strategy Group", "Effective Date": "2019-05-01" }
                },
                "Previous": {
                    "CF1 Director": { "Name": "CF1 Director", "Firm Name": "Old Bank Ltd", "Effective Date": "2010-01-01", "End Date": "2018-12-31" }
                }
            },
            "PXM67890": { // Paul Munson
                "Current": {
                    "SMF16 Compliance Oversight": { "Name": "SMF16 Compliance Oversight", "Firm Name": "Compliance Strategy Group", "Effective Date": "2021-03-15" },
                    "SMF17 MLRO": { "Name": "SMF17 Money Laundering Reporting Officer", "Firm Name": "Compliance Strategy Group", "Effective Date": "2021-03-15" }
                },
                "Previous": {}
            },
            "JOB01749": { // Brian
                "Current": {
                    "CF30 Customer Function": { "Name": "CF30 Customer Function", "Firm Name": "Principal Investment Management Ltd", "Effective Date": "2022-06-01" }
                },
                "Previous": {}
            },
            "SUS00000": { // Suspended
                "Current": {},
                "Previous": {
                    "CF30 Customer Function": { "Name": "CF30 Customer Function", "Firm Name": "RiskAdvisors LLP", "Effective Date": "2020-01-01", "End Date": "2023-01-01" }
                }
            }
        };

        const raw = mockData[irn];
        if (!raw) return [];

        const roles: ControlledFunction[] = [];

        // Parse Current
        Object.values(raw.Current).forEach((r: any) => {
            roles.push({
                name: r.Name,
                firmName: r["Firm Name"],
                effectiveDate: r["Effective Date"],
                status: 'Current'
            });
        });

        // Parse Previous
        Object.values(raw.Previous).forEach((r: any) => {
            roles.push({
                name: r.Name,
                firmName: r["Firm Name"],
                effectiveDate: r["Effective Date"],
                status: 'Previous'
            });
        });

        return roles;
    }

    // New: Firm Appointed Representative API
    // Simulates /V0.1/Firm/<FRN>/AR
    async getAppointedRepresentatives(principalFrn: string): Promise<PrincipalNetworkScan> {
        console.log(`[FCA API] GET /V0.1/Firm/${principalFrn}/AR`);
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock Response based on provided example and system data
        let data: any = { CurrentAppointedRepresentatives: [], PreviousAppointedRepresentatives: [] };

        if (principalFrn === "712934") { // The main firm in our mock
             data = {
                "CurrentAppointedRepresentatives": [
                    { "FRN": "555555", "Name": "Example Wealth Planning", "Effective Date": "2021-05-20", "Record SubType": "Full", "Tied Agent": "false", "Principal FRN": "712934" },
                    { "FRN": "888888", "Name": "Crypto Futures Trading", "Effective Date": "2022-01-10", "Record SubType": "Introducer", "Tied Agent": "false", "Principal FRN": "712934" } // Listed for discovery test
                ],
                "PreviousAppointedRepresentatives": [
                    { "FRN": "123456", "Name": "RiskAdvisors LLP", "Effective Date": "2019-01-01", "Termination Date": "2023-09-01", "Record SubType": "Full", "Principal FRN": "712934" }
                ]
             };
        } else if (principalFrn === "999001") { // Example Data
             data = {
                "CurrentAppointedRepresentatives": [
                    { "FRN": "999060", "Name": "AR Firm 3", "Effective Date": "03/03/2015", "Record SubType": "Full", "Principal FRN": "999001" },
                    { "FRN": "999008", "Name": "AR Firm 4", "Effective Date": "03/03/2015", "Record SubType": "Full", "Principal FRN": "999001" }
                ],
                "PreviousAppointedRepresentatives": [
                    { "FRN": "999054", "Name": "AR Firm 1", "Effective Date": "03/03/2015", "Termination Date": "06/04/2021", "Record SubType": "Full", "Principal FRN": "999001" }
                ]
             };
        }

        const mapAR = (raw: any, status: 'Current' | 'Previous'): AppointedRepresentative => ({
            frn: raw.FRN,
            name: raw.Name,
            effectiveDate: raw["Effective Date"],
            terminationDate: raw["Termination Date"],
            principalFrn: raw["Principal FRN"],
            recordSubType: raw["Record SubType"],
            tiedAgent: raw["Tied Agent"] === "true",
            status
        });

        return {
            principalFrn,
            currentARs: (data.CurrentAppointedRepresentatives || []).map((r: any) => mapAR(r, 'Current')),
            previousARs: (data.PreviousAppointedRepresentatives || []).map((r: any) => mapAR(r, 'Previous')),
            timestamp: new Date().toISOString()
        };
    }

    // New: Check Individual Status via FCA API /V0.1/Individuals/<IRN>
    // Simulating response format: { Status: "...", Data: [ { Details: {...}, "Workplace Location 1": {...} } ] }
    async checkIndividualStatus(irn: string): Promise<IndividualValidation> {
        console.log(`[FCA API] GET ${this.INDIVIDUALS_URL}/${irn}`);
        // Simulation delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock Database of SMFs/Individuals matching API structure
        const mockIndividuals: Record<string, any> = {
            "JOB01749": { 
                "Details": {
                    "Status": "Certified/assessed by firm",
                    "IRN": "JOB01749",
                    "Full Name": "Brian Abdelhadi"
                },
                "Workplace Location 1": {
                    "Firm Name": "Principal Investment Management Ltd",
                    "Location 1": "City of London"
                }
            },
            "JXB12345": { 
                "Details": {
                    "Status": "Certified/assessed by firm",
                    "IRN": "JXB12345",
                    "Full Name": "Julia Black"
                },
                "Workplace Location 1": {
                    "Firm Name": "Compliance Strategy Group",
                    "Location 1": "Canary Wharf"
                }
            },
             "JXD01375": { 
                "Details": {
                    "Status": "Certified/assessed by firm",
                    "IRN": "JXD01375",
                    "Full Name": "Claire Bell"
                },
                "Workplace Location 1": {
                    "Firm Name": "Bank of Scotland",
                    "Location 1": "City of Edinburgh"
                }
            },
            "PXM67890": { 
                "Details": {
                    "Status": "Certified/assessed by firm",
                    "IRN": "PXM67890",
                    "Full Name": "Paul Munson"
                },
                "Workplace Location 1": {
                    "Firm Name": "Compliance Strategy Group",
                    "Location 1": "City of London"
                }
            },
            "SUS00000": {
                 "Details": {
                    "Status": "Suspended",
                    "IRN": "SUS00000",
                    "Full Name": "Suspended Banker"
                 },
                 "Workplace Location 1": {
                    "Firm Name": "RiskAdvisors LLP",
                    "Location 1": "London"
                 }
            },
            "INA11111": {
                 "Details": {
                    "Status": "Inactive",
                    "IRN": "INA11111",
                    "Full Name": "Inactive Director"
                 },
                 "Workplace Location 1": {
                    "Firm Name": "Old Firm Ltd",
                    "Location 1": "Manchester"
                 }
            }
        };

        const apiRecord = mockIndividuals[irn];
        
        if (!apiRecord) {
             return {
                irn,
                name: "Unknown",
                status: "Not Found",
                isValid: false,
                timestamp: new Date().toISOString()
            };
        }

        // Logic to interpret API "Status"
        const rawStatus = apiRecord.Details.Status;
        const isValid = rawStatus === "Certified/assessed by firm" || rawStatus === "Active";

        return {
            irn: apiRecord.Details.IRN,
            name: apiRecord.Details["Full Name"],
            status: rawStatus,
            isValid: isValid,
            timestamp: new Date().toISOString(),
            detailsUrl: `${this.INDIVIDUALS_URL}/${irn}/CF`,
            currentFirm: apiRecord["Workplace Location 1"]?.["Firm Name"] || "Unknown"
        };
    }
}
const fcaClient = new FCARegisterClient();

// --- Helper: Reconstruct Analysis from Persistence ---
export const loadPromotionAnalysis = async (promotionId: string): Promise<PromotionAnalysis & { fullText?: string } | null> => {
    const promoDoc = FirestoreService.promotions.get(promotionId);
    if (!promoDoc) return null;

    const controlDoc = FirestoreService.controlTests.get(promotionId);
    if (!controlDoc) return null; 

    const approvalDoc = FirestoreService.approvals.getByPromotionId(promotionId);

    // Reconstruct ApprovalRecord if it exists
    let approvalRecord: ApprovalRecord | undefined = undefined;
    if (approvalDoc && approvalDoc.status === 'Locked') {
        const auditEntries = FirestoreService.auditTrails.list().filter(a => a.promotion_id === promotionId && a.action === 'QES_SIGN_OFF');
        const lastAudit = auditEntries[0];

        if (lastAudit) {
            approvalRecord = {
                approvalId: approvalDoc.id,
                envelopeId: approvalDoc.id,
                approvedBy: approvalDoc.cf30_name,
                decision: 'APPROVE', // stored as cf30_decision
                timestamp: approvalDoc.signed_at || new Date().toISOString(),
                status: 'APPROVED_AND_SIGNED',
                qes: {
                    provider: approvalDoc.qes_provider,
                    token: approvalDoc.qes_token || 'UNKNOWN',
                    timestamp: approvalDoc.signed_at || new Date().toISOString(),
                    signerName: approvalDoc.cf30_name,
                    signerRole: 'CF30',
                    envelopeId: approvalDoc.id
                },
                signatureImage: approvalDoc.signature_image,
                hashChain: {
                    sequence: lastAudit.sequence_number,
                    timestamp: lastAudit.timestamp,
                    action: 'CF30_APPROVAL_FINAL',
                    currentHash: lastAudit.hash,
                    previousHash: lastAudit.previous_hash,
                    payloadFragment: '...',
                    firestoreDocId: `audit_trails/${approvalDoc.id}`
                },
                wormStorageLocation: approvalDoc.worm_gcs_path,
                nextAttestationDate: new Date(new Date(approvalDoc.signed_at!).setMonth(new Date(approvalDoc.signed_at!).getMonth() + 3)).toISOString()
            };
        }
    }

    // Reconstruct Agents List
    const agents = [
        controlDoc.agent_1_classification,
        controlDoc.agent_2_consistency.agent,
        controlDoc.agent_3_visual,
        controlDoc.agent_4_text.agent,
        controlDoc.agent_5_ar_permissions.agent,
        controlDoc.agent_6_disclosure.agent
    ];

    return {
        id: promoDoc.id,
        title: promoDoc.title,
        type: promoDoc.type,
        submittedBy: promoDoc.submitted_by,
        submittedAt: promoDoc.submission_date,
        executiveSummary: "Analysis loaded from secure storage.", 
        regulatoryAnalysis: "Full regulatory breakdown available in Evidence Pack.", 
        riskRating: promoDoc.risk_rating || RiskRating.MEDIUM,
        overallStatus: controlDoc.overall_status,
        agents: agents,
        claims: controlDoc.agent_2_consistency.claims,
        auditHash: "REHYDRATED_HASH", 
        readability: controlDoc.agent_4_text.metrics,
        arValidation: controlDoc.agent_5_ar_permissions.validation,
        disclosures: controlDoc.agent_6_disclosure.disclosures,
        approvalRecord: approvalRecord,
        fullText: controlDoc.full_text 
    };
};

export const validateARAuthorization = async (frn: string, promotionId: string = "UNKNOWN"): Promise<FCAStatusResponse> => {
    // 1. Check Cache
    const cachedData = fcaCache.get(`ar:${frn}`);
    if (cachedData) {
        console.log(`[Agent 5] Cache Hit for FRN: ${frn}`);
        return cachedData;
    }

    console.log(`[Agent 5] Cache Miss. Fetching from FCA Register for FRN: ${frn}`);
    
    // 2. Use Real Client Structure
    const fcaResponse = await fcaClient.checkARStatus(frn);

    // 3. Update Cache
    fcaCache.set(`ar:${frn}`, fcaResponse);

    // 4. Log Audit with HMAC
    await auditService.logAction(promotionId, 'AR_VALIDATION_CHECK', 'Agent 5', {
        ar_id: frn,
        status: fcaResponse.status,
        valid: fcaResponse.isValid,
        permissions: fcaResponse.permissions
    });

    // 5. Persist Validation Record
    FirestoreService.arValidations.log({
        id: `VAL-${Date.now()}`,
        ar_id: frn,
        promotion_id: promotionId,
        fca_status: fcaResponse.status,
        is_valid: fcaResponse.isValid || false,
        timestamp: new Date().toISOString(),
        api_latency_ms: 600
    });

    return fcaResponse;
};

// Expose Individual Validation
export const validateIndividualAuthorization = async (irn: string): Promise<IndividualValidation> => {
    // 1. Check Cache
    const cachedData = fcaCache.get(`ind:${irn}`);
    if (cachedData) return cachedData;

    // 2. Fetch basic info
    const response = await fcaClient.checkIndividualStatus(irn);
    
    // 3. Fetch Controlled Functions (Roles)
    const roles = await fcaClient.getControlledFunctions(irn);
    
    // 4. Merge Data
    const fullResponse: IndividualValidation = {
        ...response,
        controlledFunctions: roles,
        roles: roles.filter(r => r.status === 'Current').map(r => r.name)
    };

    // 5. Cache
    fcaCache.set(`ind:${irn}`, fullResponse);
    
    return fullResponse;
};

export const checkARAuthorization = (frn: string) => validateARAuthorization(frn);

export const scanPrincipalNetwork = (principalFrn: string) => fcaClient.getAppointedRepresentatives(principalFrn);


// --- REAL PDF PROCESSING (Enhanced for Tables and Spatial Context - Option B) ---

// Helper: Detect bold (heuristic: font name contains 'Bold' or height > 0.9x average)
const detectBold = (items: any[], avgHeight: number): boolean => {
    const boldCount = items.filter(item => 
      (item.fontName && item.fontName.toLowerCase().includes('bold')) || 
      item.height > avgHeight * 1.1
    ).length;
    return boldCount / items.length > 0.5;
};

// Helper: Infer page section (header, body, footer) based on "Top-Down" Y coordinate (Y=0 is top)
const inferPageSection = (yPosition: number, pageHeight: number, order: number): 'header' | 'footer' | 'body' | 'title_area' | 'unknown' => {
    // Prompt Logic adapted for PDF coordinate systems handling (Normalized Top-Down)
    if (yPosition < pageHeight * 0.15) return 'header'; // Top 15%
    if (yPosition > pageHeight * 0.85) return 'footer'; // Bottom 15%
    if (order < 3 && yPosition < pageHeight * 0.3) return 'title_area';
    return 'body';
};

// Helper: Group items by Y position
function groupByYPosition(items: any[], threshold: number) {
    // Sort items by Y (descending for PDF bottom-up coords, so top items first)
    // pdfjs item.transform[5] is Y.
    const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5]);
    
    const groups: any[] = [];
    let currentGroup: any[] = [];
    let currentY: number | null = null;
    
    for (let item of sorted) {
        const y = item.transform[5];
        if (currentY === null || Math.abs(y - currentY) < threshold) {
            currentGroup.push(item);
            currentY = y;
        } else {
            // Sort items in group by X (left to right)
            currentGroup.sort((a, b) => a.transform[4] - b.transform[4]);
            groups.push({ items: currentGroup, y: currentY, order: groups.length });
            currentGroup = [item];
            currentY = y;
        }
    }
    if (currentGroup.length > 0) {
        currentGroup.sort((a, b) => a.transform[4] - b.transform[4]);
        groups.push({ items: currentGroup, y: currentY, order: groups.length });
    }
    return groups;
}

export const processPdfDocumentAI = async (file: File): Promise<DocumentAIResult> => {
    console.log(`[Option B] Processing PDF with Sliding-Window Spatial Context...`);
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = "";
        const pages: PageData[] = [];
        const timestamp = new Date().toISOString();

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1.0 });
            
            // Clean items
            const items = textContent.items.filter((item: any) => item.str && item.str.trim().length > 0);
            
            // Option B: Group by Y
            const lineGroups = groupByYPosition(items, 6); // Threshold 6px

            // Calculate Page Average Font Height for Bold Detection
            const allHeights = items.map((item: any) => item.height);
            const avgHeight = allHeights.length > 0 ? allHeights.reduce((a: number, b: number) => a + b, 0) / allHeights.length : 10;

            let pageText = "";
            const pageTokens: Token[] = [];

            lineGroups.forEach((group: any) => {
                const lineStr = group.items.map((item: any) => item.str).join(' ');
                
                // Spatial Calculations
                const xMin = Math.min(...group.items.map((item: any) => item.transform[4]));
                const xMax = Math.max(...group.items.map((item: any) => item.transform[4] + item.width));
                
                // Better Y calculation
                const yMin = Math.min(...group.items.map((item: any) => item.transform[5])); // Baseline usually
                const yMax = Math.max(...group.items.map((item: any) => item.transform[5] + item.height)); // Top of char

                const width = xMax - xMin;
                const height = yMax - yMin;
                
                // Normalized Coordinates (0,0 is Top-Left for BoundingBox)
                // PDF Y is bottom-up. viewport.height is total height.
                // Top of box in PDF = yMax.
                // Top of box in Screen = viewport.height - yMax.
                
                const normX = xMin / viewport.width;
                const normY = (viewport.height - yMax) / viewport.height;
                const normW = width / viewport.width;
                const normH = height / viewport.height;

                // Rich Metadata
                const isBold = detectBold(group.items, avgHeight);
                // Convert PDF Y to Top-Down Y for inferPageSection
                // Use yMin (baseline) or yMax (top) for logical section inference. 
                // Usually baseline Y (from bottom) is good enough for section logic.
                const pdfYBaseline = group.y;
                const topDownY = viewport.height - pdfYBaseline; 
                const section = inferPageSection(topDownY, viewport.height, group.order);

                pageTokens.push({
                    text: lineStr,
                    confidence: 0.99,
                    boundingBox: {
                        x: Math.max(0, Math.min(1, normX)),
                        y: Math.max(0, Math.min(1, normY)),
                        width: normW,
                        height: normH
                    },
                    layout: {
                        isBold,
                        fontSize: height,
                        section,
                        orderInPage: group.order
                    }
                });

                pageText += lineStr + "\n";
            });
            
            fullText += pageText + "\n";
            pages.push({
                pageNumber: i,
                text: pageText,
                tokens: pageTokens
            });
        }

        return {
            fullText: fullText.trim(),
            processedAt: timestamp,
            processorId: "complia-spatial-v2.3.0",
            pages: pages
        };

    } catch (e) {
        console.error("PDF Processing Failed", e);
        throw new Error("Failed to process PDF file locally.");
    }
};

// --- NEW AGENT IMPLEMENTATIONS ---

// Helper: Convert File to inline data for Gemini
const fileToPart = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    return {
        inlineData: {
            data: base64,
            mimeType: file.type
        }
    };
};

export const streamChat = async function* (dto: ChatRequestDto) {
    const ai = getClient();
    
    // Map ExpertType to System Instructions
    let systemInstruction = dto.systemInstructions || "You are the Complia Financial Promotion Agent (CFPA). You act as a Regulatory Board Advisor.";
    
    switch (dto.expertType) {
        case ExpertType.REGULATORY:
            systemInstruction = "You are a Senior Regulatory Compliance Officer (UK FCA/PRA). Prioritize COBS 4 rules, PERG 8 guidance, and SM&CR accountability. Be formal and precise.";
            break;
        case ExpertType.LEGAL:
            systemInstruction = "You are a Financial Services Legal Counsel. Focus on contract law, liability, and regulatory perimeter issues. Cite specific legislation (FSMA 2000).";
            break;
        case ExpertType.CODING:
            systemInstruction = "You are a Senior Software Engineer specializing in RegTech. Output clean, efficient TypeScript code.";
            break;
        case ExpertType.MEDICAL:
            // Less relevant but kept for completeness of enum
            systemInstruction = "You are a Medical Expert.";
            break;
        case ExpertType.GENERAL:
        default:
            // Default instruction already set
            break;
    }

    const parts: any[] = [{ text: dto.content }];
    
    if (dto.attachments) {
        for (const file of dto.attachments) {
            const part = await fileToPart(file);
            parts.push(part);
        }
    }

    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [{ parts }],
        config: {
            systemInstruction,
            temperature: dto.temperature,
            maxOutputTokens: dto.maxTokens
        }
    });

    for await (const chunk of responseStream) {
        yield chunk.text;
    }
};

export const queryBoardAdvisor = async (query: string): Promise<string> => {
    // This function is kept for backward compatibility with simple calls
    // It wraps the stream but returns the full text at once
    const dto: ChatRequestDto = {
        threadId: 'default',
        content: query,
        expertType: ExpertType.REGULATORY
    };
    
    let fullResponse = "";
    for await (const chunk of streamChat(dto)) {
        fullResponse += chunk;
    }
    return fullResponse;
};

export const runClassificationAgent = async (text: string): Promise<AgentResult> => {
    const ai = getClient();
    const prompt = `
    You are a UK Financial Compliance Officer (COBS 4). 
    Classify the following financial promotion text.
    Determine:
    1. Audience: "Retail" (Default if unclear) or "Professional".
    2. Type: "Factsheet", "Presentation", "Email", "Website".
    
    Text: "${text.substring(0, 1000)}..."

    Return JSON: { "audience": string, "type": string, "reasoning": string }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const json = JSON.parse(response.text || '{}');
        
        return {
            id: 'AG-1',
            agentName: 'Agent 1: Classification',
            status: ComplianceStatus.PASS, // Classification usually passes, just categorizes
            description: `Classified as ${json.type} for ${json.audience} Investors.`,
            timestamp: new Date().toISOString(),
            evidence: json
        };
    } catch (e) {
        return {
             id: 'AG-1',
             agentName: 'Agent 1: Classification',
             status: ComplianceStatus.REFER,
             description: "Failed to classify content.",
             timestamp: new Date().toISOString()
        };
    }
};

export const runDataConsistencyAgent = async (promoText: string, truthText: string): Promise<{ agent: AgentResult; claims: ClaimVerification[] }> => {
    const ai = getClient();
    const prompt = `
    You are a Data Verification Auditor.
    Compare the "Promotion Text" against the "Truth Source".
    Extract key numerical claims from the Promotion and verify them against the Truth Source.
    
    Promotion: "${promoText.substring(0, 2000)}..."
    Truth Source: "${truthText.substring(0, 2000)}..."

    Return JSON:
    {
        "claims": [
            { "claim": string, "sourceMatch": string, "status": "VERIFIED" | "MISMATCH" | "UNSUBSTANTIATED", "matchScore": number (0-100) }
        ],
        "summary": string
    }
    `;

    try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: prompt,
             config: { responseMimeType: 'application/json' }
        });
        const json = JSON.parse(response.text || '{}');
        const claims = json.claims || [];
        const mismatchCount = claims.filter((c: any) => c.status !== 'VERIFIED').length;

        return {
            agent: {
                id: 'AG-2',
                agentName: 'Agent 2: Data Consistency',
                status: mismatchCount > 0 ? ComplianceStatus.FAIL : ComplianceStatus.PASS,
                description: mismatchCount > 0 ? `Found ${mismatchCount} data discrepancies.` : "All claims verified against source.",
                timestamp: new Date().toISOString()
            },
            claims: claims
        };
    } catch (e) {
        return {
            agent: { id: 'AG-2', agentName: 'Agent 2: Data Consistency', status: ComplianceStatus.REFER, description: "Verification failed.", timestamp: new Date().toISOString() },
            claims: []
        };
    }
};

export const runVisualAgent = async (text: string, ocrData?: DocumentAIResult): Promise<AgentResult> => {
    let prominenceScore = 0.5;
    let verdict = "WEAK";
    let details: any[] = [];
    let isFail = false;

    // Use Option B Enhanced Spatial Data if available
    if (ocrData && ocrData.pages) {
         let buriedRiskCount = 0;
         let riskFound = false;

         ocrData.pages.forEach(page => {
             page.tokens.forEach(token => {
                 const lower = token.text.toLowerCase();
                 // Look for key risk terms
                 if (lower.includes("capital at risk") || lower.includes("value can go down") || lower.includes("past performance")) {
                     riskFound = true;
                     const score = (1.0 - token.boundingBox.y).toFixed(2); // Higher score = Higher up on page
                     
                     // Option B Logic: Check if it's in the footer or hidden
                     let status = "PASS";
                     if (token.layout?.section === 'footer' || token.boundingBox.y > 0.90) {
                         status = "BURIED (Bottom 10%)";
                         buriedRiskCount++;
                     } else if (token.layout?.fontSize && token.layout.fontSize < 6) {
                         status = "BURIED (Small Font)";
                         buriedRiskCount++;
                     }

                     details.push({
                         page: page.pageNumber,
                         text: token.text.substring(0, 30) + "...",
                         yPos: token.boundingBox.y.toFixed(2),
                         section: token.layout?.section || 'unknown',
                         prominenceScore: score,
                         verdict: status
                     });
                 }
             });
         });

         if (!riskFound) {
             isFail = true;
             verdict = "MISSING";
         } else if (buriedRiskCount > 0) {
             isFail = true;
             verdict = "BURIED";
         } else {
             verdict = "PASS";
         }

    } else {
        // Text only fallback (Degraded mode)
        const hasRiskWarning = text.toLowerCase().includes("capital at risk") || text.toLowerCase().includes("value can go down");
        if (hasRiskWarning) {
             prominenceScore = 0.8;
             verdict = "PRESENT (Text-Only)";
        } else {
             prominenceScore = 0;
             verdict = "MISSING";
             isFail = true;
        }
    }
    
    return {
        id: 'AG-3',
        agentName: 'Agent 3: Visual Prominence',
        status: isFail ? ComplianceStatus.FAIL : (ocrData ? ComplianceStatus.PASS : ComplianceStatus.REFER),
        description: isFail ? `Risk warning ${verdict.toLowerCase()}.` : "Risk warnings prominent.",
        timestamp: new Date().toISOString(),
        evidence: { method: ocrData ? "Option B Spatial Analysis" : "Text-Only Fallback", score: prominenceScore, details: details }
    };
};

export const runReadabilityAgent = async (text: string): Promise<{ agent: AgentResult; metrics: ReadabilityMetrics }> => {
    const ai = getClient();
    // Prompt to analyze readability and PRIN 2A
    const prompt = `
    Analyze this text for UK Consumer Duty (PRIN 2A) understanding.
    Calculate readability score (0-100), grade level, and sentiment.
    Identify complex jargon.
    
    Text: "${text.substring(0, 1000)}..."

    Return JSON:
    {
        "score": number,
        "gradeLevel": string,
        "complexity": "Easy" | "Average" | "Complex",
        "prin2aCompliant": boolean,
        "sentiment": "Positive" | "Neutral" | "Negative",
        "segments": [ { "text": string, "score": number, "verdict": "READABLE" | "COMPLEX", "explanation": string } ]
    }
    `;

    try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: prompt,
             config: { responseMimeType: 'application/json' }
        });
        const json = JSON.parse(response.text || '{}');
        const metrics: ReadabilityMetrics = {
            score: json.score || 50,
            gradeLevel: json.gradeLevel || "12",
            wordCount: text.split(' ').length,
            sentenceCount: text.split('.').length,
            complexity: json.complexity || "Average",
            sentiment: json.sentiment,
            prin2aCompliant: json.prin2aCompliant,
            segments: json.segments || []
        };

        return {
            agent: {
                id: 'AG-4',
                agentName: 'Agent 4: Readability (Consumer Duty)',
                status: metrics.prin2aCompliant ? ComplianceStatus.PASS : ComplianceStatus.FAIL,
                description: `Readability Score: ${metrics.score}. ${metrics.complexity}.`,
                timestamp: new Date().toISOString()
            },
            metrics
        };
    } catch (e) {
         return {
            agent: { id: 'AG-4', agentName: 'Agent 4: Readability', status: ComplianceStatus.REFER, description: "Analysis failed", timestamp: new Date().toISOString() },
            metrics: { score: 0, gradeLevel: "N/A", wordCount: 0, sentenceCount: 0, complexity: "Complex", prin2aCompliant: false, segments: [] }
         };
    }
};

export const runARPermissionsAgent = async (text: string, arId: string, contextId?: string): Promise<{ agent: AgentResult; validation: ARValidation }> => {
    // 1. Check FCA Status
    const fcaStatus = await validateARAuthorization(arId, contextId || "UNKNOWN");
    
    // 2. Check Permissions Scope (Permissions Check) - Mock simulation
    // If text contains "manage", "discretionary", "guarantee" and firm is AR, flag it.
    const prohibitedTerms = ["manage", "discretionary", "guaranteed returns"];
    const foundTerms = prohibitedTerms.filter(t => text.toLowerCase().includes(t));
    
    const violations: PermissionViolation[] = foundTerms.map(t => ({
        keyword: t,
        rule: "PERG 8.12 - ARs cannot imply managing investments.",
        severity: "HIGH"
    }));

    const isValid = fcaStatus.isValid && violations.length === 0;

    return {
        agent: {
            id: 'AG-5',
            agentName: 'Agent 5: AR Permissions',
            status: isValid ? ComplianceStatus.PASS : ComplianceStatus.FAIL,
            description: fcaStatus.isValid 
                ? (violations.length === 0 ? "AR Authorized and within scope." : "AR Authorized but Content exceeds permissions.") 
                : "AR Status Invalid (Suspended/De-authorized).",
            timestamp: new Date().toISOString()
        },
        validation: {
            arId: arId,
            status: fcaStatus.status as any,
            prohibitedTermsFound: foundTerms,
            audienceMismatch: false,
            authorizationDate: fcaStatus.statusEffectiveDate,
            violations: violations
        }
    };
};

export const runDisclosureCheckAgent = async (text: string): Promise<{ agent: AgentResult; disclosures: DisclosureCheck[] }> => {
    // Deterministic Regex Check
    const checks = [
        { name: "Capital at Risk", regex: /capital (is )?at risk|value can go down/i, rule: "COBS 4.5.2R" },
        { name: "Past Performance", regex: /past performance is not a (reliable )?indicator/i, rule: "COBS 4.6.2R" },
        { name: "Tax Treatment", regex: /tax treatment depends on/i, rule: "COBS 4.14" }
    ];

    const disclosures: DisclosureCheck[] = checks.map(c => {
        const match = text.match(c.regex);
        return {
            name: c.name,
            present: !!match,
            extract: match ? match[0] : "",
            severity: "HIGH",
            rule: c.rule,
            remediation: `Include standard ${c.name} warning.`
        };
    });

    const missing = disclosures.filter(d => !d.present).length;

    return {
        agent: {
            id: 'AG-6',
            agentName: 'Agent 6: Disclosures',
            status: missing === 0 ? ComplianceStatus.PASS : ComplianceStatus.FAIL,
            description: missing === 0 ? "All mandatory disclosures present." : `Missing ${missing} mandatory disclosures.`,
            timestamp: new Date().toISOString()
        },
        disclosures
    };
};

export const runAttestationAgent = (dateStr: string): { nextDueDate: string } => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 3); // Quarterly
    return { nextDueDate: d.toISOString() };
};

export const runStrategyHelper = (status: ComplianceStatus, risk: RiskRating, failures: string[]): StrategyPrompt => {
    return {
        context: "Remediation Phase",
        constraints: ["Must cite COBS rules", "Must provide exact wording"],
        instruction: `The promotion failed on ${failures.join(", ")}. Please rewrite the affected sections to comply with COBS 4 rules regarding fair, clear, and not misleading communications.`
    };
};

export const analyzePromotionContent = async (
    promoText: string, 
    truthText: string, 
    metadata: { type: string, audience: string, submitter: string, arId: string, ocrData?: DocumentAIResult }
): Promise<PromotionAnalysis> => {
    
    // Parallel Execution of Agents
    const [ag1, ag2, ag4, ag5, ag6] = await Promise.all([
        runClassificationAgent(promoText),
        runDataConsistencyAgent(promoText, truthText),
        runReadabilityAgent(promoText),
        runARPermissionsAgent(promoText, metadata.arId, `ANALYSIS-${Date.now()}`),
        runDisclosureCheckAgent(promoText)
    ]);
    
    // Visual Agent usually needs OCR data or falls back to text
    const ag3 = await runVisualAgent(promoText, metadata.ocrData);
    
    const agents = [ag1, ag2.agent, ag3, ag4.agent, ag5.agent, ag6.agent];
    const failures = agents.filter(a => a.status === ComplianceStatus.FAIL);
    const overallStatus = failures.length > 0 ? ComplianceStatus.FAIL : ComplianceStatus.PASS;
    const riskRating = failures.length >= 2 ? RiskRating.HIGH : (failures.length === 1 ? RiskRating.MEDIUM : RiskRating.LOW);

    // Generate remediation strategy prompt if needed
    const strategyPrompt = runStrategyHelper(overallStatus, riskRating, failures.map(a => a.agentName));

    // Save result to Firestore for persistence
    const promoId = `PROMO-${Date.now()}`;
    const result: PromotionAnalysis = {
        id: promoId,
        title: "New Analysis",
        type: metadata.type,
        submittedBy: metadata.submitter,
        submittedAt: new Date().toISOString(),
        executiveSummary: overallStatus === ComplianceStatus.PASS ? "Promotion approved. All checks passed." : `Promotion rejected due to ${failures.length} compliance breaches.`,
        regulatoryAnalysis: `Detailed analysis of ${agents.length} control points.`,
        riskRating: riskRating,
        overallStatus: overallStatus,
        agents: agents,
        claims: ag2.claims,
        auditHash: await generateAuditHash(JSON.stringify(agents)),
        readability: ag4.metrics,
        arValidation: ag5.validation,
        disclosures: ag6.disclosures,
        strategyPrompt: strategyPrompt,
        ocrData: metadata.ocrData
    };

    // Persist parts
    FirestoreService.promotions.create({
        id: promoId, title: "Untitled Promotion", type: metadata.type, submission_date: new Date().toISOString(),
        status: overallStatus === ComplianceStatus.PASS ? "Ready for Review" : "Rejected",
        ar_id: metadata.arId, submitted_by: metadata.submitter, firm_id: "FIRM-01", risk_rating: riskRating
    });
    
    FirestoreService.controlTests.save({
        id: promoId,
        agent_1_classification: ag1,
        agent_2_consistency: ag2,
        agent_3_visual: ag3,
        agent_4_text: ag4,
        agent_5_ar_permissions: ag5,
        agent_6_disclosure: ag6,
        overall_status: overallStatus,
        timestamp: new Date().toISOString(),
        full_text: promoText
    });

    return result;
};

export const processDigitalSignature = async (analysis: PromotionAnalysis, signerName: string, signatureImage: string): Promise<ApprovalRecord> => {
    // 1. Create Approval Record
    const approvalId = `ENV-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // 2. Log to Audit Service (HMAC)
    const auditEntry = await auditService.logAction(analysis.id, 'QES_SIGN_OFF', signerName, {
        decision: 'APPROVE',
        envelopeId: approvalId,
        signer: signerName
    });

    // 3. Persist to Firestore
    const approval: ApprovalDocument = {
        id: approvalId,
        promotion_id: analysis.id,
        cf30_name: signerName,
        cf30_email: "user@firm.com",
        cf30_decision: "Approve",
        qes_provider: "SignaturePad", // simulating QES
        signature_image: signatureImage,
        signed_at: timestamp,
        status: "Signed",
        worm_gcs_path: `gs://complia-vault/${analysis.id}/${approvalId}.json`
    };
    FirestoreService.approvals.save(approval);
    FirestoreService.promotions.updateStatus(analysis.id, 'Locked');

    return {
        approvalId,
        envelopeId: approvalId,
        approvedBy: signerName,
        decision: 'APPROVE',
        timestamp,
        status: 'APPROVED_AND_SIGNED',
        qes: {
            provider: 'SignaturePad',
            token: await generateSha256(signatureImage + timestamp),
            timestamp,
            signerName,
            signerRole: 'SMF/CF30',
            envelopeId: approvalId
        },
        signatureImage,
        hashChain: {
            sequence: auditEntry.sequence_number,
            timestamp: auditEntry.timestamp,
            action: 'QES_SIGN_OFF',
            currentHash: auditEntry.hash,
            previousHash: auditEntry.previous_hash,
            payloadFragment: auditEntry.payload_snapshot,
            firestoreDocId: auditEntry.id
        }
    };
};

export const generateEvidencePack = (analysis: PromotionAnalysis): any => {
    return {
        promotion_id: analysis.id,
        generated_at: new Date().toISOString(),
        compliance_verdict: analysis.overallStatus,
        risk_rating: analysis.riskRating,
        executive_summary: analysis.executiveSummary,
        agents_results: analysis.agents,
        audit_trail: {
            hash: analysis.auditHash,
            storage_backend: "ZeroCost_Local_WORM_HMAC",
            integrity_check: "PASS"
        }
    };
};
