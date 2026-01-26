
import React, { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestore';
import { 
    Download, FileText, CheckCircle2, AlertTriangle, Clock, 
    ShieldCheck, Database, Calendar, RefreshCw
} from 'lucide-react';

export const Reports: React.FC = () => {
    // Reporting Status Data (Simulated for Demo)
    const reportingStatus = [
        { report: "REP024 (Bi-Annual Approvals)", frequency: "6 Months", lastSub: "Aug 15, 2025", nextDue: "Feb 28, 2026", status: "In Progress", completeness: 67, urgency: "High" },
        { report: "AR Complaints Data (Annual)", frequency: "Annual", lastSub: "Jan 31, 2025", nextDue: "Jan 31, 2026", status: "Late Risk", completeness: 40, urgency: "Critical" },
        { report: "AR Revenue Reporting (Annual)", frequency: "Annual", lastSub: "Jan 31, 2025", nextDue: "Jan 31, 2026", status: "Late Risk", completeness: 40, urgency: "Critical" },
        { report: "Crypto Asset Notification", frequency: "Ad-hoc (7-day)", lastSub: "N/A", nextDue: "N/A", status: "Compliant", completeness: 100, urgency: "Low" },
    ];

    // Evidence Readiness Data
    const evidenceReadiness = [
        { control: "COBS 4.2.1R Substantiation", type: "Agent 2 Verification Logs", lastAudit: "Jan 15, 2026", accessTime: "<30s", status: "Ready" },
        { control: "PRIN 2A Consumer Duty", type: "Agent 4 Readability Scores", lastAudit: "Jan 12, 2026", accessTime: "<30s", status: "Ready" },
        { control: "SM&CR Accountability", type: "CF30 Digital Signatures", lastAudit: "Jan 20, 2026", accessTime: "<30s", status: "Ready" },
        { control: "SYSC 9 Audit Trail", type: "GCS Immutable Bucket Log", lastAudit: "Jan 18, 2026", accessTime: "<30s", status: "Ready" },
        { control: "PERG 8 AR Permissions", type: "AR Violation Matrix", lastAudit: "Jan 10, 2026", accessTime: "<1min", status: "Refresh Needed" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" /> Audit & Evidence Dashboard
                    </h2>
                    <p className="text-slate-500 mt-1">FCA Regulatory Reporting Status (REP024) & Inspection Readiness.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm font-bold shadow-md transition-all">
                    <Download className="h-4 w-4" /> Export Evidence Pack
                </button>
            </div>

            {/* Section 1: Regulatory Reporting Status */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-600" /> Regulatory Reporting Status
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Deadlines & Completion Tracking</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-500 uppercase text-xs border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold">Report Name</th>
                                <th className="px-6 py-4 font-bold">Frequency</th>
                                <th className="px-6 py-4 font-bold">Next Due</th>
                                <th className="px-6 py-4 font-bold text-center">Status</th>
                                <th className="px-6 py-4 font-bold w-48">Completeness</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportingStatus.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-800">{row.report}</td>
                                    <td className="px-6 py-4 text-slate-500">{row.frequency}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${row.urgency === 'Critical' ? 'text-rose-600' : 'text-slate-700'}`}>
                                                {row.nextDue}
                                            </span>
                                            {row.nextDue !== 'N/A' && (
                                                <span className="text-[10px] text-slate-400">
                                                    (Last: {row.lastSub})
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                            row.status === 'Compliant' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            row.status.includes('Risk') ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                            'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                            {row.status === 'Compliant' ? <CheckCircle2 className="h-3 w-3" /> : 
                                             row.status.includes('Risk') ? <AlertTriangle className="h-3 w-3" /> :
                                             <Clock className="h-3 w-3" />}
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        row.completeness === 100 ? 'bg-emerald-500' :
                                                        row.completeness < 50 ? 'bg-rose-500' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${row.completeness}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold w-8">{row.completeness}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: Control Evidence Readiness */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            <Database className="h-5 w-5 text-indigo-600" /> Control Evidence Readiness
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Data Availability for Unannounced FCA Inspection (Target: &lt;48h)</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <ShieldCheck className="h-4 w-4" /> System Ready
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-500 uppercase text-xs border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold">Control Objective</th>
                                <th className="px-6 py-4 font-bold">Evidence Type</th>
                                <th className="px-6 py-4 font-bold">Last Audit</th>
                                <th className="px-6 py-4 font-bold">Retrieval Time</th>
                                <th className="px-6 py-4 font-bold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {evidenceReadiness.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-800">{row.control}</td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{row.type}</td>
                                    <td className="px-6 py-4 text-slate-600">{row.lastAudit}</td>
                                    <td className="px-6 py-4 font-bold text-emerald-600">{row.accessTime}</td>
                                    <td className="px-6 py-4 text-center">
                                        {row.status === 'Ready' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                <CheckCircle2 className="h-3 w-3" /> Ready
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                <RefreshCw className="h-3 w-3" /> Refresh
                                            </span>
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
