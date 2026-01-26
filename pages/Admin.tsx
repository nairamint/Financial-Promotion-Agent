import React, { useState } from 'react';
import { Settings, Users, Shield, Lock, Bell, ToggleLeft, ToggleRight, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { validateIndividualAuthorization } from '../services/geminiService';
import { IndividualValidation } from '../types';

export const Admin: React.FC = () => {
    const [users, setUsers] = useState<any[]>([
        { id: 1, name: "Julia Black", role: "Chair (SMF9)", irn: "JXB12345", status: "Active", details: null },
        { id: 2, name: "Paul Munson", role: "Compliance Lead (SMF16)", irn: "PXM67890", status: "Active", details: null },
        { id: 3, name: "Brian Abdelhadi", role: "Investment Manager (CF30)", irn: "JOB01749", status: "Pending Verification", details: null }
    ]);
    const [verifyingId, setVerifyingId] = useState<number | null>(null);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleVerify = async (id: number, irn: string) => {
        setVerifyingId(id);
        try {
            const result: IndividualValidation = await validateIndividualAuthorization(irn);
            setUsers(prev => prev.map(u => {
                if (u.id !== id) return u;
                return { 
                    ...u, 
                    status: result.isValid ? 'Active' : 'Inactive/Suspended',
                    details: result // Store full details including Controlled Functions
                };
            }));
            if (!expandedRows.includes(id)) {
                setExpandedRows(prev => [...prev, id]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setVerifyingId(null);
        }
    };

    const toggleRow = (id: number) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">System Administration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* General Settings */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-slate-500" /> Global Configuration
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">Strict Mode (COBS 4)</p>
                                    <p className="text-xs text-slate-500">Automatically reject submissions with High Risk ratings.</p>
                                </div>
                                <ToggleRight className="h-8 w-8 text-emerald-500 cursor-pointer" />
                            </div>
                            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">Maintenance Mode</p>
                                    <p className="text-xs text-slate-500">Disable new submissions during upgrades.</p>
                                </div>
                                <ToggleLeft className="h-8 w-8 text-slate-300 cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    {/* User Management Mock */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" /> Active Users (SMF)
                            </h3>
                            <button className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded">Add User</button>
                        </div>
                        <div className="w-full text-sm text-left">
                            <div className="bg-slate-50 text-slate-500 text-xs uppercase flex font-bold">
                                <div className="px-6 py-3 flex-1">User</div>
                                <div className="px-6 py-3 w-40">Role</div>
                                <div className="px-6 py-3 w-32">IRN (FCA)</div>
                                <div className="px-6 py-3 w-32">Status</div>
                                <div className="px-6 py-3 w-32">Action</div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {users.map(user => (
                                    <div key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center">
                                            <div className="px-6 py-4 flex-1 font-medium">{user.name}</div>
                                            <div className="px-6 py-4 w-40">{user.role}</div>
                                            <div className="px-6 py-4 w-32 font-mono text-xs">{user.irn}</div>
                                            <div className="px-6 py-4 w-32">
                                                {user.status === 'Active' ? (
                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle2 className="h-3 w-3"/> Active</span>
                                                ) : user.status === 'Pending Verification' ? (
                                                    <span className="text-amber-600 font-bold text-xs">Pending</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-rose-600 font-bold text-xs"><XCircle className="h-3 w-3"/> Inactive</span>
                                                )}
                                            </div>
                                            <div className="px-6 py-4 w-32 flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleVerify(user.id, user.irn)}
                                                    disabled={verifyingId === user.id}
                                                    className="text-xs border border-slate-200 hover:bg-slate-100 px-2 py-1 rounded flex items-center gap-1"
                                                >
                                                    {verifyingId === user.id && <Loader2 className="h-3 w-3 animate-spin"/>}
                                                    Verify
                                                </button>
                                                {user.details && (
                                                    <button onClick={() => toggleRow(user.id)} className="text-slate-400 hover:text-slate-600">
                                                        {expandedRows.includes(user.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Expanded Details View */}
                                        {expandedRows.includes(user.id) && user.details && (
                                            <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100">
                                                <div className="bg-white border border-slate-200 rounded-lg p-4">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                                        <Shield className="h-3 w-3 text-emerald-500" /> Active Controlled Functions (FCA Register)
                                                    </h4>
                                                    {user.details.controlledFunctions && user.details.controlledFunctions.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {user.details.controlledFunctions
                                                                .filter((f: any) => f.status === 'Current')
                                                                .map((func: any, i: number) => (
                                                                <div key={i} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                                                    <div>
                                                                        <p className="font-bold text-slate-800">{func.name}</p>
                                                                        <p className="text-xs text-slate-500">{func.firmName}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-mono">Since {func.effectiveDate}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">No active controlled functions found.</p>
                                                    )}
                                                    
                                                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                                                        <a href={user.details.detailsUrl} target="_blank" rel="noreferrer" className="hover:text-blue-600 flex items-center gap-1">
                                                            View full profile on FCA Register <ChevronDown className="h-3 w-3 -rotate-90"/>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-6 rounded-xl">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-400" /> Security Status
                        </h3>
                        <div className="space-y-3 text-sm opacity-80">
                            <div className="flex justify-between">
                                <span>MFA Enforced</span>
                                <span className="text-emerald-400 font-mono">ON</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Audit Logging</span>
                                <span className="text-emerald-400 font-mono">WORM-LOCKED</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Last Pen Test</span>
                                <span className="text-emerald-400 font-mono">10 DAYS AGO</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-amber-500" /> System Alerts
                        </h3>
                        <p className="text-xs text-slate-500">No active system alerts. All services operational.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};