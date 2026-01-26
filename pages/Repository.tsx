import React, { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestore';
import { PromotionDocument, RiskRating } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Search, Plus, Filter, MoreHorizontal, File, FileCode, FileImage, Star, Trash2 } from 'lucide-react';

interface RepositoryProps {
    onNavigate: (page: string, id?: string) => void;
}

export const Repository: React.FC<RepositoryProps> = ({ onNavigate }) => {
    const [documents, setDocuments] = useState<PromotionDocument[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');

    const loadDocs = () => {
        const docs = FirestoreService.promotions.list().filter(d => !d.is_deleted);
        setDocuments(docs);
    };

    useEffect(() => {
        loadDocs();
        const interval = setInterval(loadDocs, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        FirestoreService.promotions.toggleFavorite(id);
        loadDocs(); // Immediate refresh
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm("Are you sure you want to move this to Trash?")) {
            FirestoreService.promotions.softDelete(id);
            loadDocs(); // Immediate refresh
        }
    };

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              doc.ar_id.includes(searchTerm) ||
                              doc.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'All' ? true : doc.status === filter;
        return matchesSearch && matchesFilter;
    });

    const getFileIcon = (type: string) => {
        if (type.toLowerCase().includes('pdf') || type.toLowerCase().includes('factsheet')) return <FileText className="h-4 w-4 text-rose-500" />;
        if (type.toLowerCase().includes('presentation') || type.toLowerCase().includes('deck')) return <FileImage className="h-4 w-4 text-orange-500" />;
        return <FileCode className="h-4 w-4 text-blue-500" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Submission Repository</h2>
                    <p className="text-slate-500 mt-1">Centralized archive of all financial promotions and compliance findings.</p>
                </div>
                <button 
                    onClick={() => onNavigate('review')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
                >
                    <Plus className="h-4 w-4" /> New Submission
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                         {['All', 'Approved', 'Rejected', 'Under Review'].map(f => (
                             <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                             >
                                 {f}
                             </button>
                         ))}
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search in documents..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
                            <Filter className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Table Header */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <Star className="h-4 w-4 text-slate-300" />
                                </th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Document</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Parties (AR / Firm)</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Label</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</th>
                                <th className="p-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDocs.map((doc) => (
                                <tr 
                                    key={doc.id} 
                                    onClick={() => onNavigate('review', doc.id)}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                >
                                    <td className="p-4 text-center" onClick={(e) => handleToggleFavorite(e, doc.id)}>
                                        <Star className={`h-4 w-4 transition-colors ${doc.is_favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-amber-400'}`} />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                                                {getFileIcon(doc.type)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 text-sm">{doc.title}</div>
                                                <div className="text-xs text-slate-400 font-mono">{doc.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <StatusBadge status={doc.status} />
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {doc.type}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-900">Principal Investment Mgmt</span>
                                            <span className="text-xs text-slate-500">AR: {doc.ar_id}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
