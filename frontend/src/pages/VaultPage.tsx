import React, { useState, useEffect } from 'react';
import { credentialsService, shareService } from '../services/api';
import { Credential } from '../types';

import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { AddCredentialModal } from '../components/AddCredentialModal';
import { EditCredentialModal } from '../components/EditCredentialModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  KeyRound,
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Trash2,
  Globe,
  User,
  ShieldCheck,
  Calendar,
  Lock,
  Flame,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export const VaultPage: React.FC = () => {
  const { showToast } = useToast();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<{ [id: string]: string }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // One-time share modal state
  const [sharingCred, setSharingCred] = useState<Credential | null>(null);
  const [sharingPassword, setSharingPassword] = useState('');
  const [shareExpiry, setShareExpiry] = useState(60);
  const [sharePassphrase, setSharePassphrase] = useState('');
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);


  const fetchCredentials = async () => {
    try {
      const data = await credentialsService.list(searchQuery);
      setCredentials(data);
    } catch (err: any) {
      showToast('Error loading credentials from vault', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [searchQuery]);

  const handleReveal = async (id: string) => {
    if (revealedPasswords[id]) {
      // Toggle off
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    try {
      const fullCred = await credentialsService.reveal(id);
      if (fullCred.password) {
        setRevealedPasswords((prev) => ({ ...prev, [id]: fullCred.password! }));
      }
    } catch (err: any) {
      showToast('Failed to decrypt credential.', 'error');
    }
  };

  const handleCopy = (text: string, fieldId: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    showToast(`${label} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyPassword = async (id: string) => {
    let password = revealedPasswords[id];
    if (!password) {
      try {
        const fullCred = await credentialsService.reveal(id);
        password = fullCred.password || '';
      } catch {
        showToast('Decryption failed. Cannot copy password.', 'error');
        return;
      }
    }

    if (password) {
      handleCopy(password, `pwd-${id}`, 'Password');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await credentialsService.delete(deletingId);
      showToast('Credential removed from vault.', 'info');
      setCredentials((prev) => prev.filter((c) => c.id !== deletingId));
    } catch {
      showToast('Failed to delete credential.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveCredential = async (cred: { website: string; username: string; password: string }) => {
    try {
      const newCred = await credentialsService.create(cred);
      setCredentials((prev) => [newCred, ...prev]);
      showToast(`Credential for ${cred.website} encrypted and saved.`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error saving credential', 'error');
    }
  };

  const handleUpdateCredential = async (
    id: string,
    data: { website?: string; username?: string; password?: string }
  ) => {
    try {
      const updated = await credentialsService.update(id, data);
      setCredentials((prev) => prev.map((c) => (c.id === id ? updated : c)));
      // Clear cached reveal
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast('Credential updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error updating credential', 'error');
    }
  };

  const handleOpenShare = async (cred: Credential) => {
    setSharingCred(cred);
    setGeneratedShareUrl(null);
    setSharePassphrase('');
    setShareExpiry(60);

    if (revealedPasswords[cred.id]) {
      setSharingPassword(revealedPasswords[cred.id]);
    } else {
      try {
        const full = await credentialsService.reveal(cred.id);
        if (full.password) {
          setSharingPassword(full.password);
          setRevealedPasswords((prev) => ({ ...prev, [cred.id]: full.password! }));
        }
      } catch {

        showToast('Decryption failed for sharing', 'error');
        setSharingCred(null);
      }
    }
  };

  const handleCreateShareLink = async () => {
    if (!sharingPassword) return;
    setIsShareLoading(true);
    try {
      const res = await shareService.create({
        secret: sharingPassword,
        label: `${sharingCred?.website} (${sharingCred?.username})`,
        expirationMinutes: shareExpiry,
        passphrase: sharePassphrase.trim() || undefined,
      });
      const url = `${window.location.origin}/share/${res.shareId}`;
      setGeneratedShareUrl(url);
      showToast('One-time link generated! Ready to copy.', 'success');
    } catch {
      showToast('Failed to create one-time share', 'error');
    } finally {
      setIsShareLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Credential Vault</h1>
            <Badge variant="emerald" dot>
              AES-256-GCM
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero-plaintext encrypted credential storage with isolated user tenant security
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddOpen(true)}
        >
          Add Credential
        </Button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by website or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-navy-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Vault Items: <span className="text-emerald-400 font-bold">{credentials.length}</span>
        </div>
      </div>

      {/* Credentials Table / Cards */}
      {credentials.length === 0 ? (
        <Card className="text-center py-12 space-y-4 border-dashed border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No Credentials Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No items matched your search query. Try searching for a different keyword.'
                : 'Your vault is currently empty. Start securely storing your accounts with AES-256-GCM encryption.'}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddOpen(true)}
          >
            Add Your First Credential
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((cred) => {
            const isRevealed = Boolean(revealedPasswords[cred.id]);
            const currentPassword = revealedPasswords[cred.id] || '••••••••••••';

            return (
              <Card key={cred.id} hover className="flex flex-col justify-between space-y-4 p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-100 text-sm">{cred.website}</h4>
                        {cred.ageStatus === 'stale' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-400 border border-rose-800/80 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Stale ({cred.ageDays || 0}d)
                          </span>
                        )}
                        {cred.ageStatus === 'aging' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/80 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> Aging ({cred.ageDays || 0}d)
                          </span>
                        )}
                        {cred.ageStatus === 'fresh' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                            Fresh
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{cred.username}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenShare(cred)}
                      className="p-1.5 text-orange-400 hover:text-orange-300 hover:bg-orange-950/40 rounded-lg transition-colors border border-transparent hover:border-orange-500/30"
                      title="Share One-Time via Burn-After-Reading"
                    >
                      <Flame className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingCred(cred)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(cred.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>


                {/* Password Display Box */}
                <div className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span
                      className={`text-xs font-mono truncate select-all ${
                        isRevealed ? 'text-emerald-300 font-semibold' : 'text-slate-500 tracking-widest'
                      }`}
                    >
                      {currentPassword}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleReveal(cred.id)}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                      title={isRevealed ? 'Hide password' : 'Authenticate and Reveal'}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopyPassword(cred.id)}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                      title="Copy password"
                    >
                      {copiedField === `pwd-${cred.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(cred.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleCopy(cred.username, `user-${cred.id}`, 'Username')}
                    className="hover:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    {copiedField === `user-${cred.id}` ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <span>Copy username</span>
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Credential Modal */}
      <AddCredentialModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSaveCredential}
      />

      {/* Edit Credential Modal */}
      <EditCredentialModal
        isOpen={Boolean(editingCred)}
        onClose={() => setEditingCred(null)}
        credential={editingCred}
        onUpdate={handleUpdateCredential}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Stored Credential"
        message="Are you sure you want to delete this credential? This action will permanently remove the encrypted ciphertext and encryption keys from the database."
        confirmText="Delete Credential"
      />

      {/* Burn-After-Reading Share Modal */}
      <Modal
        isOpen={Boolean(sharingCred)}
        onClose={() => setSharingCred(null)}
        title="Share One-Time Secret"
        subtitle={`Generate an ephemeral link for ${sharingCred?.website || 'credential'}`}
      >
        <div className="space-y-4">
          {generatedShareUrl ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-white">One-Time Link Generated!</h4>
                <p className="text-xs text-slate-300">
                  This link can only be viewed <strong>once</strong>. As soon as the recipient opens and decrypts it, the secret is permanently wiped from the server.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedShareUrl}
                  className="w-full bg-slate-950 text-emerald-400 font-mono text-xs px-3 py-2 rounded-lg border border-slate-700 select-all"
                />
                <Button
                  variant={isShareCopied ? 'secondary' : 'primary'}
                  onClick={() => {

                    navigator.clipboard.writeText(generatedShareUrl);
                    setIsShareCopied(true);
                    showToast('Link copied to clipboard!', 'success');
                    setTimeout(() => setIsShareCopied(false), 2000);
                  }}
                  className="shrink-0 text-xs flex items-center gap-1 py-2 px-3"
                >
                  {isShareCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {isShareCopied ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSharingCred(null)} className="text-xs">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="text-slate-400">Website: <strong className="text-white">{sharingCred?.website}</strong></div>
                <div className="text-slate-400">Username: <strong className="text-white">{sharingCred?.username}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Self-Destruct Lifetime
                </label>
                <select
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(Number(e.target.value))}
                  className="w-full bg-slate-900 text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-700"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={60}>1 Hour (Standard)</option>
                  <option value={1440}>24 Hours</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Optional Passphrase
                </label>
                <input
                  type="password"
                  placeholder="Leave empty or set extra passphrase..."
                  value={sharePassphrase}
                  onChange={(e) => setSharePassphrase(e.target.value)}
                  className="w-full bg-slate-900 text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="outline" onClick={() => setSharingCred(null)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateShareLink}
                  disabled={isShareLoading}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  {isShareLoading ? 'Generating...' : 'Generate 1-Time Link'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

