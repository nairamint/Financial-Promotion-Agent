
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { StatusBadge } from '../components/StatusBadge';
import { FirestoreService } from '../services/firestore';
import { PromotionDocument, RiskRating } from '../types';
import { 
    AlertTriangle, CheckCircle2, ArrowRight, TrendingUp, Download, Calendar, 
    Activity, Layers, Bell, ShieldCheck, UserCheck, AlertOctagon, Timer, 
    FileText, Network, Clock
} from 'lucide-react';

interface DashboardProps {
    onNavigate: (page: string, id?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentFailures, setRecentFailures] = useState<PromotionDocument[]>([]);

  useEffect(() => {
    const loadData = () => {
        setStats(FirestoreService.analytics.getExecutiveDashboardStats());
        setRecentFailures(FirestoreService.analytics.getRecentFailures());
    };
    
    loadData();
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="p-8 text-center text-slate-500">Loading Executive View...</div>;

  const rejectionRate = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;
  const healthScore = Math.max(0, 100 - rejectionRate - (stats.critical * 5));

  const donutData = [
      { name: 'Approved', value: stats.approved },
      { name: 'Rejected', value: stats.rejected },
      { name: 'Pending', value: stats.pending }
  ];
  const DONUT_COLORS = ['#10b981', '#f43f5e', '#f59e0b'];

  return (
    <div className="space-y-8">
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-2 border-b border-slate-200">
        <div>
           <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
               <ShieldCheck className="h-6 w-6 text-emerald-600" /> Executive Control Dashboard
           </h2>
           <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time Regulatory Posture • SM&CR Oversight • FCA Gateway Status
           </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
              <Calendar className="w-4 h-4"/>
              <span>Last 7 Days</span>
           </div>
           <button className="bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-lg text-xs px-4 py-2 flex items-center gap-2 shadow-lg transition-all">
              <Download className="w-4 h-4"/> Board Pack (PDF)
           </button>
        </div>
      </div>

      {/* Row 1: Regulatory Health Scorecard (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Compliance Health */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compliance Score</h3>
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <Activity className="h-4 w-4" />
                </div>
             </div>
             <div className="flex items-end gap-2">
                 <span className="text-3xl font-bold text-slate-900">{healthScore.toFixed(0)}</span>
                 <span className="text-xs font-bold text-slate-400 mb-1">/ 100</span>
                 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mb-1 flex items-center gap-1">
                     <TrendingUp className="h-3 w-3" /> +2.4%
                 </span>
             </div>
             <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                 <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${healthScore}%` }}></div>
             </div>
        </div>

        {/* KPI 2: Total Volume & Gateway Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-all">
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Vol.</h3>
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <Layers className="h-4 w-4" />
                </div>
             </div>
             <div className="flex items-end gap-2">
                 <span className="text-3xl font-bold text-slate-900">{stats.total}</span>
                 <span className="text-xs font-bold text-slate-400 mb-1">Submissions</span>
             </div>
             <div className="flex items-center gap-2 mt-3 text-xs">
                 <span className="text-slate-500">First-Pass Approval:</span>
                 <span className="font-bold text-slate-700">68%</span>
                 <span className="text-amber-500 font-bold text-[10px]">(Target: 85%)</span>
             </div>
        </div>

        {/* KPI 3: Pending Review (SLA Focused) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm group hover:border-amber-300 transition-all">
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending (SLA)</h3>
                <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                    <Timer className="h-4 w-4" />
                </div>
             </div>
             <div className="flex items-end gap-2">
                 <span className="text-3xl font-bold text-slate-900">{stats.pending}</span>
                 <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mb-1">
                     {stats.slaBreaches} Breached
                 </span>
             </div>
             <div className="mt-3 flex gap-1 items-center">
                 <span className="text-xs text-slate-500">At Risk (<24h left):</span>
                 <span className="text-xs font-bold text-slate-900">{stats.slaAtRisk}</span>
             </div>
        </div>

        {/* KPI 4: Critical Regulatory Risk */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm group hover:border-rose-300 transition-all">
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Failures</h3>
                <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
                    <AlertOctagon className="h-4 w-4" />
                </div>
             </div>
             <div className="flex items-end gap-2">
                 <span className="text-3xl font-bold text-rose-600">{stats.critical}</span>
                 <span className="text-sm text-slate-400 mb-1">Active</span>
             </div>
             <p className="text-xs text-rose-600/80 font-medium mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Immediate Remediation
             </p>
        </div>
      </div>

      {/* Row 2: Operational Oversight Grid (SM&CR / AR / Reporting) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* SM&CR Sign-Off Status */}
          <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg flex flex-col justify-between">
              <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-400" /> SM&CR Accountability
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">{stats.pendingSMCR}</span>
                      <span className="text-xs text-slate-400">Pending CF30 Attestation</span>
                  </div>
              </div>
              <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                       <span>Compliance: 92%</span>
                       <span className="text-white">1 Pending > 48h</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-1.5 rounded-full w-[92%]"></div>
                  </div>
              </div>
          </div>

          {/* AR Network Health */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Network className="h-4 w-4 text-blue-500" /> AR Network Risk
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-rose-600">{stats.highRiskARs}</span>
                      <span className="text-xs text-slate-500">High Risk ARs (of {stats.totalARs})</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Principal Oversight Obligation</p>
              </div>
              <button 
                onClick={() => onNavigate('ar-governance')}
                className="mt-2 text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                  View Network <ArrowRight className="h-3 w-3"/>
              </button>
          </div>

          {/* Attestation Monitor */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" /> Post-Approval Review
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">12</span>
                      <span className="text-xs text-slate-500">Due Re-Attestation</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Next 30 Days (COBS 4.10.2R)</p>
              </div>
              <div className="flex -space-x-2 mt-2">
                  <span className="h-6 w-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold">FP</span>
                  <span className="h-6 w-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold">Q1</span>
                  <span className="h-6 w-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[8px] font-bold">+9</span>
              </div>
          </div>

          {/* FCA Reporting Status */}
          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" /> FCA Reporting
                  </h3>
                  <div className="mt-3">
                       <span className="text-lg font-bold text-slate-900">REP024</span>
                       <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Due: Feb 28</span>
                           <span className="text-xs text-slate-500">32 Days left</span>
                       </div>
                  </div>
              </div>
              <button 
                onClick={() => onNavigate('reports')}
                className="mt-3 w-full py-1.5 rounded border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors"
              >
                  Status: In Progress
              </button>
          </div>

      </div>

      {/* Row 3: Charts & Critical Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trend Analysis (Enhanced with Severity Bands) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="font-bold text-slate-900">Compliance & Risk Trend</h3>
                      <p className="text-xs text-slate-500">Breach Severity Analysis (7-Day)</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Compliance %
                      </div>
                      <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Critical Breach
                      </div>
                  </div>
              </div>
              <div className="h-[280px] w-full relative">
                  {/* Severity Band Overlay Mockup */}
                  <div className="absolute inset-0 pointer-events-none opacity-5 flex flex-col">
                       <div className="bg-emerald-500 h-[20%] w-full"></div>
                       <div className="bg-amber-500 h-[20%] w-full"></div>
                       <div className="bg-rose-500 h-[60%] w-full"></div>
                  </div>
                  
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" dy={10} />
                          <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                          <Tooltip 
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                          />
                          <Area type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorComp)" />
                          <Area type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Triage Queue (Enhanced with Ownership) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[380px]">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center rounded-t-xl">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-rose-500" /> Critical Triage
                    </h3>
                    <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">{recentFailures.length}</span>
                </div>
                
                <div className="flex-1 overflow-auto p-0">
                    {recentFailures.length > 0 ? recentFailures.map((item, i) => (
                        <div 
                            key={i} 
                            onClick={() => onNavigate('review', item.id)}
                            className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-all group relative"
                        >
                             {item.sla_status === 'Breached' && (
                                 <div className="absolute right-0 top-0 text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-bl-lg">
                                     SLA BREACH
                                 </div>
                             )}
                             
                             <div className="flex justify-between items-start mb-1">
                                 <div className="flex items-center gap-2">
                                    <StatusBadge status={item.risk_rating} type="risk" />
                                    <span className="text-[10px] text-slate-400 font-mono">{new Date(item.submission_date).toLocaleDateString()}</span>
                                 </div>
                             </div>
                             <p className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-600 line-clamp-1">{item.title}</p>
                             
                             <div className="flex items-center justify-between mt-2">
                                 <div className="flex items-center gap-1.5">
                                    <div className="h-4 w-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                                        {item.assigned_to ? item.assigned_to.split(' ').map(n=>n[0]).join('').substring(0,2) : 'UA'}
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[100px]">
                                        {item.assigned_to || 'Unassigned'}
                                    </span>
                                 </div>
                                 <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-all" />
                             </div>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <CheckCircle2 className="h-10 w-10 mb-3 opacity-20" />
                            <p className="text-sm font-medium">Inbox Zero</p>
                        </div>
                    )}
                </div>
          </div>

      </div>
    </div>
  );
};
