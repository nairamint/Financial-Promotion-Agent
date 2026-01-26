



export enum ComplianceStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  REFER = 'REFER',
  PENDING = 'PENDING'
}

export enum RiskRating {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ExpertType {
  GENERAL = 'general',
  CODING = 'coding',
  MEDICAL = 'medical',
  LEGAL = 'legal',
  REGULATORY = 'regulatory'
}

export interface ChatRequestDto {
  threadId: string;
  content: string;
  expertType?: ExpertType;
  systemInstructions?: string;
  temperature?: number;
  maxTokens?: number;
  attachments?: File[];
}

export interface AgentResult {
  id: string;
  agentName: string;
  status: ComplianceStatus;
  description: string;
  citation?: string;
  evidence?: string | object;
  timestamp: string;
}

export interface ClaimVerification {
  claim: string;
  sourceMatch: string;
  matchScore: number;
  status: 'VERIFIED' | 'MISMATCH' | 'UNSUBSTANTIATED';
  location: string;
}

export interface ReadabilitySegment {
    text: string;
    score: number; // 0.0 to 1.0 (Probability of being readable)
    verdict: 'READABLE' | 'COMPLEX';
    explanation: string;
}

export interface ReadabilityTerm {
    term: string;
    clarity: 'Clear' | 'Jargon' | 'Ambiguous';
    suggestion?: string;
}

export interface ReadabilityMetrics {
  score: number;
  gradeLevel: string;
  wordCount: number;
  sentenceCount: number;
  complexity: 'Easy' | 'Average' | 'Complex';
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  // New PRIN 2A Fields
  prin2aCompliant: boolean;
  segments: ReadabilitySegment[];
  financialTermClarity?: ReadabilityTerm[];
}

export interface PermissionViolation {
    keyword: string;
    rule: string;
    severity: 'HIGH' | 'CRITICAL';
    context?: string;
}

export interface ARValidation {
  arId: string;
  status: 'Authorised' | 'Suspended' | 'Not Found';
  prohibitedTermsFound: string[];
  audienceMismatch: boolean;
  authorizationDate?: string;
  apiLatencyMs?: number;
  // Enhanced Fields for Agent 5
  permissionsScope?: string[];
  violations?: PermissionViolation[];
}

export interface DisclosureCheck {
  name: string;
  present: boolean;
  extract: string;
  severity?: 'HIGH' | 'CRITICAL';
  remediation?: string;
  rule?: string;
}

export interface StrategyPrompt {
  context: string;
  constraints: string[];
  instruction: string;
}

export interface EscalationRoute {
  level: 'GREEN' | 'AMBER' | 'RED';
  owner: string;
  role: string;
  action: string;
  sla: string;
}

// --- Agent 7 & 8 Types ---

export interface QESSignature {
  provider: 'DocuSign' | 'AdobeSign' | 'SignaturePad';
  token: string;
  timestamp: string;
  signerName: string;
  signerRole: string;
  envelopeId: string;
}

export interface HashChainEntry {
  sequence: number;
  timestamp: string;
  action: string;
  currentHash: string;
  previousHash: string;
  payloadFragment: string; // Short excerpt of what was hashed
  firestoreDocId: string;
}

export interface ApprovalRecord {
  approvalId: string;
  envelopeId?: string; // DocuSign Envelope ID
  approvedBy: string;
  decision: 'APPROVE' | 'REJECT' | 'ESCALATE';
  timestamp: string;
  status: 'PENDING_SIGNATURE' | 'APPROVED_AND_SIGNED';
  qes?: QESSignature; // Populated after signing
  signatureImage?: string; // Base64 signature capture
  hashChain?: HashChainEntry; // Populated after signing
  wormStorageLocation?: string; // e.g., gs://complia-audit-trail-prod/...
  nextAttestationDate?: string; // From Agent 7
}

// --- Document AI Types ---
export interface BoundingBox {
    x: number;
    y: number; // 0.0 top, 1.0 bottom
    width: number;
    height: number;
}

export interface Token {
    text: string;
    confidence: number;
    boundingBox: BoundingBox;
    // Enhanced spatial context (Option B)
    layout?: {
        isBold: boolean;
        fontSize: number;
        section: 'header' | 'footer' | 'body' | 'title_area' | 'unknown';
        orderInPage: number;
    };
}

export interface PageData {
    pageNumber: number;
    text: string;
    tokens: Token[];
}

export interface DocumentAIResult {
    fullText: string;
    pages: PageData[];
    processedAt: string;
    processorId: string;
}

// --- State Graph Types ---
export interface ComplianceState {
    promotionText: string;
    truthText: string;
    metadata: {
        arId: string;
        submitter: string;
        ocrData?: DocumentAIResult;
    };
    // Accumulated Agent Results
    agents: AgentResult[];
    claims: ClaimVerification[];
    readability?: ReadabilityMetrics;
    arValidation?: ARValidation;
    disclosures?: DisclosureCheck[];
    extractedEntities?: Record<string, string[]>; // From Agent 6 NER
    riskFlags: string[];
    
    // Graph Specific State Fields
    prominenceScore?: number; // Agent 3
    disclosureCompleteness?: number; // Agent 6
    requiresEscalation?: boolean; // Conditional Edge Logic
    
