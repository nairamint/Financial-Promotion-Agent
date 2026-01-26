
import React from 'react';
import { 
    ShieldCheck, LayoutDashboard, FileText, History, Settings, Users, 
    Activity, GitGraph, FolderOpen, BarChart, Star, Trash, Share2, Plus, Terminal, ClipboardCheck,
    BrainCircuit
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string, id?: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  // Main Workflow Navigation (Top Section)
  const mainNavItems = [
    { id: 'workflow', label: 'Workflows', icon: GitGraph },
    { id: 'repository', label: 'Documents', icon: FolderOpen },
    { id: 'ar-governance', label: 'Parties', icon: Users },
    { id: 'review', label: 'Review & Assurance', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'uat', label: 'UAT Portal', icon: ClipboardCheck },
    { id: 'testing', label: 'Diagnostics', icon: Activity },
    { id: 'board-advisory', label: 'Digital Board', icon: Terminal },
  ];

  // Footer Navigation (Bottom Section as requested)
  const bottomNavItems = [
    { id: 'reports', label: 'Reports', icon: BarChart },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'integrations', label: 'Integrations', icon: Share2 },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 flex-shrink-0">
        
        {/* Brand & Action Area */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight mb-6">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/50">
                <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span>Financial Promotion</span>
          </div>
        </div>

        {/* Scrollable Main Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Workspace</p>
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activePage === item.id
                  ? 'bg-blue-600/10 text-blue-400'
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <item.icon className={`h-5 w-5 ${activePage === item.id ? 'text-blue-400' : 'text-slate-500'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom Navigation Section */}
        <div className="px-4 pt-4 pb-2 border-t border-slate-800 bg-slate-900">
             <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">System</p>
             <div className="space-y-1">
                {bottomNavItems.map((item) => (
                    <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        activePage === item.id
                        ? 'bg-blue-600/10 text-blue-400'
                        : 'hover:bg-slate-800 hover:text-white text-slate-400'
                    }`}
                    >
                    <item.icon className={`h-5 w-5 ${activePage === item.id ? 'text-blue-400' : 'text-slate-500'}`} />
                    {item.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Enterprise Status Footer */}
        <div className="p-4 bg-slate-950 text-xs border-t border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-500">Online</span>
             </div>
             <span className="text-slate-600 font-mono">v2.3.0</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto flex flex-col relative bg-slate-50">
         <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-10 shadow-sm">
            <h1 className="text-xl font-bold text-slate-800">
                {[...mainNavItems, ...bottomNavItems].find(n => n.id === activePage)?.label}
            </h1>
            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <span className="block text-sm font-bold text-slate-900">Julia Black</span>
                    <span className="block text-xs text-slate-500">Chair (SMF9)</span>
                </div>
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold border border-indigo-100 shadow-sm cursor-pointer hover:bg-indigo-100 transition-colors">
                    JB
                </div>
            </div>
         </header>
         {/* Increased max-width for enterprise density */}
         <div className="p-6 lg:p-8 w-full max-w-[1920px] mx-auto">
            {children}
         </div>
      </main>
    </div>
  );
};