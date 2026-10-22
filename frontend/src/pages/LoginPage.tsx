import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Shield, Mail, Lock, ArrowRight, Info, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated, loginWithSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const isSessionExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });

      // Check if MFA is required
      if (response.mfaRequired && response.data?.mfaTempToken) {
        showToast('Two-Factor Authentication required', 'info');
        navigate('/mfa-verify', {
          state: { mfaTempToken: response.data.mfaTempToken, email },
        });
        return;
      }

      // Successful standard login
      loginWithSession(response.data.token, response.data.user);
      showToast('Welcome back to SecureVault!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid email or password.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-navy-950 font-bold" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white font-mono">
              Secure<span className="text-emerald-400">Vault</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-100">Sign In</h2>
        </div>

        {isSessionExpired && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>Your session has expired. Please log in again to continue.</span>
          </div>
        )}

        <Card className="border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-medium">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>

            {/* Quick Demo Autofill */}
            <button
              type="button"
              onClick={() => {
                setEmail('demo@example.com');
                setPassword('DemoPassword123!');
              }}
              className="w-full py-2 px-3 text-xs font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Autofill Demo Account</span>
              <span className="text-slate-400 text-[10px]">(demo@example.com)</span>
            </button>
          </form>
        </Card>


        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};
