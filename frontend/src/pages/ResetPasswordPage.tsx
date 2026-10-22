import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { authService, passwordToolsService } from '../services/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StrengthMeter } from '../components/StrengthMeter';
import { PasswordAnalysisResult } from '../types';
import { ShieldCheck, Lock, Key, ArrowRight, ArrowLeft } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [analysis, setAnalysis] = useState<PasswordAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (password) {
      passwordToolsService.analyze(password).then(setAnalysis).catch(() => {});
    } else {
      setAnalysis(null);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (analysis && analysis.score < 25) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.resetPassword({
        token: token.trim(),
        password,
        confirmPassword,
      });

      showToast(res.message, 'success');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Password reset failed.';
      setError(msg);
      showToast(msg, 'error');
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
          <h2 className="text-xl font-bold text-slate-100">Set New Master Password</h2>
          <p className="text-xs text-slate-400">
            Resetting your password will automatically revoke all other active sessions
          </p>
        </div>

        <Card className="border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-medium">
                {error}
              </div>
            )}

            <Input
              label="One-Time Recovery Token"
              placeholder="Paste 64-character token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              icon={<Key className="w-4 h-4 text-slate-400" />}
              className="font-mono text-xs"
              required
            />

            <Input
              label="New Master Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            {analysis && (
              <div className="pt-1">
                <StrengthMeter analysis={analysis} />
              </div>
            )}

            <Input
              label="Confirm New Master Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Reset & Invalidate All Sessions
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
