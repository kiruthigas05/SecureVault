import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { securityService, credentialsService, activityService } from '../services/api';
import { SecurityScoreReport, AuditLog } from '../types';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { AddCredentialModal } from '../components/AddCredentialModal';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  Wand2,
  Gauge,
  Settings,
  Plus,
  ArrowRight,
  Clock,
  History,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [scoreReport, setScoreReport] = useState<SecurityScoreReport | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingCred, setIsSavingCred] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [report, activityData] = await Promise.all([
        securityService.getScore(),
        activityService.list(5, 0),
      ]);
      setScoreReport(report);
      setRecentLogs(activityData.logs || []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveCredential = async (cred: { website: string; username: string; password: string }) => {
    setIsSavingCred(true);
    try {
      await credentialsService.create(cred);
      showToast(`Credential for ${cred.website} securely saved!`, 'success');
      await fetchDashboardData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save credential.';
      showToast(msg, 'error');
    } finally {
      setIsSavingCred(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-teal-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is your vault security overview and real-time defense posture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={<Wand2 className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Credential
          </Button>
          <Link to="/security">
            <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
              Improve Security
            </Button>
          </Link>
        </div>
      </div>

      {/* Security Score Hero Card */}
      <Card className="relative overflow-hidden border-slate-800/80 bg-gradient-to-br from-navy-900 via-navy-900/90 to-navy-950">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Main Score Display */}
          <div className="flex items-center gap-6 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-6 lg:pb-0 lg:pr-8">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-800/80"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  className={getScoreColor(scoreReport?.overallScore || 0)}
                  fill="transparent"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * (scoreReport?.overallScore || 0)) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold font-mono text-white">
                  {scoreReport ? scoreReport.overallScore : '--'}
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-400">/ 100</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Overall Security Score
              </span>
              <h3 className={`text-2xl font-extrabold ${getScoreColor(scoreReport?.overallScore || 0)}`}>
                {scoreReport?.status || 'Analyzing...'}
              </h3>
              <p className="text-xs text-slate-400 max-w-[200px]">
                {scoreReport?.overallScore && scoreReport.overallScore >= 80
                  ? 'Your master vault has excellent cryptographic posture.'
                  : 'Action needed to resolve vulnerabilities and reuse.'}
              </p>
            </div>
          </div>

          {/* Breakdown Bars */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="font-semibold uppercase text-slate-300">Defense Metric Breakdown</span>
              <span>Weighted Scoring</span>
            </div>

            {/* Metric 1 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Password Strength</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {scoreReport?.breakdown.passwordStrength || 0}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${scoreReport?.breakdown.passwordStrength || 0}%` }}
                />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Password Reuse Defense</span>
                <span
                  className={`font-mono font-bold ${
                    (scoreReport?.breakdown.passwordReuse || 0) < 70 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {scoreReport?.breakdown.passwordReuse || 0}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (scoreReport?.breakdown.passwordReuse || 0) < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${scoreReport?.breakdown.passwordReuse || 0}%` }}
                />
              </div>
            </div>

            {/* Metric 3 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Two-Factor Authentication (MFA)</span>
                <span
                  className={`font-mono font-bold ${
                    scoreReport?.breakdown.mfaProtection === 100 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {scoreReport?.breakdown.mfaProtection || 0}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    scoreReport?.breakdown.mfaProtection === 100 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${scoreReport?.breakdown.mfaProtection || 0}%` }}
                />
              </div>
            </div>

            {/* Metric 4 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Credential Hygiene</span>
                <span className="font-mono text-teal-400 font-bold">
                  {scoreReport?.breakdown.credentialHygiene || 0}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${scoreReport?.breakdown.credentialHygiene || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saved Credentials */}
        <Card hover className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Saved Credentials
            </span>
            <div className="text-2xl font-extrabold text-white font-mono">
              {scoreReport?.metrics.totalCredentials || 0}
            </div>
            <Link to="/vault" className="text-xs text-emerald-400 hover:underline inline-block pt-1">
              Manage in Vault →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
        </Card>

        {/* Weak Passwords */}
        <Card hover className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Weak Passwords
            </span>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">
              {scoreReport?.metrics.weakPasswordsCount || 0}
            </div>
            <Link to="/password-generator" className="text-xs text-amber-400 hover:underline inline-block pt-1">
              Upgrade weak items →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Card>

        {/* Reused Passwords */}
        <Card hover className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Reused Passwords
            </span>
            <div
              className={`text-2xl font-extrabold font-mono ${
                (scoreReport?.metrics.reusedPasswordsCount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {scoreReport?.metrics.reusedPasswordsCount || 0}
            </div>
            <Link to="/security" className="text-xs text-rose-400 hover:underline inline-block pt-1">
              View reuse alerts →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <RefreshCw className="w-6 h-6" />
          </div>
        </Card>

        {/* MFA Status */}
        <Card hover className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Multi-Factor (2FA)
            </span>
            <div className="text-xl font-extrabold text-white">
              {user?.mfaEnabled ? (
                <span className="text-emerald-400">Active</span>
              ) : (
                <span className="text-amber-400">Disabled</span>
              )}
            </div>
            <Link to="/settings" className="text-xs text-emerald-400 hover:underline inline-block pt-1">
              Configure TOTP →
            </Link>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              user?.mfaEnabled
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}
          >
            {user?.mfaEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
        </Card>
      </div>

      {/* Main Grid: Recommendations & Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommendations Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Security Recommendations</span>
              </h3>
              <Link to="/security" className="text-xs text-emerald-400 hover:underline">
                View detailed breakdown
              </Link>
            </div>

            <div className="space-y-3">
              {scoreReport?.recommendations && scoreReport.recommendations.length > 0 ? (
                scoreReport.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-3.5 rounded-xl border flex items-start justify-between gap-4 ${
                      rec.type === 'danger'
                        ? 'bg-rose-500/5 border-rose-500/20'
                        : rec.type === 'warning'
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-emerald-500/5 border-emerald-500/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        {rec.type === 'success' && <span className="text-emerald-400">✓</span>}
                        {rec.type === 'warning' && <span className="text-amber-400">⚠</span>}
                        {rec.type === 'danger' && <span className="text-rose-400">✕</span>}
                        {rec.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                    </div>

                    {rec.actionRoute && (
                      <Link to={rec.actionRoute} className="shrink-0">
                        <Button variant="secondary" size="sm">
                          {rec.actionLabel || 'Fix'}
                        </Button>
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">All security checks passed.</p>
              )}
            </div>
          </Card>

          {/* Quick Actions Grid */}
          <Card className="space-y-4">
            <h3 className="text-base font-bold text-white">Quick Security Tools</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/password-generator"
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850 transition-all flex flex-col items-center text-center group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                  <Wand2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Generator</span>
                <span className="text-[10px] text-slate-400 mt-0.5">CSPRNG</span>
              </Link>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850 transition-all flex flex-col items-center text-center group"
              >
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Add Credential</span>
                <span className="text-[10px] text-slate-400 mt-0.5">AES-256</span>
              </button>

              <Link
                to="/password-analyzer"
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850 transition-all flex flex-col items-center text-center group"
              >
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 mb-2 group-hover:scale-110 transition-transform">
                  <Gauge className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Analyzer</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Entropy</span>
              </Link>

              <Link
                to="/settings"
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850 transition-all flex flex-col items-center text-center group"
              >
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Settings</span>
                <span className="text-[10px] text-slate-400 mt-0.5">2FA & Profile</span>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Activity Column */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <span>Recent Audit Activity</span>
              </h3>
              <Link to="/activity" className="text-xs text-emerald-400 hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 font-mono">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      IP: {log.ipAddress || '127.0.0.1'}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No activity logged yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Credential Modal */}
      <AddCredentialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCredential}
        isLoading={isSavingCred}
      />
    </div>
  );
};
