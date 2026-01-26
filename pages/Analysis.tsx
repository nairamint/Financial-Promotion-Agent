import React, { useState, useEffect, useRef } from 'react';
import { analyzePromotionContent, generateAuditHash, processDigitalSignature, loadPromotionAnalysis, processPdfDocumentAI, generateEvidencePack, validateIndividualAuthorization } from '../services/geminiService';
import { PromotionAnalysis, ComplianceStatus, RiskRating, ApprovalRecord, DocumentAIResult, ClaimVerification, AgentResult, IndividualValidation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowRight, AlertTriangle, Lock, Upload, FileText, Check, X, ShieldCheck, Users, BookOpen, Copy, Fingerprint, Download, RefreshCw, Eraser, MessageSquare, ClipboardCheck, Eye, AlertOctagon, UserCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Helper for the loading spinner
function ShieldCheckIcon(props: any) {
    return <ShieldCheck {...props} />
}

interface AnalysisProps {
    initialPromotionId?: string;
}

export const Analysis: React.FC<AnalysisProps> = ({ initialPromotionId }) => {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'workspace'>('upload');
  const [promoText, setPromoText] = useState('');
  const [truthText, setTruthText] = useState('');
  const [arId, setArId] = useState('712934');
  const [analysis, setAnalysis] = useState<PromotionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Document AI State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [ocrData, setOcrData] = useState<DocumentAIResult | undefined>(undefined);

  // Workspace View State
  const [activeTab, setActiveTab] = useState<'findings' | 'regulatory' | 'claims'>('findings');

  // QES & Approval States
  const [showQESModal, setShowQESModal] = useState(false);
  const [approvalRecord, setApprovalRecord] = useState<ApprovalRecord | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  
  // Signer Identity Verification State
  const [signerIrn, setSignerIrn] = useState('JXB12345');
  const [isVerifyingIrn, setIsVerifyingIrn] = useState(false);
  const [irnVerified, setIrnVerified] = useState(false);
  const [signerName, setSignerName] = useState("Julia Black (SMF9)");
  const [signerFirm, setSignerFirm] = useState("");
  const [signerRoles, setSignerRoles] = useState<string[]>([]);
  
  // PM Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);

  // Canvas Signature Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load existing analysis if provided
  useEffect(() => {
      if (initialPromotionId) {
          setStep('analyzing');
          const load = async () => {
              try {
                  const data = await loadPromotionAnalysis(initialPromotionId);
                  if (data) {
                      setAnalysis(data);
                      setApprovalRecord(data.approvalRecord || null);
                      // Hydrate Text
                      if (data.fullText) setPromoText(data.fullText);
                      else setPromoText("Document content not available in legacy storage.");
                      
                      setStep('workspace');
                  } else {
                      setError("Promotion not found.");
                      setStep('upload');
                  }
              } catch (e) {
                  console.error(e);
                  setError("Failed to load promotion analysis.");
                  setStep('upload');
              }
          };
          load();
      } else {
          // Reset State for New Submission
          setStep('upload');
          setPromoText('');
          setTruthText('');
          setAnalysis(null);
          setApprovalRecord(null);
          setPdfFile(null);
          setError(null);
          setActiveTab('findings');
      }
  }, [initialPromotionId]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setPdfFile(file);
          setIsProcessingPdf(true);
          try {
              // Real client-side PDF processing
              const result = await processPdfDocumentAI(file);
              setOcrData(result);
              setPromoText(result.fullText); // Auto-fill text area
          } catch (err) {
              setError("PDF Processing Failed: " + err);
          } finally {
              setIsProcessingPdf(false);
          }
      }
  };

  const handleAnalyze = async () => {
    if (!promoText || !truthText) {
        setError("Both Promotion Text and Truth Source are required.");
        return;
    }
    setError(null);
    setStep('analyzing');
    setApprovalRecord(null); // Reset approval state for new analysis

    try {
        const result = await analyzePromotionContent(promoText, truthText, {
            type: "Investor Presentation",
            audience: "Retail",
            submitter: "John Doe (Marketing)",
            arId: arId,
            ocrData: ocrData // Pass the OCR structured data
        });
        
        const hash = await generateAuditHash(JSON.stringify(result));
        
        setAnalysis({
            id: result.id || `REV-${Date.now()}`,
            title: "Q1 Performance Update", 
            type: "Presentation",
            submittedBy: "John Doe",
            submittedAt: new Date().toISOString(),
            auditHash: hash,
            claims: result.claims || [],
            agents: result.agents || [],
            executiveSummary: result.executiveSummary || "Analysis complete.",
            regulatoryAnalysis: result.regulatoryAnalysis || "",
            riskRating: result.riskRating || RiskRating.MEDIUM,
            overallStatus: result.overallStatus || ComplianceStatus.REFER,
            readability: result.readability,
            arValidation: result.arValidation,
            disclosures: result.disclosures,
            strategyPrompt: result.strategyPrompt,
            escalation: result.escalation,
            ocrData: result.ocrData
        });
        setStep('workspace');
    } catch (e: any) {
        setError(e.message);
        setStep('upload');
    }
  };

  const handleApproveClick = () => {
      setShowQESModal(true);
      // Reset Verification State on Modal Open
      setIrnVerified(false); 
      setSignerIrn('JXB12345');
      setSignerName("Julia Black (SMF9)");
      setSignerFirm("");
      setSignerRoles([]);
      
      setTimeout(() => {
          // Initialize canvas
          if (canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.lineWidth = 2;
                  ctx.lineCap = 'round';
                  ctx.strokeStyle = '#000';
              }
          }
      }, 100);
  };
  
  const verifySigner = async () => {
      setIsVerifyingIrn(true);
      try {
          const result = await validateIndividualAuthorization(signerIrn);
          if (result.isValid) {
              setIrnVerified(true);
              setSignerName(result.name);
              setSignerFirm(result.currentFirm || "");
              setSignerRoles(result.roles || []);
          } else {
              setIrnVerified(false);
              alert(`Verification Failed: ${result.name} is ${result.status} (Not Active).`);
          }
      } catch (e) {
          alert("Verification Service Error");
      } finally {
          setIsVerifyingIrn(false);
      }
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      if (!irnVerified) return; // Block drawing until verified
      setIsDrawing(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
      const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
      const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;
      
      ctx.lineTo(x, y);
      ctx.stroke();
  };

  const stopDrawing = () => {
      setIsDrawing(false);
  };

  const clearSignature = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
  };

  const submitSignature = async () => {
      if (!analysis || !canvasRef.current || !irnVerified) return;
      setIsSigning(true);
      
      const signatureImage = canvasRef.current.toDataURL('image/png');
      
      try {
          const record = await processDigitalSignature(analysis, signerName, signatureImage);
          setApprovalRecord(record);
          setShowQESModal(false);
      } catch (e) {
          setError("Signature processing failed: " + e);
      } finally {
          setIsSigning(false);
      }
  };

  const handleExportEvidence = () => {
      if (!analysis) return;
      
      // Use the formal evidence generation service
      const evidencePack = generateEvidencePack(analysis);
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evidencePack, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `FCA_Evidence_Pack_${analysis.id}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      alert("Evidence Pack (JSON) downloaded. This file contains the cryptographic hash chain proof.");
  };

  const generatePMReport = () => {
    if (!analysis) return "";
    const blockers = analysis.agents.filter(a => a.status === ComplianceStatus.FAIL);
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    
    return `**REGULATORY STATUS UPDATE**
**Date:** ${date}
**Ref:** ${analysis.id}
**Asset:** ${analysis.title}

**VERDICT:** ${analysis.overallStatus}
**RISK RATING:** ${analysis.riskRating}

**EXECUTIVE BRIEF:**
${analysis.executiveSummary}

**CRITICAL BLOCKERS (${blockers.length}):**
${blockers.length > 0 ? blockers.map(b => `[FAIL] ${b.agentName}: ${b.description}`).join('\n') : "None. All agents passed control checks."}

**REMEDIATION STRATEGY:**
${analysis.strategyPrompt?.instruction || "No remediation required."}

**NEXT STEPS:**
${analysis.overallStatus === ComplianceStatus.PASS ? "✅ Proceed to SMF Sign-off." : "⚠️ Return to Marketing for mandatory edits."}`;
  };

  const handleCopyReport = () => {
    const text = generatePMReport();
    navigator.clipboard.writeText(text);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2000);
  };

  if (step === 'upload') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Regulatory Control Workspace</h2>
            <p className="text-slate-500 mt-2">Upload materials for Agentic Analysis (COBS 4 / MiFID II)</p>
        </div>
        
        {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-md flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {error}
            </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-6">
             <div className="bg-slate-100 p-3 rounded-lg text-slate-600">
                <Users className="h-6 w-6" />
             </div>
             <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Entity Verification (FRN)</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="text" 
                        value={arId} 
                        onChange={(e) => setArId(e.target.value)}
                        className="w-full text-lg font-mono text-slate-900 border-b border-slate-200 focus:border-emerald-500 focus:outline-none py-1"
                        placeholder="712934"
                    />
                    {arId === '712934' && <Check className="h-5 w-5 text-emerald-500" />}
                </div>
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-4 justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Promotion Artifact</h3>
                            <p className="text-xs text-slate-500">PDF, PPTX, or Text</p>
                        </div>
                    </div>
                </div>
                
                <div className="mb-4 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {isProcessingPdf ? (
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-blue-600">
                            <RefreshCw className="h-6 w-6 animate-spin" /> 
                            <span>Extracting Layout & Text...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Upload className="h-6 w-6 text-slate-400 group-hover:text-blue-500" /> 
                            {pdfFile ? (
                                <span className="text-slate-900 font-medium">{pdfFile.name}</span>
                            ) : (
                                <div className="text-sm text-slate-500">
                                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <textarea 
                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Raw text extraction preview..."
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                ></textarea>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                        <Users className="h-6 w-6" /> 
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Truth Source (Verification)</h3>
                        <p className="text-xs text-slate-500">Factsheet, Prospectus, KIID</p>
                    </div>
                </div>
                <textarea 
                    className="w-full h-[250px] p-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono leading-relaxed"
                    placeholder="Paste the source data here for the 'Truth Teller' agent..."
                    value={truthText}
                    onChange={(e) => setTruthText(e.target.value)}
                ></textarea>
            </div>
        </div>

        <div className="flex justify-center pt-4">
            <button 
                onClick={handleAnalyze}
                disabled={!promoText || !truthText}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl transition-all hover:scale-105"
            >
                Run Compliance Agents <ArrowRight className="h-5 w-5" />
            </button>
        </div>
      </div>
    );
  }

  if (step === 'analyzing') {
      return (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center bg-white rounded-xl shadow-sm border border-slate-100 m-8">
              <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                  <ShieldCheckIcon className="absolute inset-0 m-auto text-emerald-600 h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Agentic Review in Progress</h2>
              <div className="mt-8 space-y-3 text-sm text-slate-500 font-mono text-left inline-block bg-slate-50 p-6 rounded-lg border border-slate-200 min-w-[300px]">
                  <div className="flex items-center gap-3">
                      {promoText ? <Check className="h-4 w-4 text-emerald-500"/> : <div className="h-4 w-4 rounded-full border-2 border-slate-300"></div>}
                      <span>Context Loading</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 text-blue-500 animate-spin"/>
                      <span>Running 8 Deterministic Agents...</span>
                  </div>
                  <div className="pl-7 text-xs text-slate-400 space-y-1">
                      <p>• Classification Agent</p>
                      <p>• Data Consistency Agent</p>
                      <p>• Visual Prominence Agent</p>
                  </div>
              </div>
          </div>
      );
  }

  // --- HARVEY-STYLE WORKSPACE VIEW ---
  if (step === 'workspace' && analysis) {
      return (
          <div className="flex flex-col h-[calc(100vh-100px)] -m-8">
              {/* Toolbar */}
              <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
                  <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              {analysis.title} 
                              <StatusBadge status={analysis.overallStatus} />
                          </h2>
                          <span className="text-xs text-slate-500 font-mono">{analysis.id} • {analysis.type}</span>
                      </div>
                  </div>
                  <div className="flex gap-3">
                        {approvalRecord ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                                <Lock className="h-3 w-3" /> LOCKED: {approvalRecord.envelopeId}
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setShowReportModal(true)}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 border border-transparent hover:border-slate-200 transition-all flex items-center gap-2"
                                    title="Generate PM Report"
                                >
                                    <MessageSquare className="h-5 w-5" />
                                    <span className="text-xs font-bold hidden md:inline">PM Report</span>
                                </button>
                                <button onClick={handleExportEvidence} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 border border-transparent hover:border-slate-200 transition-all">
                                    <Download className="h-5 w-5" />
                                </button>
                                {analysis.overallStatus === ComplianceStatus.PASS ? (
                                    <button onClick={handleApproveClick} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                                        <Check className="h-4 w-4" /> Approve
                                    </button>
                                ) : (
                                    <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                                        <X className="h-4 w-4" /> Reject
                                    </button>
                                )}
                            </>
                        )}
                  </div>
              </div>

              {/* Split View Container */}
              <div className="flex-1 flex overflow-hidden">
                  
                  {/* LEFT PANEL: Document Viewer (Source of Truth) */}
                  <div className="w-1/2 bg-slate-100 border-r border-slate-200 flex flex-col">
                      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                              <FileText className="h-4 w-4" /> Document Context
                          </span>
                          <span className="text-xs text-slate-400">Read-Only</span>
                      </div>
                      <div className="flex-1 overflow-auto p-8">
                          <div className="bg-white shadow-lg min-h-[800px] p-12 max-w-[800px] mx-auto text-slate-800 text-sm leading-relaxed font-serif whitespace-pre-wrap">
                              {promoText}
                          </div>
                      </div>
                  </div>

                  {/* RIGHT PANEL: Compliance Assistant (Agents) */}
                  <div className="w-1/2 bg-white flex flex-col">
                      {/* Tabs */}
                      <div className="flex border-b border-slate-200">
                          <button 
                            onClick={() => setActiveTab('findings')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'findings' ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                          >
                              Agent Findings
                          </button>
                          <button 
                            onClick={() => setActiveTab('claims')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'claims' ? 'border-blue-500 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                          >
                              Data Verification
                          </button>
                          <button 
                            onClick={() => setActiveTab('regulatory')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'regulatory' ? 'border-purple-500 text-purple-700 bg-purple-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                          >
                              Regulatory Strategy
                          </button>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 overflow-auto p-6 bg-slate-50/30">
                          
                          {activeTab === 'findings' && (
                              <div className="space-y-4">
                                  {/* Executive Summary Card */}
                                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                      <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                          <ShieldCheck className="h-5 w-5 text-emerald-600" /> Executive Summary
                                      </h3>
                                      <p className="text-sm text-slate-600 leading-relaxed">
                                          {analysis.executiveSummary}
                                      </p>
                                      <div className="mt-4 flex gap-2">
                                          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                                              Risk: {analysis.riskRating}
                                          </span>
                                          {analysis.escalation && (
                                              <span className={`text-xs font-mono px-2 py-1 rounded border ${analysis.escalation.level === 'RED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                  Escalation: {analysis.escalation.role}
                                              </span>
                                          )}
                                      </div>
                                  </div>

                                  {/* Agent Results Stream */}
                                  {analysis.agents.map((agent) => (
                                      <div key={agent.id} className={`bg-white p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${agent.status === ComplianceStatus.FAIL ? 'border-rose-200' : 'border-slate-200'}`}>
                                          <div className="flex justify-between items-start">
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${agent.status === ComplianceStatus.PASS ? 'bg-emerald-100 text-emerald-600' : agent.status === ComplianceStatus.FAIL ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                      {agent.status === ComplianceStatus.PASS ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                                  </div>
                                                  <div>
                                                      <h4 className="text-sm font-bold text-slate-900">{agent.agentName}</h4>
                                                      <span className="text-xs text-slate-400 font-mono">{new Date(agent.timestamp).toLocaleTimeString()}</span>
                                                  </div>
                                              </div>
                                              <StatusBadge status={agent.status} />
                                          </div>
                                          <p className="text-sm text-slate-600 mt-3 pl-11">
                                              {agent.description}
                                          </p>

                                          {/* Agent 3: Visual Prominence Detailed View (Enhanced OCR Logic) */}
                                          {agent.agentName.includes("Visual Prominence") && agent.evidence && typeof agent.evidence === 'object' && (agent.evidence as any).details && (
                                              <div className="mt-4 ml-11 border rounded-lg overflow-hidden border-slate-200">
                                                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex justify-between">
                                                      <span className="flex items-center gap-2"><Eye className="h-3 w-3"/> Enhanced Layout Analysis (COBS 4.5.2R)</span>
                                                  </div>
                                                  <table className="w-full text-xs text-left">
                                                      <thead className="bg-white text-slate-500 border-b border-slate-100">
                                                          <tr>
                                                              <th className="px-3 py-2">Location (Y-Axis)</th>
                                                              <th className="px-3 py-2">Score</th>
                                                              <th className="px-3 py-2">Verdict</th>
                                                          </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-slate-100">
                                                          {(agent.evidence as any).details.map((d: any, i: any) => (
                                                              <tr key={i} className="hover:bg-slate-50">
                                                                  <td className="px-3 py-2 font-mono text-slate-600">
                                                                      {d.yPos} (Page {d.page})
                                                                  </td>
                                                                  <td className="px-3 py-2">
                                                                      <div className="flex items-center gap-2">
                                                                           <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                               <div className={`h-full rounded-full ${parseFloat(d.prominenceScore) > 0.5 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${parseFloat(d.prominenceScore) * 100}%`}}></div>
                                                                           </div>
                                                                           <span className="font-bold">{d.prominenceScore}</span>
                                                                      </div>
                                                                  </td>
                                                                  <td className="px-3 py-2">
                                                                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${d.verdict.includes("BURIED") ? 'bg-rose-100 text-rose-800 border border-rose-200' : d.verdict.includes("WEAK") ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                                                                          {d.verdict}
                                                                      </span>
                                                                  </td>
                                                              </tr>
                                                          ))}
                                                      </tbody>
                                                  </table>
                                              </div>
                                          )}

                                          {/* Agent 5: AR Permissions Detailed View */}
                                          {agent.agentName.includes("AR Permissions") && analysis.arValidation && analysis.arValidation.violations && analysis.arValidation.violations.length > 0 && (
                                              <div className="mt-4 ml-11 border rounded-lg overflow-hidden border-rose-200">
                                                  <div className="bg-rose-50 px-3 py-2 border-b border-rose-200 text-xs font-bold text-rose-700 flex justify-between">
                                                      <span className="flex items-center gap-2"><AlertOctagon className="h-3 w-3"/> PERG 8 Permissions Breach</span>
                                                  </div>
                                                  <table className="w-full text-xs text-left">
                                                      <thead className="bg-white text-slate-500 border-b border-slate-100">
                                                          <tr>
                                                              <th className="px-3 py-2">Prohibited Term</th>
                                                              <th className="px-3 py-2">Rule / Constraint</th>
                                                              <th className="px-3 py-2">Severity</th>
                                                          </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-slate-100">
                                                          {analysis.arValidation.violations.map((v, i) => (
                                                              <tr key={i} className="hover:bg-slate-50">
                                                                  <td className="px-3 py-2 font-mono text-rose-700 font-bold bg-rose-50/50">
                                                                      "{v.keyword}"
                                                                  </td>
                                                                  <td className="px-3 py-2 text-slate-600">
                                                                      {v.rule}
                                                                  </td>
                                                                  <td className="px-3 py-2">
                                                                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${v.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-orange-100 text-orange-800 border border-orange-200'}`}>
                                                                          {v.severity}
                                                                      </span>
                                                                  </td>
                                                              </tr>
                                                          ))}
                                                      </tbody>
                                                  </table>
                                              </div>
                                          )}
                                          
                                          {/* Agent 6: Disclosures Detailed View */}
                                          {agent.agentName.includes("Disclosures") && analysis.disclosures && analysis.disclosures.length > 0 && (
                                              <div className="mt-4 ml-11 border rounded-lg overflow-hidden border-slate-200">
                                                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex justify-between">
                                                      <span>Mandatory Disclosure Check (NER)</span>
                                                  </div>
                                                  <table className="w-full text-xs text-left">
                                                      <thead className="bg-white text-slate-500 border-b border-slate-100">
                                                          <tr>
                                                              <th className="px-3 py-2">Disclosure Entity</th>
                                                              <th className="px-3 py-2">Status</th>
                                                              <th className="px-3 py-2">Action</th>
                                                          </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-slate-100">
                                                          {analysis.disclosures.map((d, i) => (
                                                              <tr key={i} className={`hover:bg-slate-50 ${!d.present ? 'bg-rose-50/30' : ''}`}>
                                                                  <td className="px-3 py-2 font-medium text-slate-700">
                                                                      {d.name}
                                                                      {d.rule && <div className="text-[10px] text-slate-400 font-mono">{d.rule}</div>}
                                                                  </td>
                                                                  <td className="px-3 py-2">
                                                                      {d.present ? (
                                                                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                                              <Check className="h-3 w-3" /> Found
                                                                          </span>
                                                                      ) : (
                                                                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${d.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-orange-100 text-orange-800 border border-orange-200'}`}>
                                                                              MISSING: {d.severity || 'HIGH'}
                                                                          </span>
                                                                      )}
                                                                  </td>
                                                                  <td className="px-3 py-2">
                                                                      {d.present ? (
                                                                          <div className="truncate max-w-[200px] text-slate-400 italic text-[10px]">"{d.extract.substring(0, 50)}..."</div>
                                                                      ) : (
                                                                          <div className="text-rose-700 text-[10px] font-mono bg-white p-1 rounded border border-rose-100">
                                                                              Fix: {d.remediation || "Add required disclosure."}
                                                                          </div>
                                                                      )}
                                                                  </td>
                                                              </tr>
                                                          ))}
                                                      </tbody>
                                                  </table>
                                              </div>
                                          )}

                                          {/* Agent 4: PRIN 2A Segment Analysis Visualization */}
                                          {agent.agentName.includes("Readability") && analysis.readability && analysis.readability.segments.length > 0 && (
                                              <div className="mt-4 ml-11 border rounded-lg overflow-hidden border-slate-200">
                                                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex justify-between">
                                                      <span>PRIN 2A Segment Analysis</span>
                                                      <span className={analysis.readability.prin2aCompliant ? 'text-emerald-600' : 'text-rose-600'}>
                                                          {analysis.readability.prin2aCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                                                      </span>
                                                  </div>
                                                  <table className="w-full text-xs text-left">
                                                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                                          <tr>
                                                              <th className="px-3 py-2">Segment</th>
                                                              <th className="px-3 py-2 text-center">Score</th>
                                                              <th className="px-3 py-2">Verdict</th>
                                                          </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-slate-100">
                                                          {analysis.readability.segments.map((seg, i) => (
                                                              <tr key={i} className="hover:bg-slate-50">
                                                                  <td className="px-3 py-2 text-slate-700 max-w-[200px] truncate" title={seg.text}>
                                                                      {seg.text}
                                                                  </td>
                                                                  <td className="px-3 py-2 text-center font-mono">
                                                                      {(seg.score * 100).toFixed(0)}
                                                                  </td>
                                                                  <td className="px-3 py-2">
                                                                      {seg.verdict === 'READABLE' ? (
                                                                           <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                                               <Check className="h-3 w-3" /> OK
                                                                           </span>
                                                                      ) : (
                                                                           <div className="flex flex-col">
                                                                               <span className="text-rose-600 font-bold flex items-center gap-1">
                                                                                   <AlertTriangle className="h-3 w-3" /> COMPLEX
                                                                               </span>
                                                                               <span className="text-[10px] text-slate-400 italic">
                                                                                   {seg.explanation}
                                                                               </span>
                                                                           </div>
                                                                      )}
                                                                  </td>
                                                              </tr>
                                                          ))}
                                                      </tbody>
                                                  </table>
                                              </div>
                                          )}

                                          {agent.citation && (
                                              <div className="ml-11 mt-2 inline-flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                  <BookOpen className="h-3 w-3" /> {agent.citation}
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          )}

                          {activeTab === 'claims' && (
                              <div className="space-y-4">
                                  <div className="flex items-center justify-between mb-2">
                                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Quant Verification</h3>
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                                          {analysis.claims.filter(c => c.status === 'VERIFIED').length}/{analysis.claims.length} Verified
                                      </span>
                                  </div>
                                  {analysis.claims.map((claim, idx) => (
                                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                                          <div className="flex gap-4">
                                              <div className="flex-1">
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Claim in Deck</label>
                                                  <p className="text-sm font-medium text-slate-900 mt-1 bg-yellow-50/50 p-1 rounded -ml-1">
                                                      "{claim.claim}"
                                                  </p>
                                              </div>
                                              <div className="flex items-center justify-center px-2">
                                                  <ArrowRight className="h-4 w-4 text-slate-300" />
                                              </div>
                                              <div className="flex-1">
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Truth Source</label>
                                                  <div className="flex items-center gap-2 mt-1">
                                                      {claim.status === 'VERIFIED' ? (
                                                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">Match</span>
                                                      ) : (
                                                          <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold">Mismatch</span>
                                                      )}
                                                      <span className="text-xs text-slate-500">{claim.matchScore}% Confidence</span>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}

                          {activeTab === 'regulatory' && (
                              <div className="space-y-6">
                                  <div className="bg-slate-900 text-slate-300 rounded-xl p-5 shadow-sm">
                                      <div className="flex items-center justify-between mb-4">
                                          <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                              <Lock className="h-4 w-4 text-amber-400"/> Golden Source Prompt
                                          </h3>
                                          <button 
                                            onClick={() => {
                                                if (analysis?.strategyPrompt) {
                                                    navigator.clipboard.writeText(analysis.strategyPrompt.instruction);
                                                    alert("Copied!");
                                                }
                                            }}
                                            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                          >
                                              <Copy className="h-3 w-3" /> Copy
                                          </button>
                                      </div>
                                      <div className="font-mono text-xs leading-relaxed opacity-80 bg-black/30 p-3 rounded-lg">
                                           {analysis.strategyPrompt?.instruction}
                                      </div>
                                  </div>
                                  
                                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                                      <h3 className="font-bold text-slate-900 mb-4">Detailed Regulatory Analysis</h3>
                                      <div className="prose prose-sm prose-slate max-w-none">
                                          <ReactMarkdown>{analysis.regulatoryAnalysis}</ReactMarkdown>
                                      </div>
                                  </div>
                              </div>
                          )}

                      </div>
                  </div>
              </div>

              {/* PM Report Modal */}
              {showReportModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full border border-slate-200 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-blue-600" /> PM Status Report
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Generated summary for Stakeholder/Project Manager communication.</p>
                             </div>
                             <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                                 <X className="h-6 w-6" />
                             </button>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-auto flex-1 font-mono text-xs text-slate-700 whitespace-pre-wrap">
                            {generatePMReport()}
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                            <button 
                                onClick={() => setShowReportModal(false)} 
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            <button 
                                onClick={handleCopyReport} 
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                {reportCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {reportCopied ? "Copied" : "Copy to Clipboard"}
                            </button>
                        </div>
                    </div>
                </div>
              )}

              {/* QES Modal */}
              {showQESModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
                          <div className="bg-slate-900 p-6 flex justify-between items-start">
                              <div>
                                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                      <Fingerprint className="h-6 w-6 text-emerald-400" /> Qualified Electronic Signature
                                  </h3>
                                  <p className="text-slate-400 text-xs mt-1">eIDAS Regulation (EU) No 910/2014 Compliant</p>
                              </div>
                              <button onClick={() => setShowQESModal(false)} className="text-slate-400 hover:text-white">
                                  <X className="h-6 w-6" />
                              </button>
                          </div>
                          
                          <div className="p-6 space-y-6">
                              {/* Step 1: Verification */}
                              <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                          <UserCheck className="h-4 w-4 text-blue-500" /> 1. Signer Identity Verification (SMF)
                                      </h4>
                                      {irnVerified ? (
                                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                              <Check className="h-3 w-3" /> VERIFIED
                                          </span>
                                      ) : (
                                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">REQUIRED</span>
                                      )}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                      <div className="flex-1 relative">
                                          <input 
                                              type="text" 
                                              value={signerIrn}
                                              onChange={(e) => setSignerIrn(e.target.value)}
                                              disabled={irnVerified || isVerifyingIrn}
                                              className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                                              placeholder="Enter FCA IRN (e.g. JXB12345)"
                                          />
                                      </div>
                                      <button 
                                          onClick={verifySigner}
                                          disabled={irnVerified || isVerifyingIrn || !signerIrn}
                                          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
                                      >
                                          {isVerifyingIrn ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : "Verify Identity"}
                                      </button>
                                  </div>

                                  {irnVerified && (
                                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-800 flex flex-col gap-1">
                                          <div className="flex justify-between">
                                              <span className="font-bold">Name:</span>
                                              <span>{signerName}</span>
                                          </div>
                                          <div className="flex justify-between">
                                              <span className="font-bold">Firm:</span>
                                              <span>{signerFirm}</span>
                                          </div>
                                          <div className="flex justify-between">
                                              <span className="font-bold">Active Roles:</span>
                                              <span className="font-bold text-right">{signerRoles.length > 0 ? signerRoles.join(', ') : 'None'}</span>
                                          </div>
                                      </div>
                                  )}
                              </div>

                              <hr className="border-slate-100" />

                              {/* Step 2: Signature */}
                              <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                          <Lock className="h-4 w-4 text-blue-500" /> 2. Digital Signature
                                      </h4>
                                      <button 
                                          onClick={clearSignature}
                                          disabled={!irnVerified}
                                          className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50 flex items-center gap-1"
                                      >
                                          <Eraser className="h-3 w-3" /> Clear
                                      </button>
                                  </div>
                                  
                                  <div className={`border-2 border-dashed rounded-xl h-40 relative ${irnVerified ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}>
                                      {!irnVerified && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10 text-slate-400 text-xs font-medium">
                                              Complete Identity Verification to Unlock
                                          </div>
                                      )}
                                      <canvas 
                                          ref={canvasRef}
                                          width={460}
                                          height={156}
                                          className="w-full h-full cursor-crosshair touch-none"
                                          onMouseDown={startDrawing}
                                          onMouseMove={draw}
                                          onMouseUp={stopDrawing}
                                          onMouseLeave={stopDrawing}
                                          onTouchStart={startDrawing}
                                          onTouchMove={draw}
                                          onTouchEnd={stopDrawing}
                                      />
                                  </div>
                                  <p className="text-[10px] text-slate-400 text-center">
                                      By signing, I confirm that I am {signerName} and I approve this promotion for release under the Senior Managers & Certification Regime.
                                  </p>
                              </div>
                          </div>

                          <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
                              <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hash Algorithm</span>
                                  <span className="text-xs font-mono text-slate-700">SHA-256 (HMAC)</span>
                              </div>
                              <div className="flex gap-3">
                                  <button 
                                      onClick={() => setShowQESModal(false)}
                                      className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                      Cancel
                                  </button>
                                  <button 
                                      onClick={submitSignature}
                                      disabled={!irnVerified || isSigning}
                                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2"
                                  >
                                      {isSigning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                      Sign & Lock
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  return null;
};