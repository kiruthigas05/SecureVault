import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shareService } from '../services/api';
import { ShareMetadata, ShareRevealResponse } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import {
  Flame,
  Lock,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  Timer,
} from 'lucide-react';

export const ShareViewPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();

  const [meta, setMeta] = useState<ShareMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBurned, setIsBurned] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [revealing, setRevealing] = useState(false);
  const [revealedData, setRevealedData] = useState<ShareRevealResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Countdown, blur & anti-screenshot state
  const VISIBLE_SECONDS = 30;
  const [countdown, setCountdown] = useState(VISIBLE_SECONDS);
  const [isBlurred, setIsBlurred] = useState(false);
  const [screenshotAttempted, setScreenshotAttempted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!shareId) return;
    const fetchMeta = async () => {
      try {
        setLoading(true);
        const data = await shareService.getMeta(shareId);
        setMeta(data);
      } catch {
        setIsBurned(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, [shareId]);

  // Start countdown as soon as secret is revealed
  useEffect(() => {
    if (!revealedData) return;
    setCountdown(VISIBLE_SECONDS);
    setIsBlurred(false);
    setScreenshotAttempted(false);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsBlurred(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [revealedData]);

  // Anti-Screenshot & Screen Capture Protection
  useEffect(() => {
    if (!revealedData || isBlurred) return;

    // 1. Detect PrintScreen or Print shortcut keys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key === 'p') ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'))
      ) {
        setIsBlurred(true);
        setScreenshotAttempted(true);
        clearInterval(timerRef.current!);
      }
    };

    // 2. Detect window blur (triggered when Snipping Tool, Win+Shift+S, or screen recorder opens)
    const handleWindowBlur = () => {
      setIsBlurred(true);
      setScreenshotAttempted(true);
      clearInterval(timerRef.current!);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [revealedData, isBlurred]);

  const handleReveal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!shareId) return;
    setErrorMsg(null);
    setRevealing(true);
    try {
      const data = await shareService.reveal(shareId, passphrase.trim() || undefined);
      setRevealedData(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErrorMsg(err.response.data?.message || 'Incorrect passphrase. Please try again.');
      } else {
        setIsBurned(true);
      }
    } finally {
      setRevealing(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col items-center justify-center p-4">
      {/* Top Brand Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Shield className="w-6 h-6 text-navy-950 font-bold" />
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight text-white font-mono">
            Secure<span className="text-emerald-400">Vault</span>
          </span>
          <span className="block text-[11px] text-slate-400 font-medium tracking-wider uppercase">
            Zero-Knowledge Ephemeral Transfer
          </span>
        </div>
      </div>

      <div className="w-full max-w-xl">
        {loading ? (
          <Card className="p-8 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Verifying ephemeral secret token...</p>
          </Card>
        ) : isBurned ? (
          /* Burned or Expired State */
          <Card className="p-8 text-center space-y-5 border-orange-500/30 bg-slate-900/90">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30">
              <Flame className="w-8 h-8 animate-pulse text-orange-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                This Secret Has Been Burned & Destroyed
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                This secret was either already viewed once or exceeded its time-to-live expiration.
                For zero-knowledge security, it has been permanently wiped from the server.
              </p>
            </div>

            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" className="text-xs text-slate-300">
                  Go to SecureVault
                </Button>
              </Link>
            </div>
          </Card>
        ) : revealedData ? (
          /* Successfully Revealed & Burned — NO COPY, countdown blur */
          <Card className="p-8 space-y-6 border-emerald-500/40 bg-slate-900/95 shadow-2xl shadow-emerald-500/10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{revealedData.label || 'Decrypted Secret'}</h2>
                  <span className="text-xs text-slate-400">Decrypted via AES-256-GCM · Read-Only · No Copy</span>
                </div>
              </div>
              <Badge variant="emerald" dot>Decrypted</Badge>
            </div>

            {/* Countdown Ring */}
            {!isBlurred && (
              <div className="flex items-center justify-center gap-3 py-1">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-mono font-bold
                  ${countdown <= 10
                    ? 'border-red-500/50 bg-red-950/30 text-red-400'
                    : 'border-amber-500/40 bg-amber-950/20 text-amber-400'}`}>
                  <Timer className="w-4 h-4 animate-pulse" />
                  ⚠️ Disappearing in {countdown}s — Read now!
                </div>
              </div>
            )}

            {/* The Secret Content — NO COPY, text-select disabled */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  {isBlurred ? <EyeOff className="w-3.5 h-3.5 text-red-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                  {isBlurred ? 'Secret hidden — reload not possible' : 'Secret Content (read-only):'}
                </span>
                <span className="text-orange-400 font-semibold text-[11px] uppercase tracking-wide">
                  🚫 Copy & Screenshot Protected
                </span>
              </div>

              {/* Secret Box — blur after countdown */}
              <div
                className={`relative w-full bg-slate-950 font-mono text-sm p-4 rounded-xl border
                  min-h-[100px] leading-relaxed whitespace-pre-wrap break-all transition-all duration-700
                  ${isBlurred
                    ? 'blur-md select-none text-emerald-400 border-red-800/40'
                    : 'text-emerald-400 border-slate-700'}
                `}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onCopy={e => e.preventDefault()}
                onCut={e => e.preventDefault()}
                onContextMenu={e => e.preventDefault()}
              >
                {revealedData.secret}

                {/* Overlay when blurred */}
                {isBlurred && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 backdrop-blur-md rounded-xl p-4 text-center">
                    <EyeOff className="w-8 h-8 text-red-400" />
                    <span className="text-xs text-red-300 font-semibold">
                      {screenshotAttempted
                        ? '🛡️ Screenshot Protection Triggered'
                        : 'Secret Expired & Hidden'}
                    </span>
                    <span className="text-[11px] text-slate-400 max-w-xs">
                      {screenshotAttempted
                        ? 'Screen capture or window defocus was detected. The secret was instantly obscured for zero-trace security.'
                        : 'The viewing window expired and the secret has been purged from memory.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Security notice */}
              <p className="text-[11px] text-slate-500 text-center">
                🔒 Copying, text selection, and screen capture tools are censored for zero-trace security.
                Read and memorize or type it manually.
              </p>
            </div>

            {/* Self-Destruct Warning Banner */}
            <div className="p-4 bg-orange-950/30 border border-orange-800/40 rounded-xl flex items-start gap-3">
              <Flame className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div className="text-xs text-orange-200/90 leading-relaxed">
                <strong className="text-orange-400 font-semibold block mb-0.5">
                  🔥 Secret Burned on Server
                </strong>
                This secret was destroyed from server memory the moment you opened this link.
                This tab cannot be refreshed to see it again. The link is permanently dead.
              </div>
            </div>
          </Card>

        ) : (
          /* Pre-Reveal State */
          <Card className="p-8 space-y-6 border-slate-800 bg-slate-900/90">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 mb-3">
                <Lock className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Encrypted One-Time Secret
              </h2>
              <p className="text-sm text-slate-400">
                You have received a confidential secret: <span className="text-slate-200 font-medium font-mono">{meta?.label}</span>
              </p>
            </div>

            {/* One-view warning */}
            <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-start gap-3 text-xs text-amber-200/90">
              <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> This link can only be viewed <strong>once</strong>. As soon as you reveal the secret, it is wiped from the server forever.
              </span>
            </div>

            {meta?.hasPassphrase && (
              <form onSubmit={handleReveal} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  Passphrase Required
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter the decryption passphrase..."
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
                {errorMsg && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {errorMsg}
                  </p>
                )}
              </form>
            )}

            <Button
              variant="primary"
              onClick={() => handleReveal()}
              disabled={revealing || (meta?.hasPassphrase && !passphrase.trim())}
              className="w-full py-3 flex items-center justify-center gap-2 font-semibold"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              {revealing ? 'Decrypting & Burning...' : 'Reveal Secret & Self-Destruct'}
            </Button>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-xs text-slate-500 text-center">
        Protected with AES-256-GCM Authenticated Encryption &bull; Zero Server Retention
      </div>
    </div>
  );
};
