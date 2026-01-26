
import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Search, BarChart3, TrendingUp, AlertOctagon, Network, Download, Plus } from 'lucide-react';
import { ARProfile, PrincipalNetworkScan, AppointedRepresentative } from '../types';
import { checkARAuthorization, scanPrincipalNetwork } from '../services/geminiService';
import { FirestoreService } from '../services/firestore';

export const ARGovernance: React.FC = () => {
    const [profiles, setProfiles] = useState<ARProfile[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Scanner State
    const [showScanner, setShowScanner] = useState(false);
    const [scanFrn, setScanFrn] = useState('712934');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<PrincipalNetworkScan | null>(null);

    // Load initial data from Firestore
    useEffect(() => {
        const load = () => {
            const data = FirestoreService.arProfiles.list();
            setProfiles(data);
        };
        load();
        // Optional: Poll for background updates
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, []);

    const syncFCAStatus = async () => {
        setIsSyncing(true);
        try {
            const updatedProfiles = await Promise.all(profiles.map(async (profile) => {
                const status = await checkARAuthorization(profile.frn);
                const updatedProfile = {
                    ...profile,
                    fcaStatus: status
                };
                // PERSIST: Update document in Firestore
                FirestoreService.arProfiles.save(updatedProfile);
                return updatedProfile;
            }));
            setProfiles(updatedProfiles);
        } catch (e) {
            console.error("Failed to sync FCA status", e);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleScanNetwork = async () => {
        setIsScanning(true);
        setScanResult(null);
        try {
            const result = await scanPrincipalNetwork(scanFrn);
            setScanResult(result);
        } catch (e) {
            console.error("Network Scan Failed", e);
        } finally {
            setIsScanning(false);
        }
    };

    const handleImportAR = (ar: AppointedRepresentative) => {
        if (profiles.some(p => p.frn === ar.frn)) {
            alert(`${ar.name} is already being monitored.`);
            return;
        }

        const newProfile: ARProfile = {
            id: `ar-${ar.frn}`,
            name: ar.name,
            frn: ar.frn,
            fcaStatus: {
                frn: ar.frn,
                firmName: ar.name,
                status: ar.status === 'Current' ? 'Appointed Representative' : 'De-authorised', // Initial mapping
                statusEffectiveDate: ar.effectiveDate,
                timestamp: new Date().toISOString()
            },
            riskScore: 50, // Default start
            submissionsCount: 0,
            violationsCount: 0,
            lastAuditDate: 'Pending',
            primaryContact: 'Unknown',
            revenue_ytd: 0,
            complaints_ytd: 0
        };

        FirestoreService.arProfiles.save(newProfile);
        setProfiles(prev => [...prev, newProfile]);
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Authorised':
            case 'Appointed Representative':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Suspended':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'De-authorised':
            case 'Not Found':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const formatCurrency = (val?: number) => val ? `£${(val/1000).toFixed(0)}k` : '-';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Appointed Representative (AR) Governance</h2>
                    <p className="text-slate-500 mt-1">Monitor network compliance, real-time FCA status, and risk exposure.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowScanner(true)}
                        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium"
                    >
                        <Network className="h-4 w-4" /> Scan Network
                    </button>
                    <button 
                        onClick={syncFCAStatus}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Status'}
                    </button>
                </div>
            </div>

            {/* Risk Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Network Health</p>
                    <div className="flex items-center justify-between mt-2">
                         <span className="text-2xl font-bold text-emerald-600">92%</span>
                         <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Compliant ARs</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Active Violations</p>
                    <div className="flex items-center justify-between mt-2">
                         <span className="text-2xl font-bold text-rose-600">{profiles.reduce((acc, p) => acc + (p.violationsCount || 0), 0)}</span>
                         <AlertTriangle className="h-5 w-5 text-rose-500" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Requires immediate attention</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase">FCA Status Alerts</p>
                    <div className="flex items-center justify-between mt-2">
                         <span className="text-2xl font-bold text-amber-600">{profiles.filter(p => p.fcaStatus.status === 'Suspended' || p.fcaStatus.status === 'De-authorised').length}</span>
                         <AlertOctagon className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Suspended/De-authorised</p>
                </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Total Revenue Risk</p>
                    <div className="flex items-center justify-between mt-2">
                         <span className="text-2xl font-bold text-slate-900">£{((profiles.reduce((acc, p) => acc + (p.revenue_ytd || 0), 0))/1000).toFixed(0)}k</span>
                         <BarChart3 className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Regulated Revenue YTD</p>
                </div>
            </div>

            {/* AR Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-slate-500" />
                        <h3 className="font-semibold text-slate-900">Registered Appointed Representatives</h3>
                    </div>
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search FRN or Name..." className="pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 font-medium">Firm Name / FRN</th>
                                <th className="px-6 py-3 font-medium">FCA Status</th>
                                <th className="px-6 py-3 font-medium text-center">Risk Score</th>
                                <th className="px-6 py-3 font-medium text-center">Violations</th>
                                <th className="px-6 py-3 font-medium text-right">Revenue YTD</th>
                                <th className="px-6 py-3 font-medium text-center">Complaints</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {profiles.map((ar) => (
                                <tr key={ar.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{ar.name}</div>
                                        <div className="text-xs text-slate-500 font-mono">FRN: {ar.frn}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ar.fcaStatus.status)}`}>
                                            {ar.fcaStatus.status === 'Authorised' || ar.fcaStatus.status === 'Appointed Representative' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                            {ar.fcaStatus.status}
                                        </span>
                                        <div className="text-[10px] text-slate-400 mt-1">Checked: {new Date(ar.fcaStatus.timestamp).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-block px-2 py-1 rounded font-bold text-xs" style={{ 
                                            backgroundColor: ar.riskScore > 50 ? '#fee2e2' : '#dcfce7', 
                                            color: ar.riskScore > 50 ? '#991b1b' : '#166534' 
                                        }}>
                                            {ar.riskScore}/100
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         {ar.violationsCount > 0 ? (
                                             <span className="text-rose-600 font-bold">{ar.violationsCount}</span>
                                         ) : (
                                             <span className="text-slate-400">-</span>
                                         )}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                                        {formatCurrency(ar.revenue_ytd)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {(ar.complaints_ytd || 0) > 0 ? (
                                            <span className="text-amber-600 font-bold">{ar.complaints_ytd}</span>
                                        ) : (
                                            <span className="text-emerald-600 font-bold">0</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-emerald-600 hover:text-emerald-800 font-medium text-xs">View Profile</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Network Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-900 p-6 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Network className="h-6 w-6 text-emerald-400" /> Principal Network Scanner
                                </h3>
                                <p className="text-slate-400 text-xs mt-1">Discover Appointed Representatives via FCA API (/V0.1/Firm/FRN/AR)</p>
                            </div>
                            <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-white">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Principal Firm FRN</label>
                                    <input 
                                        type="text" 
                                        value={scanFrn}
                                        onChange={(e) => setScanFrn(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="e.g. 712934"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={handleScanNetwork}
                                        disabled={isScanning || !scanFrn}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 h-[42px]"
                                    >
                                        {isScanning ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
                                        Scan
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-6 bg-white">
                            {scanResult ? (
                                <div className="space-y-6">
                                    {/* Current ARs */}
                                    <div>
                                        <h4 className="font-bold text-emerald-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide bg-emerald-50 p-2 rounded">
                                            <CheckCircle2 className="h-4 w-4" /> Current Appointed Representatives ({scanResult.currentARs.length})
                                        </h4>
                                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                                            {scanResult.currentARs.length > 0 ? scanResult.currentARs.map((ar, i) => (
                                                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                                    <div>
                                                        <p className="font-bold text-slate-900">{ar.name}</p>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                            <span className="font-mono bg-slate-100 px-1.5 rounded">FRN: {ar.frn}</span>
                                                            <span>Effective: {ar.effectiveDate}</span>
                                                            <span className="border border-slate-200 px-1.5 rounded">{ar.recordSubType}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleImportAR(ar)}
                                                        className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded border border-emerald-200 font-medium flex items-center gap-1 transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3" /> Monitor
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="p-4 text-sm text-slate-400 italic">No current ARs found.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Previous ARs */}
                                    <div>
                                        <h4 className="font-bold text-slate-600 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide bg-slate-100 p-2 rounded">
                                            <AlertTriangle className="h-4 w-4" /> Historical / Previous ARs ({scanResult.previousARs.length})
                                        </h4>
                                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                                            {scanResult.previousARs.length > 0 ? scanResult.previousARs.map((ar, i) => (
                                                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 opacity-75">
                                                    <div>
                                                        <p className="font-bold text-slate-700">{ar.name}</p>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                            <span className="font-mono bg-slate-100 px-1.5 rounded">FRN: {ar.frn}</span>
                                                            <span className="text-rose-600 font-bold">Terminated: {ar.terminationDate}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleImportAR(ar)}
                                                        className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded border border-slate-200 font-medium flex items-center gap-1 transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3" /> Import Record
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="p-4 text-sm text-slate-400 italic">No historical ARs found.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                    <Network className="h-12 w-12 mb-3 opacity-20" />
                                    <p className="text-sm">Enter a Principal FRN to discover linked firms.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
