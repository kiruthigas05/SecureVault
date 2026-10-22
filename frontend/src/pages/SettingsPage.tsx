import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { mfaService } from '../services/api';
import { MfaSetupData } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Copy,
  Check,
  Lock,
  User,
  Mail,
  Calendar,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [mfaStatus, setMfaStatus] = useState<{ mfaEnabled: boolean; remainingBackupCodes: number }>({
    mfaEnabled: user?.mfaEnabled || false,
    remainingBackupCodes: 0,
  });

  // MFA Setup Modal state
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Disable MFA Modal state
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  const [copiedCodes, setCopiedCodes] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await mfaService.getStatus();
      setMfaStatus(data);
    } catch (err) {
      console.error('Error fetching MFA status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleStartMfaSetup = async () => {
    try {
      const data = await mfaService.setup();
      setSetupData(data);
      setVerificationCode('');
      setIsSetupOpen(true);
    } catch {
      showToast('Failed to initialize MFA setup.', 'error');
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;

    setIsVerifying(true);
    try {
      await mfaService.verifyAndEnable({
        token: verificationCode.trim(),
        secret: setupData.secret,
        backupCodes: setupData.backupCodes,
      });

      showToast('Two-Factor Authentication is now active on your vault!', 'success');
      setIsSetupOpen(false);
      await refreshUser();
      await fetchStatus();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid verification code.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisabling(true);
    try {
      await mfaService.disable(disablePassword);
      showToast('Two-Factor Authentication has been disabled.', 'info');
      setIsDisableOpen(false);
      setDisablePassword('');
      await refreshUser();
      await fetchStatus();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Incorrect password.', 'error');
    } finally {
      setIsDisabling(false);
    }
  };

  const copyBackupCodes = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
    setCopiedCodes(true);
    showToast('Backup codes copied to clipboard!', 'info');
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security & Account Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure Multi-Factor Authentication (TOTP), recovery codes, and vault profile
        </p>
      </div>

      {/* User Profile Card */}
      <Card className="border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          <span>Profile Overview</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-navy-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 uppercase font-mono">Full Name</span>
            <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
          </div>

          <div className="p-3 bg-navy-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 uppercase font-mono">Registered Email</span>
            <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Multi-Factor Authentication Section */}
      <Card className="border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${
                mfaStatus.mfaEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {mfaStatus.mfaEnabled ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Multi-Factor Authentication (TOTP)</h3>
                {mfaStatus.mfaEnabled ? (
                  <Badge variant="emerald" dot>
                    Active
                  </Badge>
                ) : (
                  <Badge variant="amber" dot>
                    Disabled
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard RFC 6238 Time-based One-Time Password protocol
              </p>
            </div>
          </div>

          <div>
            {mfaStatus.mfaEnabled ? (
              <Button
                variant="danger"
                size="md"
                onClick={() => setIsDisableOpen(true)}
              >
                Disable MFA
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleStartMfaSetup}
                icon={<Smartphone className="w-4 h-4" />}
              >
                Enable MFA
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-400 leading-relaxed space-y-2">
          <p>
            When Two-Factor Authentication is active, logging in requires both your master password and a 6-digit verification code generated by an authenticator application on your smartphone.
          </p>
          {mfaStatus.mfaEnabled && (
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs pt-1">
              <Check className="w-4 h-4" />
              <span>
                {mfaStatus.remainingBackupCodes} emergency recovery backup code(s) stored securely.
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* MFA Setup Modal */}
      <Modal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        title="Setup Two-Factor Authentication"
        subtitle="Scan the QR code with Google Authenticator, Authy, or 1Password"
        maxWidth="lg"
      >
        {setupData && (
          <form onSubmit={handleVerifyMfa} className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-navy-950 rounded-xl border border-slate-800">
              {/* QR Code */}
              <div className="bg-white p-2 rounded-xl shrink-0 shadow-lg">
                <img
                  src={setupData.qrCodeUrl}
                  alt="MFA QR Code"
                  className="w-40 h-40 object-contain"
                />
              </div>

              {/* Text secret */}
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Manual Entry Key
                </h4>
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 select-all break-all">
                  {setupData.secret}
                </div>
                <p className="text-[11px] text-slate-500">
                  If you cannot scan the QR code, manually type this secret key into your authenticator app.
                </p>
              </div>
            </div>

            {/* Backup Codes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Emergency Backup Recovery Codes</span>
                </label>
                <button
                  type="button"
                  onClick={copyBackupCodes}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedCodes ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy all codes</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-navy-950 rounded-xl border border-slate-800">
                {setupData.backupCodes.map((code, idx) => (
                  <span
                    key={idx}
                    className="p-1.5 bg-slate-900 border border-slate-800 rounded text-center font-mono text-xs text-slate-300 select-all"
                  >
                    {code}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-amber-400/90">
                Save these codes in a safe place. Each code can be used once if you lose access to your authenticator app.
              </p>
            </div>

            {/* Verification input */}
            <div className="space-y-2">
              <Input
                label="Enter 6-Digit Code from Authenticator"
                placeholder="123456"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-xl tracking-[0.3em] font-mono"
                required
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setIsSetupOpen(false)}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" isLoading={isVerifying}>
                Activate Two-Factor
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Disable MFA Modal */}
      <Modal
        isOpen={isDisableOpen}
        onClose={() => setIsDisableOpen(false)}
        title="Disable Two-Factor Authentication"
        subtitle="Confirm your master password to turn off 2FA"
        maxWidth="sm"
      >
        <form onSubmit={handleDisableMfa} className="space-y-4">
          <Input
            label="Master Password"
            type="password"
            placeholder="Enter your current password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setIsDisableOpen(false)}
              disabled={isDisabling}
            >
              Cancel
            </Button>
            <Button variant="danger" size="md" type="submit" isLoading={isDisabling}>
              Disable 2FA
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
