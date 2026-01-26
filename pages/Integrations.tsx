import React, { useState } from 'react';
import { Share2, CheckCircle2, XCircle, RefreshCw, Server, Globe, Shield, Database } from 'lucide-react';

export const Integrations: React.FC = () => {
    const [connections, setConnections] = useState([
        { id: 1, name: "FCA Register API", type: "Regulatory Data", status: "Connected", latency: "120ms", icon: Globe },
        { id: 2, name: "Google Cloud Storage (WORM)", type: "Infrastructure", status: "Connected", latency: "45ms", icon: Database },
        { id: 3, name: "DocuSign eSignature", type: "Identity", status: "Connected", latency: "320ms", icon: Shield },
        { id: 4, name: "Companies House", type: "Data Enrichment", status: "Disconnected", latency: "-", icon: Server },
    ]);

    const handleTest = (id: number) => {
        setConnections(prev => prev.map(c => {
            if (c.id !== id) return c;
            return { ...c, status: "Testing..." };
        }));
        
        setTimeout(() => {
            setConnections(prev => prev.map(c => {
                if (c.id !== id) return c;
                return { ...c, status: "Connected", latency: Math.floor(Math.random() * 200 + 50) + "ms" };
            }));
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Share2 className="h-6 w-6" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900">Integrations Hub</h2>
                    <p className="text-slate-500 mt-1">Manage external data providers and infrastructure connections.</p>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {connections.map((conn) => (
                    <div key={conn.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                <conn.icon className="h-6 w-6 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{conn.name}</h3>
                                <p className="text-xs text-slate-500 mb-2">{conn.type}</p>
                                <div className="flex items-center gap-2">
                                    {conn.status === 'Connected' && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"><CheckCircle2 className="h-3 w-3"/> Connected</span>}
                                    {conn.status === 'Disconnected' && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"><XCircle className="h-3 w-3"/> Offline</span>}
                                    {conn.status === 'Testing...' && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100"><RefreshCw className="h-3 w-3 animate-spin"/> Testing</span>}
                                    
                                    <span className="text-xs font-mono text-slate-400 ml-2">{conn.latency}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => handleTest(conn.id)}
                                className="text-xs font-bold text-slate-600 border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 transition-colors"
                            >
                                Test
                            </button>
                            <button className="text-xs font-bold text-slate-600 border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 transition-colors">
                                Configure
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
