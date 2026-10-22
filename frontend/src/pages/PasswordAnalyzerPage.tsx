import React, { useState, useEffect } from 'react';
import { passwordToolsService } from '../services/api';
import { PasswordAnalysisResult } from '../types';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { StrengthMeter } from '../components/StrengthMeter';
import { Input } from '../components/Input';
import { Gauge, Eye, EyeOff, ShieldAlert, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';

export const PasswordAnalyzerPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState<PasswordAnalysisResult | null>(null);

  useEffect(() => {
    passwordToolsService.analyze(password).then(setAnalysis).catch(() => {});
  }, [password]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Password Strength Analyzer</h1>
          <Badge variant="emerald" dot>
            Local Analysis
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Evaluate password resilience, calculate theoretical Shannon entropy, and discover dictionary vulnerabilities
        </p>
      </div>

      {/* Analyzer Input Card */}
      <Card className="border-slate-800 space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Enter Password to Test
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Type any password to inspect in real-time..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Evaluated safely in real-time. Passwords are never logged or stored.
          </p>
        </div>

        {/* Strength Meter with full details */}
        {analysis && (
          <div className="space-y-4">
            <StrengthMeter analysis={analysis} showDetails={true} />

            {/* In-depth Warnings & Suggestions */}
            {(analysis.warnings.length > 0 || analysis.suggestions.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                {/* Warnings */}
                {analysis.warnings.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Security Warnings</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-rose-300 list-disc list-inside">
                      {analysis.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" />
                      <span>Actionable Improvements</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-emerald-300 list-disc list-inside">
                      {analysis.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Educational Walkthrough on Entropy */}
      <Card className="border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Understanding Password Entropy</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Entropy measures the unpredictability of a password in bits. A password with <span className="text-slate-200 font-bold">80+ bits</span> of entropy would require centuries of supercomputer cracking time, whereas passwords below <span className="text-rose-400 font-bold">40 bits</span> can be broken in minutes via dictionary and rainbow-table techniques.
        </p>
      </Card>
    </div>
  );
};
