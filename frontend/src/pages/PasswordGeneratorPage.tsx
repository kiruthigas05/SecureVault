import React, { useState, useEffect } from 'react';
import { passwordToolsService } from '../services/api';
import { GeneratedPasswordResult } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StrengthMeter } from '../components/StrengthMeter';
import { Wand2, Copy, RefreshCw, Check, ShieldCheck, Sliders, Zap } from 'lucide-react';

export const PasswordGeneratorPage: React.FC = () => {
  const { showToast } = useToast();
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [special, setSpecial] = useState(true);
  const [result, setResult] = useState<GeneratedPasswordResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePassword = async () => {
    setIsGenerating(true);
    try {
      const data = await passwordToolsService.generate({
        length,
        uppercase,
        lowercase,
        numbers,
        special,
      });
      setResult(data);
    } catch (err) {
      showToast('Failed to generate password', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generatePassword();
  }, [length, uppercase, lowercase, numbers, special]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.password);
    setIsCopied(true);
    showToast('Secure password copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Strong Password Generator</h1>
          <Badge variant="emerald" dot>
            CSPRNG Powered
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Generate high-entropy, cryptographically random passwords resilient against brute-force and dictionary attacks
        </p>
      </div>

      {/* Main Generator Output Display */}
      <Card className="border-slate-800 space-y-6 bg-gradient-to-b from-navy-900 to-navy-950">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>GENERATED SECRET</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
              {result?.analysis.entropy} bits entropy
            </span>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between gap-4">
            <span className="font-mono text-lg sm:text-2xl text-emerald-300 font-bold tracking-wider break-all select-all">
              {result?.password || 'Generating...'}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="md"
                onClick={generatePassword}
                isLoading={isGenerating}
                icon={<RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />}
                title="Regenerate"
              >
                <span className="hidden sm:inline">Regenerate</span>
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleCopy}
                icon={isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                title="Copy Password"
              >
                <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Live Strength Display */}
        {result && (
          <div className="space-y-2">
            <StrengthMeter analysis={result.analysis} showDetails={true} />
          </div>
        )}
      </Card>

      {/* Controls & Options */}
      <Card className="border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Generator Configuration</span>
        </h3>

        {/* Length Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password Length
            </label>
            <span className="text-base font-mono font-bold text-emerald-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
              {length} characters
            </span>
          </div>

          <input
            type="range"
            min={12}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>12 (Minimum)</span>
            <span>24 (Recommended)</span>
            <span>64 (Maximum)</span>
          </div>
        </div>

        {/* Character Sets Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-200">Uppercase Letters</p>
              <p className="text-xs text-slate-500 font-mono">A-Z</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-200">Lowercase Letters</p>
              <p className="text-xs text-slate-500 font-mono">a-z</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-200">Numbers</p>
              <p className="text-xs text-slate-500 font-mono">0-9</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={special}
              onChange={(e) => setSpecial(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-200">Special Characters</p>
              <p className="text-xs text-slate-500 font-mono">!@#$%^&*()_+-=[]{}|;:,.&lt;&gt;?</p>
            </div>
          </label>
        </div>
      </Card>
    </div>
  );
};
