import React, { useState, useEffect } from 'react';
import { AuditTrailDocument } from '../types';
import { Lock, FileText, CheckCircle2, ShieldCheck, Fingerprint, Link, AlertTriangle, RefreshCw } from 'lucide-react';
import { FirestoreService } from '../services/firestore';
import { auditService } from '../services/geminiService';

export const AuditLog: React.FC = () => {
    const [auditLog, setAuditLog] = useState<AuditTrailDocument[]>([]);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{valid: boolean, brokenSequence?: number, count: number} | null>(null);

    const loadLogs = () => {
        const logs = FirestoreService.auditTrails.list();
        // Sorting sequence ascending for display is often better for chains, but audit logs are usually reverse chrono
        // We sort desc for display
        setAuditLog(logs);
    };

    useEffect(() => {
        loadLogs();
        const interval = setInterval(loadLogs, 5000); 
        return () => clearInterval(interval);
    }, []);

    const handleVerifyIntegrity = async () => {
        setVerifying(true);
        setVerificationResult(null);
        try {
            const result = await auditService.verifyChainIntegrity();
            setVerificationResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-xl relative overflow-hidden flex justify-between items-center">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <Lock className="h-6 w-6 text-emerald-400" />
                        Gem Memory (WORM Storage)
                    </h2>
                    <p className="text-slate-400 max-w-2xl">
                        Immutable Ledger. Every interaction is cryptographically hashed and signed using HMAC-SHA256. 
                        Compliant with SYSC 9 Record Keeping and MiFID II Durable Medium requirements.
                    </p>
                </div>
                <div className="relative z-10">
                     <button 
                        onClick={handleVerifyIntegrity}
                        disabled={verifying}
                        className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg border ${
                            verificationResult?.valid === true 
                            ? 'bg-emerald-600 border-emerald-500 text-white' 
                            : verificationResult?.valid === false
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white'
                        }`}
                     >
                        {verifying ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                        {verifying ? 'Verifying Chain...' : 'Verify Chain Integrity'}
                     </button>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-900/20 to-transparent pointer-events-none"></div>
            </div>

            {verificationResult && (
                <div className={`p-4 rounded-xl border flex items-center gap-4 ${verificationResult.valid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    {verificationResult.valid ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    ) : (
                        <AlertTriangle className="h-8 w-8 text-rose-600" />
                    )}
                    <div>
                        <h3 className="font-bold text-lg">{verificationResult.valid ? 'Ledger Integrity Verified' : 'TAMPERING DETECTED'}</h3>
                        <p className="text-sm">
                            {verificationResult.valid 
                                ? `Scanned ${verificationResult.count} blocks. All HMAC signatures valid. Chain continuity intact.`
                                : `CRITICAL FAILURE at Sequence #${verificationResult.brokenSequence}. The chain is broken.`}
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">Immutable Audit Chain (Live Firestore)</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        Total Blocks: {auditLog.length}
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {auditLog.map((entry, index) => (
                        <div key={entry.id} className="p-6 flex gap-6 hover:bg-slate-50 transition-colors group relative">
                            {/* Visual Chain Link */}
                            {index !== auditLog.length - 1 && (
                                <div className="absolute left-9 top-14 bottom-0 w-0.5 bg-slate-200 group-hover:bg-indigo-200 transition-colors"></div>
                            )}
                            
                            <div className="flex flex-col items-center z-10">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 font-mono text-xs font-bold">
                                    {entry.sequence_number}
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-lg">{entry.action}</span>
                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono border border-slate-200">{entry.promotion_id.split('-')[1]}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-500 font-mono block">{new Date(entry.timestamp).toLocaleString()}</span>
                                        {entry.hash && (
                                            <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1 mt-1">
                                                <Fingerprint className="h-3 w-3" /> HMAC Signed
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-3">Actor: <span className="font-medium bg-slate-100 px-2 py-0.5 rounded">{entry.actor}</span></p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-blue-50/50 p-3 rounded border border-blue-100 relative overflow-hidden">
                                        <div className="flex items-center gap-2 mb-1 text-blue-600 text-xs font-bold uppercase tracking-wider">
                                            <ShieldCheck className="h-3 w-3" /> Current Block Hash (HMAC)
                                        </div>
                                        <div className="font-mono text-xs text-blue-800 break-all opacity-90 relative z-10">
                                            {entry.hash}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                        <div className="flex items-center gap-2 mb-1 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                            <Link className="h-3 w-3" /> Previous Hash Link
                                        </div>
                                        <div className="font-mono text-xs text-slate-600 break-all">
                                            {entry.previous_hash}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-2">
                                     <details className="text-xs text-slate-400 cursor-pointer">
                                         <summary className="hover:text-slate-600 transition-colors">View Payload Snapshot</summary>
                                         <pre className="mt-2 bg-slate-900 text-slate-300 p-3 rounded overflow-x-auto font-mono">
                                             {entry.payload_snapshot}
                                         </pre>
                                     </details>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};