import React, { useState, useEffect } from 'react';
import { 
    Settings, CheckCircle2, Circle, Save, 
    Plus, Trash2, LayoutTemplate, 
    ShieldCheck, Cpu, User, ChevronDown, ChevronUp, FileText, 
    Mail, Bell, Eye, EyeOff, UserCircle, ArrowRight, X
} from 'lucide-react';
import { FirestoreService } from '../services/firestore';

// --- Types ---

interface TeamMember {
    id: string;
    name: string;
    role: string;
    email: string;
    initials: string;
    color: string;
    avatarUrl?: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  required: boolean;
  automated: boolean;
  agent: string; // The generic role/agent
  assigneeId?: string; // The specific human team member responsible
  notifyEmail: boolean; // Whether to email them on status change
}

interface WorkflowPhase {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  colorTheme?: string;
}

// --- Mock Team Data ---

const TEAM_MEMBERS: TeamMember[] = [
    { id: 'u1', name: 'Julia Black', role: 'Chair (SMF9)', email: 'julia.black@complia.firm', initials: 'JB', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { id: 'u2', name: 'Paul Munson', role: 'Compliance Lead (SMF16)', email: 'paul.munson@complia.firm', initials: 'PM', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'u3', name: 'Sarah Jenkins', role: 'Marketing Director', email: 'sarah.j@complia.firm', initials: 'SJ', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    { id: 'u4', name: 'Mike Ross', role: 'Investment Analyst', email: 'mike.ross@complia.firm', initials: 'MR', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'u5', name: 'Brian Abdelhadi', role: 'Ext. Counsel', email: 'brian.a@legal.firm', initials: 'BA', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

const AVAILABLE_AGENTS = [
    'System',
    'Agent 1 (Classification)',
    'Agent 2 (Data Consistency)',
    'Agent 3 (Visual)',
    'Agent 4 (Readability)',
    'Agent 5 (AR Permissions)',
    'Agent 6 (Disclosures)',
    'Agent 7 (Audit)',
    'Agent 8 (Approval)'
];

// --- Templates ---

const STANDARD_TEMPLATE: WorkflowPhase[] = [
  {
    id: 'p1',
    title: 'Phase 1: Deck Preparation',
    description: 'Initial drafting and format conversion.',
    colorTheme: 'blue',
    steps: [
      { id: 'p1-1', name: 'Draft Deck (Client)', required: true, automated: false, agent: 'Client', assigneeId: 'u3', notifyEmail: true },
      { id: 'p1-2', name: 'Format Check (PDF/PPT)', required: true, automated: true, agent: 'System', notifyEmail: false },
    ]
  },
  {
    id: 'p2',
    title: 'Phase 2: Initial Review',
    description: 'Substantiation of claims against truth sources.',
    colorTheme: 'indigo',
    steps: [
      { id: 'p2-1', name: 'Verify against Truth Source', required: true, automated: true, agent: 'Agent 2 (Data Consistency)', assigneeId: 'u4', notifyEmail: true },
      { id: 'p2-3', name: 'Quant Disclosures Check', required: true, automated: true, agent: 'Agent 2 (Data Consistency)', notifyEmail: false },
    ]
  },
  {
    id: 'p3',
    title: 'Phase 3: Regulatory Review',
    description: 'Core compliance testing against FCA COBS 4 rules.',
    colorTheme: 'amber',
    steps: [
      { id: 'p3-1', name: 'AR Permissions Check', required: true, automated: true, agent: 'Agent 5 (AR Permissions)', assigneeId: 'u2', notifyEmail: true },
      { id: 'p3-5', name: 'Risk Warnings Prominence', required: true, automated: true, agent: 'Agent 3 (Visual)', notifyEmail: false },
    ]
  },
  {
    id: 'p5',
    title: 'Phase 4: Sign-off',
    description: 'Formal approval and locking.',
    colorTheme: 'emerald',
    steps: [
      { id: 'p5-3', name: 'Manager Sign-off', required: true, automated: false, agent: 'Manager', assigneeId: 'u2', notifyEmail: true },
      { id: 'p5-4', name: 'CF30 Sign-off (QES)', required: true, automated: true, agent: 'Agent 8 (Approval)', assigneeId: 'u1', notifyEmail: true },
    ]
  }
];

const FUND_ADMIN_TEMPLATE: WorkflowPhase[] = [
  {
    id: 'fa-1',
    title: '1. Intake & Validation (AIF)',
    description: 'Alter Domus / Fund Admin Intake Gate.',
    colorTheme: 'slate',
    steps: [
      { id: 'fa-1-1', name: 'KYC/AML Validation (Submitter)', required: true, automated: false, agent: 'Compliance Officer', assigneeId: 'u2', notifyEmail: true },
      { id: 'fa-1-2', name: 'Fund Entity Verification', required: true, automated: true, agent: 'System (Ref Data)', notifyEmail: false },
    ]
  },
  {
    id: 'fa-2',
    title: '2. Data Substantiation',
    description: 'Verification against Golden Source (NAV, Performance).',
    colorTheme: 'blue',
    steps: [
      { id: 'fa-2-1', name: 'NAV & AUM Check', required: true, automated: true, agent: 'Agent 2 (Data Consistency)', assigneeId: 'u4', notifyEmail: true },
      { id: 'fa-2-2', name: 'Performance Fee Logic Check', required: true, automated: true, agent: 'Agent 2 (Data Consistency)', notifyEmail: false },
    ]
  },
  {
    id: 'fa-3',
    title: '3. Regulatory Assurance (COBS)',
    description: 'Automated Regulatory Gating.',
    colorTheme: 'amber',
    steps: [
      { id: 'fa-3-1', name: 'Consumer Duty Assessment', required: true, automated: true, agent: 'Agent 4 (Readability)', assigneeId: 'u3', notifyEmail: true },
      { id: 'fa-3-3', name: 'Target Market Assessment', required: true, automated: false, agent: 'SMF16 (Compliance)', assigneeId: 'u2', notifyEmail: true },
    ]
  },
  {
    id: 'fa-4',
    title: '4. Legal & Governance',
    description: 'Oversight and Approval Protocol.',
    colorTheme: 'purple',
    steps: [
      { id: 'fa-4-1', name: 'External Counsel Review', required: false, automated: false, agent: 'Legal Counsel', assigneeId: 'u5', notifyEmail: true },
      { id: 'fa-4-2', name: 'Board Pack Generation', required: true, automated: true, agent: 'System', notifyEmail: false },
      { id: 'fa-4-3', name: 'SMF9 Chair Sign-off (QES)', required: true, automated: true, agent: 'Agent 8 (Approval)', assigneeId: 'u1', notifyEmail: true },
    ]
  }
];

export const Workflow: React.FC = () => {
    const [workflow, setWorkflow] = useState<WorkflowPhase[]>(STANDARD_TEMPLATE);
    const [saved, setSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showChart, setShowChart] = useState(true);
    const [activeTemplate, setActiveTemplate] = useState<'Standard' | 'FundAdmin'>('Standard');

    useEffect(() => {
        const stored = FirestoreService.workflowConfig.get();
        if (stored && stored.length > 0) {
            setWorkflow(stored);
        }
    }, []);

    const handleSave = () => {
        FirestoreService.workflowConfig.save(workflow);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setIsEditing(false);
    };

    const handleLoadTemplate = (type: 'Standard' | 'FundAdmin') => {
        if (confirm("This will overwrite your current configuration. Continue?")) {
            setWorkflow(type === 'Standard' ? STANDARD_TEMPLATE : FUND_ADMIN_TEMPLATE);
            setActiveTemplate(type);
            setIsEditing(true); 
        }
    };

    // --- CRUD Operations ---

    const updatePhase = (phaseId: string, updates: Partial<WorkflowPhase>) => {
        setWorkflow(prev => prev.map(p => p.id === phaseId ? { ...p, ...updates } : p));
    };

    const addPhase = () => {
        const newPhase: WorkflowPhase = {
            id: `new-p-${Date.now()}`,
            title: 'New Phase',
            description: 'Description of this phase',
            steps: [],
            colorTheme: 'slate'
        };
        setWorkflow([...workflow, newPhase]);
    };

    const removePhase = (phaseId: string) => {
        if(confirm("Remove this phase and all its steps?")) {
            setWorkflow(prev => prev.filter(p => p.id !== phaseId));
        }
    };

    const updateStep = (phaseId: string, stepId: string, updates: Partial<WorkflowStep>) => {
        setWorkflow(prev => prev.map(p => {
            if (p.id !== phaseId) return p;
            return {
                ...p,
                steps: p.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
            };
        }));
    };

    const addStep = (phaseId: string) => {
        const newStep: WorkflowStep = {
            id: `step-${Date.now()}`,
            name: 'New Step',
            required: true,
            automated: false,
            agent: 'System',
            notifyEmail: false
        };
        setWorkflow(prev => prev.map(p => {
            if (p.id !== phaseId) return p;
            return { ...p, steps: [...p.steps, newStep] };
        }));
    };

    const removeStep = (phaseId: string, stepId: string) => {
        setWorkflow(prev => prev.map(p => {
            if (p.id !== phaseId) return p;
            return { ...p, steps: p.steps.filter(s => s.id !== stepId) };
        }));
    };

    const movePhase = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === workflow.length - 1)) return;
        const newWorkflow = [...workflow];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newWorkflow[index], newWorkflow[targetIndex]] = [newWorkflow[targetIndex], newWorkflow[index]];
        setWorkflow(newWorkflow);
    };

    const simulateNotification = (memberId: string | undefined, stepName: string) => {
        const member = TEAM_MEMBERS.find(m => m.id === memberId);
        if (member) {
            alert(`📧 Simulation: Email sent to ${member.email}\n\n"Hello ${member.name}, action required for step: ${stepName}"`);
        } else {
            alert("No specific team member assigned to notify.");
        }
    };

    const getAssignee = (id?: string) => TEAM_MEMBERS.find(m => m.id === id);

    const getThemeColors = (theme?: string): string => {
        switch(theme) {
            case 'blue': return 'border-blue-500 bg-blue-50';
            case 'indigo': return 'border-indigo-500 bg-indigo-50';
            case 'emerald': return 'border-emerald-500 bg-emerald-50';
            case 'amber': return 'border-amber-500 bg-amber-50';
            case 'purple': return 'border-purple-500 bg-purple-50';
            default: return 'border-slate-400 bg-slate-50';
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header Configuration Panel */}
            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Settings className="h-8 w-8 text-emerald-400" />
                            Workflow Engine
                        </h2>
                        <p className="text-slate-400 mt-2 max-w-2xl text-sm">
                            Configure team ownership, automated alerts, and regulatory gates.
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setShowChart(!showChart)}
                                className={`flex-1 px-4 py-2 border rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${showChart ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white text-slate-900 border-white hover:bg-slate-100'}`}
                             >
                                 {showChart ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                 {showChart ? 'Hide Visualizer' : 'Show Visualizer'}
                             </button>
                             <button 
                                onClick={() => setIsEditing(!isEditing)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${isEditing ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-transparent border-slate-700 text-slate-400 hover:text-white'}`}
                             >
                                 {isEditing ? 'Done Editing' : 'Edit Config'}
                             </button>
                        </div>
                        
                        <div className="flex gap-2">
                            <div className="relative group flex-1">
                                <button className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-bold">
                                    <LayoutTemplate className="h-3 w-3" /> Templates
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white text-slate-900 rounded-lg shadow-xl p-2 hidden group-hover:block z-50 border border-slate-200">
                                    <button onClick={() => handleLoadTemplate('Standard')} className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 rounded-md flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600"><FileText className="h-4 w-4" /></div>
                                        <div>
                                            <span className="block font-bold">Standard Asset Mgr</span>
                                            <span className="text-[10px] text-slate-500">COBS 4 • Retail</span>
                                        </div>
                                    </button>
                                    <button onClick={() => handleLoadTemplate('FundAdmin')} className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 rounded-md flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-600"><ShieldCheck className="h-4 w-4" /></div>
                                        <div>
                                            <span className="block font-bold">Fund Admin (AIF)</span>
                                            <span className="text-[10px] text-slate-500">AIFMD • Intake</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <button 
                                onClick={handleSave}
                                className={`flex-1 px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg border text-xs ${saved ? 'bg-emerald-600 border-emerald-500' : 'bg-blue-600 border-blue-500 hover:bg-blue-700'}`}
                            >
                                {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                                {saved ? 'Saved' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-900/20 to-transparent pointer-events-none"></div>
            </div>

            {/* Enterprise Pipeline Visualizer (Collapsible) */}
            {showChart && (
                <div className="overflow-x-auto pb-6 pt-2 custom-scrollbar animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-start min-w-max px-4 gap-4">
                        {workflow.map((phase, index) => {
                            // Safely extract unique assignees without using complex type assertions inside JSX
                            const uniqueAssigneeIds = Array.from(new Set(
                                phase.steps.map(s => s.assigneeId).filter(id => typeof id === 'string') as string[]
                            ));

                            return (
                            <React.Fragment key={phase.id}>
                                <div className="flex flex-col items-center gap-4 w-72">
                                    {/* Phase Card */}
                                    <div className={`w-full border-t-4 bg-white border border-slate-200 p-5 rounded-xl shadow-lg relative group transition-all hover:-translate-y-1 hover:shadow-xl ${getThemeColors(phase.colorTheme || 'slate').split(' ')[0]}`}>
                                        
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                Phase {index + 1}
                                            </div>
                                            {/* Notification Badge */}
                                            {phase.steps.filter(s => s.notifyEmail).length > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full" title="Email Notifications Active">
                                                    <Mail className="h-3 w-3 text-blue-500" />
                                                    {phase.steps.filter(s => s.notifyEmail).length}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <h4 className="font-bold text-slate-800 text-sm mb-1 truncate" title={phase.title}>{phase.title}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-2 h-8">{phase.description}</p>
                                        
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-400">{phase.steps.length} Gates</span>
                                            
                                            {/* Team Member Avatars */}
                                            <div className="flex -space-x-2 overflow-hidden pl-2">
                                                {uniqueAssigneeIds.map(id => {
                                                    const member = getAssignee(id);
                                                    if (!member) return null;
                                                    return (
                                                        <div key={id} title={`${member.name} (${member.role})`} className={`relative inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white border border-white shadow-sm text-xs font-bold cursor-help hover:z-10 transition-transform hover:scale-110 ${member.color}`}>
                                                            {member.initials}
                                                        </div>
                                                    );
                                                })}
                                                {phase.steps.some(s => !s.assigneeId) && (
                                                    <div className="relative inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 text-slate-400 border border-slate-200 shadow-sm text-[10px]">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Completion Dot */}
                                    <div className="flex flex-col items-center h-full">
                                        <div className="h-4 w-0.5 bg-slate-300"></div>
                                        <div className={`w-4 h-4 rounded-full border-2 bg-white z-10 ${index === 0 ? 'border-emerald-500' : 'border-slate-300'}`}></div>
                                    </div>
                                </div>
                                
                                {/* Connector Arrow */}
                                {index < workflow.length - 1 && (
                                    <div className="flex items-center h-32 text-slate-300">
                                        <ArrowRight className="h-6 w-6" strokeWidth={3} />
                                    </div>
                                )}
                            </React.Fragment>
                        )})}
                        
                        {isEditing && (
                            <div className="flex items-center h-40 pl-4">
                                <button onClick={addPhase} className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all hover:scale-110 bg-slate-50">
                                    <Plus className="h-8 w-8" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Full Configuration Engine */}
            <div className="space-y-6">
                {workflow.map((phase, pIndex) => (
                    <div key={phase.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 ${isEditing ? 'border-slate-300' : 'border-slate-200'}`}>
                        {/* Phase Header */}
                        <div className={`px-6 py-4 border-b flex justify-between items-start gap-4 ${getThemeColors(phase.colorTheme || 'slate').replace('border-', 'border-b-')}`}>
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phase Title</label>
                                                <input 
                                                    type="text" 
                                                    value={phase.title} 
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePhase(phase.id, { title: e.target.value })}
                                                    className="w-full font-bold text-lg text-slate-900 bg-white border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Phase Title"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Color Theme</label>
                                                <select 
                                                    value={phase.colorTheme || 'slate'}
                                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updatePhase(phase.id, { colorTheme: e.target.value })}
                                                    className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded px-2 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                                >
                                                    <option value="slate">Slate</option>
                                                    <option value="blue">Blue</option>
                                                    <option value="indigo">Indigo</option>
                                                    <option value="emerald">Emerald</option>
                                                    <option value="amber">Amber</option>
                                                    <option value="purple">Purple</option>
                                                </select>
                                            </div>
                                        </div>
                                        <input 
                                            type="text" 
                                            value={phase.description} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePhase(phase.id, { description: e.target.value })}
                                            className="w-full text-xs text-slate-500 bg-white border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Phase Description"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{phase.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{phase.description}</p>
                                    </div>
                                )}
                            </div>
                            
                            {isEditing && (
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => movePhase(pIndex, 'up')} disabled={pIndex === 0} className="p-1 hover:bg-white/50 rounded disabled:opacity-30"><ChevronUp className="h-4 w-4 text-slate-500"/></button>
                                        <button onClick={() => movePhase(pIndex, 'down')} disabled={pIndex === workflow.length - 1} className="p-1 hover:bg-white/50 rounded disabled:opacity-30"><ChevronDown className="h-4 w-4 text-slate-500"/></button>
                                    </div>
                                    <button onClick={() => removePhase(phase.id)} className="p-2 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Steps List */}
                        <div className="divide-y divide-slate-100">
                            {phase.steps.map((step) => {
                                const assignee = getAssignee(step.assigneeId);
                                return (
                                <div key={step.id} className={`p-4 flex items-center gap-4 transition-colors ${!step.required ? 'bg-slate-50/50 opacity-75' : 'hover:bg-slate-50'}`}>
                                    {/* Required Toggle */}
                                    <button 
                                        onClick={() => isEditing && updateStep(phase.id, step.id, { required: !step.required })}
                                        disabled={!isEditing}
                                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${step.required ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500 ring-offset-2' : 'bg-slate-200 text-slate-400'} ${isEditing ? 'cursor-pointer hover:bg-slate-300' : 'cursor-default'}`}
                                        title={isEditing ? "Toggle Requirement" : undefined}
                                    >
                                        {step.required ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                    </button>

                                    {/* Step Details */}
                                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                value={step.name}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStep(phase.id, step.id, { name: e.target.value })}
                                                className="lg:col-span-4 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-blue-500"
                                            />
                                        ) : (
                                            <div className="lg:col-span-4">
                                                <p className={`text-sm font-semibold ${step.required ? 'text-slate-900' : 'text-slate-400 line-through decoration-slate-300'}`}>{step.name}</p>
                                            </div>
                                        )}

                                        {/* Configuration Pills & Agent Matrix */}
                                        <div className="lg:col-span-8 flex flex-wrap items-center gap-3">
                                            {/* Automated Toggle */}
                                            <button 
                                                onClick={() => isEditing && updateStep(phase.id, step.id, { automated: !step.automated })}
                                                disabled={!isEditing}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border transition-all ${step.automated ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'} ${isEditing ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}`}
                                            >
                                                {step.automated ? <Cpu className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                                {step.automated ? 'Automated' : 'Manual'}
                                            </button>

                                            {/* Role/Agent Selector */}
                                            {isEditing ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <select 
                                                        value={step.agent}
                                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateStep(phase.id, step.id, { agent: e.target.value })}
                                                        className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded pl-2 pr-6 py-1.5 font-medium focus:ring-1 focus:ring-blue-500 outline-none w-48"
                                                    >
                                                        {AVAILABLE_AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
                                                    </select>
                                                    
                                                    {/* Assignee Selector */}
                                                    <div className="relative">
                                                        <select 
                                                            value={step.assigneeId || ''}
                                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateStep(phase.id, step.id, { assigneeId: e.target.value })}
                                                            className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded pl-2 pr-6 py-1.5 font-medium focus:ring-1 focus:ring-blue-500 outline-none w-40"
                                                        >
                                                            <option value="">-- Unassigned --</option>
                                                            {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                        </select>
                                                        <UserCircle className="h-3 w-3 text-slate-400 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>

                                                    {/* Notification Toggle */}
                                                    <button 
                                                        onClick={() => updateStep(phase.id, step.id, { notifyEmail: !step.notifyEmail })}
                                                        className={`p-1.5 rounded border transition-colors ${step.notifyEmail ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-500'}`}
                                                        title="Send Email Notification"
                                                    >
                                                        <Mail className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {/* Agent Chip */}
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200">
                                                        <ShieldCheck className="h-3 w-3 text-slate-400" />
                                                        {step.agent}
                                                    </div>

                                                    {/* Assignee Chip */}
                                                    {assignee ? (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border border-slate-200 bg-white shadow-sm pr-3" title={assignee.email}>
                                                            <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] ${assignee.color}`}>
                                                                {assignee.initials}
                                                            </div>
                                                            {assignee.name}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 italic">Unassigned</span>
                                                    )}

                                                    {/* Notification Indicator & Test Button */}
                                                    {step.notifyEmail && assignee && (
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3 text-blue-400" />
                                                            <button 
                                                                onClick={() => simulateNotification(step.assigneeId, step.name)}
                                                                className="text-[10px] text-blue-600 underline hover:text-blue-800"
                                                            >
                                                                Test Alert
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Delete Action */}
                                        {isEditing && (
                                            <div className="lg:col-span-1 text-right">
                                                <button onClick={() => removeStep(phase.id, step.id)} className="text-slate-300 hover:text-rose-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})}
                            
                            {isEditing && (
                                <div className="p-2 bg-slate-50 border-t border-slate-100">
                                    <button 
                                        onClick={() => addStep(phase.id)}
                                        className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 text-xs font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" /> Add Step
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isEditing && (
                    <button 
                        onClick={addPhase}
                        className="w-full py-6 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex flex-col items-center justify-center gap-2"
                    >
                        <Plus className="h-8 w-8" />
                        <span>Add New Phase</span>
                    </button>
                )}
            </div>
        </div>
    );
};