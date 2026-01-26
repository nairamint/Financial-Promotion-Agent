import React, { useState } from 'react';
import { 
    ClipboardCheck, CheckCircle2, XCircle, AlertCircle, Play, FileText, ChevronDown, ChevronUp, 
    UserCheck, ShieldCheck, Database, Lock, PenTool
} from 'lucide-react';
import { FirestoreService } from '../services/firestore';
import { AuditTrailDocument } from '../types';

interface TestCase {
    id: string;
    category: string;
    title: string;
    description: string;
    expectedResult: string;
    status: 'PENDING' | 'PASS' | 'FAIL';
    notes?: string;
}

const initialTestCases: TestCase[] = [
    {
        id: 'UAT-001',
        category: 'Intake & OCR',
        title: 'PDF Table Extraction',
        description: 'Upload a PDF containing a financial performance table. Check if columns are preserved in "Document Context".',
        expectedResult: 'Text is legible with clear separation between numerical columns.',
        status: 'PENDING'
    },
    {
        id: 'UAT-002',
        category: 'Agent Logic',
        title: 'AR Status: Suspended Firm',
        description: 'Input FRN "123456" (Suspended) in the Analysis setup.',
        expectedResult: 'Agent 5 returns FAIL. Risk Rating >= HIGH. AR Status = Suspended.',
        status: 'PENDING'
    },
    {
        id: 'UAT-003',
        category: 'Agent Logic',
        title: 'Quant Verification Match',
        description: 'Analyze a deck claiming "5.5% Return" against a Source Doc with "5.5% Return".',
        expectedResult: 'Agent 2 Verification: 100% Match / Verified.',
        status: 'PENDING'
    },
    {
        id: 'UAT-004',
        category: 'Visual AI',
        title: 'Risk Warning Prominence',
        description: 'Upload a PDF with the risk warning in small text at the very bottom (footer).',
        expectedResult: 'Agent 3 returns REFER or FAIL with "Low Prominence (Bottom 10%)" warning.',
        status: 'PENDING'
    },
    {
        id: 'UAT-005',
        category: 'Governance',
        title: 'Digital Signature Locking',
        description: 'Perform "Approve" action on a passing document. Sign with canvas.',
        expectedResult: 'Document Status -> Locked. Hash Chain entry created in Audit Log.',
        status: 'PENDING'
    },
    {
        id: 'UAT-006',
        category: 'Governance',
        title: 'Audit Trail Immutability',
        description: 'Check the Audit Log page after signing.',
        expectedResult: 'Entry visible with "QES_SIGN_OFF" action and SHA-256 hash.',
        status: 'PENDING'
    }
];

