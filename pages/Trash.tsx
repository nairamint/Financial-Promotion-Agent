import React, { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestore';
import { PromotionDocument } from '../types';
import { Trash2, RefreshCw, AlertTriangle, FileText, Check } from 'lucide-react';

export const Trash: React.FC = () => {
    const [deletedItems, setDeletedItems] = useState<PromotionDocument[]>([]);

    const loadDeleted = () => {
        const allDocs = FirestoreService.promotions.list();
        setDeletedItems(allDocs.filter(d => d.is_deleted));
    };

    useEffect(() => {
        loadDeleted();
    }, []);

    const handleRestore = (id: string) => {
        FirestoreService.promotions.restore(id);
        loadDeleted();
    };

    const handlePermanentDelete = (id: string) => {
        if (confirm("This action cannot be undone. The audit trail will remain, but the document metadata will be removed.")) {
            FirestoreService.promotions.permanentDelete(id);
            loadDeleted();
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                    <Trash2 className="h-6 w-6" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900">Trash</h2>
                    <p className="text-slate-500 mt-1">Items in trash will be permanently deleted after 30 days (Compliance Policy).</p>
                 </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {deletedItems.length > 0 ? deletedItems.map((doc) => (
                        <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-400 grayscale">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 text-sm">{doc.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                        <span className="font-mono">{doc.id}</span>
                                        <span>•</span>
                                        <span>Deleted today</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleRestore(doc.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                >
                                    <RefreshCw className="h-3 w-3" /> Restore
                                </button>
                                <button 
                                    onClick={() => handlePermanentDelete(doc.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" /> Delete Forever
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Check className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">Trash is empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
