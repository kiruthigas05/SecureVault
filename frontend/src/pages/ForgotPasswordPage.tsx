import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ShieldAlert, Mail, ArrowRight, ArrowLeft, Clock, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDevToken(null);
    setMessage('');

    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message);
      showToast('Recovery request submitted.', 'info');

      if (res.devResetToken) {
        setDevToken(res.devResetToken);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error requesting recovery token.';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Recover Your Account</h2>
          <p className="text-xs text-slate-400">
            Generate a secure, time-limited one-time password recovery token
          </p>
        </div>

        <Card className="border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Email Address"
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Generate Recovery Link
            </Button>
          </form>

          {message && !devToken && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
              {message}
            </div>
          )}

          {/* Academic FSD Development Mode Showcase */}
          {devToken && (
            <div className="mt-6 pt-5 border-t border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="indigo" dot>
                  Academic Development Mode
                </Badge>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  TTL: 15 mins (Redis)
                </span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <p className="text-xs text-slate-300">
                  Simulated recovery email dispatched for academic evaluation:
                </p>
                <div className="p-2 bg-navy-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 break-all select-all">
                  {devToken}
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                icon={<KeyRound className="w-4 h-4" />}
                onClick={() => navigate(`/reset-password?token=${devToken}`)}
              >
                Proceed to Reset Password
              </Button>
            </div>
          )}
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