export const UATPortal: React.FC = () => {
    const [testCases, setTestCases] = useState<TestCase[]>(initialTestCases);
    const [testerName, setTesterName] = useState('Paul Munson (SMF16)');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uatComplete, setUatComplete] = useState(false);

    const handleStatusChange = (id: string, status: 'PASS' | 'FAIL') => {
        setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, status } : tc));
    };

    const handleNotesChange = (id: string, notes: string) => {
        setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, notes } : tc));
    };

    const calculateProgress = () => {
        const completed = testCases.filter(tc => tc.status !== 'PENDING').length;
        return Math.round((completed / testCases.length) * 100);
    };

    const handleSignOff = () => {
        const allPassed = testCases.every(tc => tc.status === 'PASS');
        if (!allPassed) {
            if(!confirm("Some tests have Failed or are Pending. Sign off anyway?")) return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            // Log to Audit Trail
            const auditEntry: AuditTrailDocument = {
                id: `LOG-UAT-${Date.now()}`,
                sequence_number: 1, // Mock
                payload_snapshot: JSON.stringify({ action: 'UAT_SIGN_OFF' }),
                promotion_id: 'SYSTEM_UAT_CYCLE_1',
                action: 'UAT_SIGN_OFF',
                actor: testerName,
                timestamp: new Date().toISOString(),
                hash: `SHA-256:UAT_VERIFIED_${Date.now()}`,
                previous_hash: '...'
            };
            FirestoreService.auditTrails.log(auditEntry);
            
            setUatComplete(true);
            setIsSubmitting(false);
        }, 1500);
    };

    if (uatComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                    <ClipboardCheck className="h-12 w-12 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">UAT Cycle Complete</h2>
                    <p className="text-slate-500 mt-2">Validation Certificate Generated & Logged.</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-left max-w-md w-full">
                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Acceptance Summary</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Tester:</span>
                            <span className="font-medium text-slate-900">{testerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Date:</span>
                            <span className="font-medium text-slate-900">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Pass Rate:</span>
                            <span className="font-medium text-emerald-600">
                                {Math.round((testCases.filter(t => t.status === 'PASS').length / testCases.length) * 100)}%
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Proof Hash:</span>
                            <span className="font-mono text-xs text-slate-400">SHA-256:8f4...b21</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setUatComplete(false)}
                    className="text-slate-500 hover:text-slate-800 underline"
                >
                    Start New Cycle
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-900 text-white p-8 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <ClipboardCheck className="h-8 w-8 text-emerald-400" />
                        User Acceptance Testing (UAT) Portal
                    </h2>
                    <p className="text-slate-400 mt-2">
                        Compliance Assurance Team • Release Candidate v2.3.0
                    </p>
                </div>
                <div className="mt-4 md:mt-0 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Progress</p>
                    <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${calculateProgress()}%` }}
                            ></div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">{calculateProgress()}%</span>
                    </div>
                </div>
            </div>

            {/* Tester Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-6">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Testing As</label>
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        <select 
                            value={testerName} 
                            onChange={(e) => setTesterName(e.target.value)}
                            className="font-bold text-slate-900 bg-transparent border-none focus:ring-0 cursor-pointer text-lg p-0"
                        >
                            <option>Paul Munson (SMF16)</option>
                            <option>Julia Black (Chair)</option>
                            <option>External Auditor (KPMG)</option>
                        </select>
                    </div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Environment</label>
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-amber-500" />
                        <span className="font-bold text-slate-900">Staging / Sandbox</span>
                    </div>
                </div>
            </div>

            {/* Test Cases List */}
            <div className="space-y-4">
                {testCases.map((tc) => (
                    <div key={tc.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                        <div className="p-6 flex flex-col md:flex-row gap-6">
                            {/* Status Indicator */}
                            <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-slate-100 pr-6">
                                {tc.status === 'PENDING' && <div className="w-10 h-10 rounded-full border-4 border-slate-200 bg-slate-50"></div>}
                                {tc.status === 'PASS' && <CheckCircle2 className="w-10 h-10 text-emerald-500" />}
                                {tc.status === 'FAIL' && <XCircle className="w-10 h-10 text-rose-500" />}
                                <span className="text-[10px] font-bold mt-2 text-slate-400 uppercase tracking-wider">{tc.status}</span>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tc.id}</span>
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{tc.category}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{tc.title}</h3>
                                <p className="text-sm text-slate-600 mb-4">{tc.description}</p>
                                
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3" /> Expected Result
                                    </p>
                                    <p className="text-sm text-slate-700">{tc.expectedResult}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 min-w-[200px] border-l border-slate-100 pl-6 justify-center">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleStatusChange(tc.id, 'PASS')}
                                        className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                                            tc.status === 'PASS' 
                                            ? 'bg-emerald-600 text-white shadow-md' 
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
                                        }`}
                                    >
                                        <CheckCircle2 className="h-3 w-3" /> Pass
                                    </button>
                                    <button 
                                        onClick={() => handleStatusChange(tc.id, 'FAIL')}
                                        className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                                            tc.status === 'FAIL' 
                                            ? 'bg-rose-600 text-white shadow-md' 
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700'
                                        }`}
                                    >
                                        <XCircle className="h-3 w-3" /> Fail
                                    </button>
                                </div>
                                <textarea 
                                    placeholder="Add tester notes..." 
                                    className="w-full text-xs p-2 border border-slate-200 rounded-lg h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    value={tc.notes || ''}
                                    onChange={(e) => handleNotesChange(tc.id, e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Sign-off */}
            <div className="flex justify-end pt-6 pb-20">
                <button 
                    onClick={handleSignOff}
                    disabled={isSubmitting}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl transition-all hover:scale-105 disabled:opacity-70 disabled:scale-100"
                >
                    {isSubmitting ? (
                        <>Processing Audit Chain...</>
                    ) : (
                        <>
                            <PenTool className="h-5 w-5" /> Sign Off Release v2.3.0
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};