import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ShieldCheck, Key, ArrowRight, ArrowLeft } from 'lucide-react';

export const MfaVerifyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithSession } = useAuth();
  const { showToast } = useToast();

  const mfaTempToken = location.state?.mfaTempToken;
  const email = location.state?.email || 'your account';

  const [code, setCode] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!mfaTempToken) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center space-y-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 w-12 h-12 rounded-xl mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Session Expired</h3>
          <p className="text-xs text-slate-400">
            No active Multi-Factor challenge found. Please sign in with your email and master password first.
          </p>
          <Link to="/login">
            <Button variant="primary" size="md" className="w-full">
              Back to Login
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.mfaLogin({
        mfaTempToken,
        code: code.trim(),
        isBackupCode,
      });

      loginWithSession(response.data.token, response.data.user);
      showToast('Two-Factor Authentication verified successfully!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid verification code.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Two-Factor Authentication</h2>
          <p className="text-xs text-slate-400">
            Enter the code generated for <span className="text-slate-200 font-medium">{email}</span>
          </p>
        </div>

        <Card className="border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-medium">
                {error}
              </div>
            )}

            {!isBackupCode ? (
              <Input
                label="6-Digit Authenticator Code"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-xl tracking-[0.3em] font-mono"
                required
                autoFocus
              />
            ) : (
              <Input
                label="8-Character Backup Recovery Code"
                placeholder="ABCD-1234"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-base tracking-widest font-mono"
                icon={<Key className="w-4 h-4 text-slate-400" />}
                required
                autoFocus
              />
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Verify & Enter Vault
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsBackupCode(!isBackupCode);
                  setCode('');
                  setError('');
                }}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {isBackupCode
                  ? '← Use 6-digit Authenticator App code'
                  : 'Lost your device? Use an emergency backup code'}
              </button>
            </div>
          </form>
        </Card>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
