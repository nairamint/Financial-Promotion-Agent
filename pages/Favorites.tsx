import React, { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestore';
import { PromotionDocument } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Star, FileImage, FileCode, Search, File } from 'lucide-react';

interface FavoritesProps {
    onNavigate: (page: string, id?: string) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ onNavigate }) => {
    const [favorites, setFavorites] = useState<PromotionDocument[]>([]);

    useEffect(() => {
        const load = () => {
            const allDocs = FirestoreService.promotions.list();
            setFavorites(allDocs.filter(d => d.is_favorite && !d.is_deleted));
        };
        load();
        const interval = setInterval(load, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleUnfavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        FirestoreService.promotions.toggleFavorite(id);
        setFavorites(prev => prev.filter(p => p.id !== id));
    };

    const getFileIcon = (type: string) => {
        if (type.toLowerCase().includes('pdf') || type.toLowerCase().includes('factsheet')) return <FileText className="h-4 w-4 text-rose-500" />;
        if (type.toLowerCase().includes('presentation') || type.toLowerCase().includes('deck')) return <FileImage className="h-4 w-4 text-orange-500" />;
        return <FileCode className="h-4 w-4 text-blue-500" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Star className="h-6 w-6 fill-amber-600" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900">Starred Documents</h2>
                    <p className="text-slate-500 mt-1">Quick access to high-priority compliance cases.</p>
                 </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {favorites.length > 0 ? favorites.map((doc) => (
                        <div 
                            key={doc.id}
                            onClick={() => onNavigate('review', doc.id)}
                            className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={(e) => handleUnfavorite(e, doc.id)}
                                    className="p-1 text-amber-400 hover:text-slate-300 transition-colors"
                                    title="Remove from Favorites"
                                >
                                    <Star className="h-5 w-5 fill-amber-400 hover:fill-none" />
                                </button>
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                    {getFileIcon(doc.type)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600">{doc.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <span className="font-mono">{doc.id}</span>
                                        <span>•</span>
                                        <span>{doc.type}</span>
                                        <span>•</span>
                                        <span>{new Date(doc.submission_date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <StatusBadge status={doc.status} />
                                <StatusBadge status={doc.risk_rating} type="risk" />
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Star className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">No favorites yet</p>
                            <p className="text-sm">Star documents in the Repository to see them here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
