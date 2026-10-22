import React from 'react';
import { Check, X, ShieldAlert, Zap } from 'lucide-react';
import { PasswordAnalysisResult } from '../types';

interface StrengthMeterProps {
  analysis: PasswordAnalysisResult;
  showDetails?: boolean;
}

export const StrengthMeter: React.FC<StrengthMeterProps> = ({ analysis, showDetails = true }) => {
  const getBarColor = (score: number) => {
    if (score < 25) return 'bg-rose-500';
    if (score < 50) return 'bg-amber-500';
    if (score < 70) return 'bg-yellow-500';
    if (score < 85) return 'bg-emerald-500';
    return 'bg-emerald-400';
  };

  const getTextColor = (strength: string) => {
    switch (strength) {
      case 'Very Weak':
        return 'text-rose-400';
      case 'Weak':
        return 'text-amber-400';
      case 'Medium':
        return 'text-yellow-400';
      case 'Strong':
        return 'text-emerald-400';
      case 'Very Strong':
        return 'text-teal-300';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-3 bg-navy-950/60 p-4 rounded-xl border border-slate-800/80">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Password Security
          </span>
          <span className={`text-xs font-bold ${getTextColor(analysis.strength)}`}>
            {analysis.strength}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-300">
            {analysis.score}%
          </span>
          {analysis.entropy > 0 && (
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              {analysis.entropy} bits
            </span>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden flex">
        <div
          className={`h-full transition-all duration-300 ${getBarColor(analysis.score)}`}
          style={{ width: `${Math.max(5, analysis.score)}%` }}
        />
      </div>

      {/* Warnings if any */}
      {analysis.warnings.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{analysis.warnings[0]}</span>
        </div>
      )}

      {/* Criteria Checklist */}
      {showDetails && analysis.criteria && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            {analysis.criteria.length12Plus ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className={analysis.criteria.length12Plus ? 'text-slate-200' : 'text-slate-500'}>
              12+ characters
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {analysis.criteria.uppercase ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className={analysis.criteria.uppercase ? 'text-slate-200' : 'text-slate-500'}>
              Uppercase
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {analysis.criteria.lowercase ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className={analysis.criteria.lowercase ? 'text-slate-200' : 'text-slate-500'}>
              Lowercase
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {analysis.criteria.numbers ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className={analysis.criteria.numbers ? 'text-slate-200' : 'text-slate-500'}>
              Numbers
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {analysis.criteria.special ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className={analysis.criteria.special ? 'text-slate-200' : 'text-slate-500'}>
              Special characters
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {analysis.criteria.noObviousPattern ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className={analysis.criteria.noObviousPattern ? 'text-slate-200' : 'text-slate-500'}>
              No obvious pattern
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