    // Final Output
    finalResult?: Partial<PromotionAnalysis>;
}

export interface PromotionAnalysis {
  id: string;
  title: string;
  type: string;
  submittedBy: string;
  submittedAt: string;
  executiveSummary: string;
  regulatoryAnalysis: string;
  riskRating: RiskRating;
  overallStatus: ComplianceStatus;
  agents: AgentResult[];
  claims: ClaimVerification[];
  auditHash: string;
  
  // Metrics
  readability?: ReadabilityMetrics;
  arValidation?: ARValidation;
  disclosures?: DisclosureCheck[];
  ocrData?: DocumentAIResult;
  
  // Helpers
  strategyPrompt?: StrategyPrompt;
  escalation?: EscalationRoute;
  
  // Final Approval Artifacts
  approvalRecord?: ApprovalRecord;
  fullText?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  hash: string;
  previousHash: string;
}

// --- FCA & AR Governance Types ---

export interface FCAStatusResponse {
  frn: string;
  firmName: string;
  status: 'Authorised' | 'Appointed Representative' | 'De-authorised' | 'Suspended' | 'Not Found' | 'Unknown';
  statusEffectiveDate: string;
  timestamp: string;
  message?: string;
  isValid?: boolean;
  permissions?: string[]; // Enhanced for Agent 5
}

export interface ControlledFunction {
    name: string;
    firmName: string;
    effectiveDate: string;
    status: 'Current' | 'Previous';
}

export interface IndividualValidation {
    irn: string;
    name: string;
    status: string;
    isValid: boolean;
    timestamp: string;
    detailsUrl?: string;
    currentFirm?: string;
    roles?: string[];
    controlledFunctions?: ControlledFunction[]; // Detailed structure from CF API
}

export interface AppointedRepresentative {
    frn: string;
    name: string;
    effectiveDate: string;
    terminationDate?: string;
    principalFrn: string;
    recordSubType: string;
    tiedAgent: boolean;
    status: 'Current' | 'Previous';
}

export interface PrincipalNetworkScan {
    principalFrn: string;
    currentARs: AppointedRepresentative[];
    previousARs: AppointedRepresentative[];
    timestamp: string;
}

export interface ARProfile {
  id: string;
  name: string;
  frn: string;
  fcaStatus: FCAStatusResponse;
  riskScore: number; // 0-100
  submissionsCount: number;
  violationsCount: number;
  lastAuditDate: string;
  primaryContact: string;
  revenue_ytd?: number;
  complaints_ytd?: number;
}

// --- Firestore Schema Documents ---

export interface PromotionDocument {
    id: string; // promotion_id
    title: string;
    type: string;
    submission_date: string;
    status: "Testing" | "Ready for Review" | "Under Review" | "Approved" | "Locked" | "Rejected";
    ar_id: string;
    submitted_by: string;
    firm_id: string;
    risk_rating?: RiskRating;
    is_favorite?: boolean;
    is_deleted?: boolean;
    assigned_to?: string; // SM&CR Owner
    sla_status?: 'On Track' | 'At Risk' | 'Breached';
}

export interface SubmissionDocument {
    id: string; // submission_id
    promotion_id: string;
    deck_file?: { gcs_path: string; filename: string; uploaded_date: string; };
    source_file?: { gcs_path: string; filename: string; uploaded_date: string; };
    ocr_results?: DocumentAIResult;
    status: "Processing" | "Ready";
}

export interface ControlTestDocument {
    id: string; // matches promotion_id
    agent_1_classification: AgentResult;
    agent_2_consistency: { agent: AgentResult; claims: ClaimVerification[] };
    agent_3_visual: AgentResult;
    agent_4_text: { agent: AgentResult; metrics: ReadabilityMetrics };
    agent_5_ar_permissions: { agent: AgentResult; validation: ARValidation; };
    agent_6_disclosure: { agent: AgentResult; disclosures: DisclosureCheck[] };
    overall_status: ComplianceStatus;
    timestamp: string;
    full_text?: string;
}

export interface ApprovalDocument {
    id: string; // approval_id / envelope_id
    promotion_id: string;
    cf30_name: string;
    cf30_email: string;
    cf30_decision: "Approve" | "Reject" | "Escalate";
    qes_token?: string;
    qes_provider: "DocuSign" | "SignaturePad";
    signature_image?: string;
    signed_at?: string;
    status: "Pending Signature" | "Signed" | "Locked";
    worm_gcs_path?: string;
}

export interface AuditTrailDocument {
    id: string; // log id
    sequence_number: number; // Chain sequence
    promotion_id: string;
    action: string; // "agent_id" concept
    actor: string; // "approver_id" concept
    timestamp: string;
    
    // Crypto fields
    hash: string; // The HMAC of this entry
    previous_hash: string; // Linkage
    payload_snapshot: string; // JSON string of decision/data
    
    verification_status?: 'VERIFIED' | 'TAMPERED' | 'PENDING';
}

export interface ARValidationDocument {
    id: string;
    ar_id: string;
    promotion_id: string;
    fca_status: string;
    is_valid: boolean;
    timestamp: string;
    api_latency_ms: number;
}
