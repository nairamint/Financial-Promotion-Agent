import React from 'react';
import { ComplianceStatus, RiskRating } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status?: ComplianceStatus | string;
  type?: 'status' | 'risk';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  if (type === 'risk') {
    switch (status) {
      case RiskRating.LOW:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">Low Risk</span>;
      case RiskRating.MEDIUM:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Medium Risk</span>;
      case RiskRating.HIGH:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">High Risk</span>;
      case RiskRating.CRITICAL:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">Critical</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Unknown</span>;
    }
  }

  switch (status) {
    case ComplianceStatus.PASS:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Pass
        </span>
      );
    case ComplianceStatus.FAIL:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3" /> Fail
        </span>
      );
    case ComplianceStatus.REFER:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3" /> Refer
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
  }
};