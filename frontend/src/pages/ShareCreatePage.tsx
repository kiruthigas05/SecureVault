import React, { useState } from 'react';
import { shareService } from '../services/api';
import { ShareCreateResponse } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Flame, Copy, Check, Lock, Clock, ShieldCheck, KeyRound, AlertTriangle, ArrowRight } from 'lucide-react';

export const ShareCreatePage: React.FC = () => {
  const { showToast } = useToast();
  const [secret, setSecret] = useState('');
  const [label, setLabel] = useState('');
  const [expirationMinutes, setExpirationMinutes] = useState(60);
  const [requirePassphrase, setRequirePassphrase] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdShare, setCreatedShare] = useState<ShareCreateResponse | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) {
      showToast('Please enter a secret to share', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await shareService.create({
        secret,
        label: label.trim() || undefined,
        expirationMinutes,
        passphrase: requirePassphrase ? passphrase : undefined,
      });

      setCreatedShare(result);
      showToast('One-time ephemeral link generated!', 'success');
      setSecret('');
      setPassphrase('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to generate secret link', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getShareUrl = (shareId: string) => {
    return `${window.location.origin}/share/${shareId}`;
  };

  const handleCopyLink = () => {
    if (!createdShare) return;
    const url = getShareUrl(createdShare.shareId);
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    showToast('One-time link copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">One-Time Ephemeral Secret Sharing</h1>
          <Badge variant="emerald" dot>
            Burn-After-Reading
          </Badge>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Safely send a password, token, or private key via a self-destructing link. Erased permanently after 1 view.
        </p>
      </div>

      {createdShare ? (
        <Card className="p-6 border-emerald-500/30 bg-emerald-950/20 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Flame className="w-6 h-6 animate-pulse text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Your One-Time Link is Ready!</h2>
              <p className="text-sm text-slate-300 mt-0.5">
                Share this link with your recipient. The moment it is opened and viewed, it will be{' '}
                <strong className="text-orange-400 font-semibold">permanently burned and erased</strong> from the server.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Secret Link (Valid for 1 view only):</span>
              <span className="text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Expires in {expirationMinutes} min
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={getShareUrl(createdShare.shareId)}
                className="w-full bg-slate-950/80 text-emerald-400 font-mono text-sm px-3.5 py-2.5 rounded-lg border border-slate-700 focus:outline-none select-all"
              />
              <Button
                variant={isCopied ? 'secondary' : 'primary'}
                onClick={handleCopyLink}
                className="shrink-0 flex items-center gap-1.5"
              >

                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {isCopied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          {createdShare.hasPassphrase && (
            <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-800/40 p-3 rounded-lg">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Passphrase Required:</strong> Don't forget to give your recipient the decryption passphrase through a separate channel!
              </span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setCreatedShare(null)}
              className="text-slate-300 hover:text-white"
            >
              Create Another Secret
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 space-y-6">
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Description / Label <span className="text-slate-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Wi-Fi Credentials, AWS Secret Key, Server SSH Login"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={100}
                className="w-full bg-slate-900 text-slate-100 text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Secret Content */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Confidential Secret / Password <span className="text-emerald-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Paste the secret password, API key, token, or private note here..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 font-mono text-sm px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                Encrypted in RAM with AES-256-GCM. Never written to unencrypted disks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Expiration Time */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Self-Destruct Lifetime
                </label>
                <select
                  value={expirationMinutes}
                  onChange={(e) => setExpirationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-900 text-slate-100 text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value={5}>5 Minutes (Ultra-Fast Expire)</option>
                  <option value={15}>15 Minutes</option>
                  <option value={60}>1 Hour (Standard)</option>
                  <option value={1440}>24 Hours (1 Day)</option>
                  <option value={10080}>7 Days</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Link automatically self-destructs after this duration if unopened.
                </span>
              </div>

              {/* Passphrase Protection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="requirePassphrase"
                    checked={requirePassphrase}
                    onChange={(e) => setRequirePassphrase(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <label htmlFor="requirePassphrase" className="text-sm font-medium text-slate-200 cursor-pointer flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    Require Decryption Passphrase
                  </label>
                </div>

                {requirePassphrase && (
                  <input
                    type="password"
                    required={requirePassphrase}
                    placeholder="Set secret passphrase..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !secret.trim()}
                className="flex items-center gap-2 px-6"
              >
                <Flame className="w-4 h-4 text-orange-400" />
                {isLoading ? 'Encrypting & Generating...' : 'Generate Self-Destructing Link'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Feature Comparison Box (Google Password Manager vs SecureVault) */}
      <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Why This Sets SecureVault Apart from Google Password Manager
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="font-semibold text-red-400 block mb-1">❌ Google Password Manager</span>
            <p className="text-slate-400 leading-relaxed">
              Has zero sharing capabilities. Users resort to copy-pasting passwords on WhatsApp, email, or chat, leaving permanent plaintext leaks.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-emerald-900/40">
            <span className="font-semibold text-emerald-400 block mb-1">✔ SecureVault Burn-on-Read</span>
            <p className="text-slate-300 leading-relaxed">
              Provides single-use links backed by AES-256-GCM. The second the recipient reveals it, the secret is wiped from RAM forever.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="font-semibold text-amber-400 block mb-1">🛡️ Anti-Interception Defense</span>
            <p className="text-slate-300 leading-relaxed">
              Includes optional secondary passphrase protection so even if the link is intercepted, the secret cannot be decrypted.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
