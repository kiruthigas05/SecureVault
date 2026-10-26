import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { securityService, sessionsService } from '../services/api';
import { SecurityScoreReport, Session } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Laptop,
  Smartphone,
  Trash2,
  CheckCircle2,
  Clock,
  Globe,
  Radio,
  Hourglass,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';


export const SecurityPage: React.FC = () => {
  const { showToast } = useToast();
  const [report, setReport] = useState<SecurityScoreReport | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Revoke session state
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAllOthers, setIsRevokingAllOthers] = useState(false);

  const fetchData = async () => {
    try {
      const [scoreData, sessionData] = await Promise.all([
        securityService.getScore(),
        sessionsService.list(),
      ]);
      setReport(scoreData);
      setSessions(sessionData);
    } catch (err: any) {
      showToast('Error loading security report', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRevokeSingle = async () => {
    if (!revokingSessionId) return;
    try {
      await sessionsService.revoke(revokingSessionId);
      setSessions((prev) => prev.filter((s) => s.id !== revokingSessionId));
      showToast('Session successfully revoked.', 'success');
      // Refresh score
      const newScore = await securityService.getScore();
      setReport(newScore);
    } catch {
      showToast('Failed to revoke session.', 'error');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      const count = await sessionsService.revokeOthers();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      showToast(`Revoked ${count} active session(s).`, 'success');
      setIsRevokingAllOthers(false);
      const newScore = await securityService.getScore();
      setReport(newScore);
    } catch {
      showToast('Failed to revoke other sessions.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Security & Session Defense</h1>
          <Badge variant="emerald" dot>
            Audit Verified
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Review overall health score, resolve password reuse vulnerabilities, and manage active device sessions
        </p>
      </div>

      {/* Password Reuse Vulnerabilities Section */}
      <Card className="border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Password Reuse Detection</h3>
              <p className="text-xs text-slate-400">Zero-knowledge in-memory credential comparison</p>
            </div>
          </div>

          {report?.reusedGroups && report.reusedGroups.length > 0 ? (
            <Badge variant="rose" dot>
              {report.reusedGroups.length} Reused Groups Detected
            </Badge>
          ) : (
            <Badge variant="emerald" dot>
              Zero Reused Passwords
            </Badge>
          )}
        </div>

        {report?.reusedGroups && report.reusedGroups.length > 0 ? (
          <div className="space-y-3">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Vulnerability: Reused Passwords Across Accounts</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Using the same password across multiple services makes your accounts susceptible to credential stuffing if one provider suffers a data breach.
              </p>
            </div>

            {report.reusedGroups.map((group, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    ⚠ Password reused across {group.count} accounts
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Duplicate Cluster #{idx + 1}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {group.websites.map((site, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {site}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-400 pt-1">
                  Recommendation: <span className="text-slate-300">Generate a unique 16+ character password for each account.</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">No Password Reuse Detected</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All website credentials currently stored in your vault have unique, distinct passwords.
            </p>
          </div>
        )}
      </Card>

      {/* Credential Aging & 90-Day Rotation Policy Section */}
      <Card className="border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Credential Aging & 90-Day Rotation Policy</h3>
              <p className="text-xs text-slate-400">Automated tracking to prevent dormant & stale credentials</p>
            </div>
          </div>

          {(report?.metrics?.stalePasswordsCount ?? 0) > 0 ? (
            <Badge variant="rose" dot>
              {report?.metrics?.stalePasswordsCount} Stale Passwords Need Rotation
            </Badge>
          ) : (
            <Badge variant="emerald" dot>
              All Credentials Fresh & Compliant
            </Badge>
          )}
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 rounded-xl bg-navy-950 border border-emerald-900/40 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              🟢 Fresh (&lt; 30 Days)
            </span>
            <div className="text-2xl font-bold text-white font-mono">
              {report?.metrics?.freshPasswordsCount ?? 0}
            </div>
            <span className="text-[11px] text-slate-400 block">Recently created or rotated</span>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-amber-900/40 space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              🟡 Aging (30–90 Days)
            </span>
            <div className="text-2xl font-bold text-white font-mono">
              {report?.metrics?.agingPasswordsCount ?? 0}
            </div>
            <span className="text-[11px] text-slate-400 block">Nearing recommended rotation window</span>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-rose-900/40 space-y-1">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
              🔴 Stale (&gt; 90 Days)
            </span>
            <div className="text-2xl font-bold text-white font-mono">
              {report?.metrics?.stalePasswordsCount ?? 0}
            </div>
            <span className="text-[11px] text-slate-400 block">Immediate rotation advised (NIST guidelines)</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Average Stored Credential Age:{' '}
              <strong className="text-white font-mono">{report?.metrics?.averageAgeDays ?? 0} days</strong>
            </span>
          </div>
          <Link
            to="/vault"
            className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
          >
            Review in Vault <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Card>



      {/* Active Sessions Management Section */}
      <Card className="border-slate-800 space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Active Device & Browser Sessions</h3>
              <p className="text-xs text-slate-400">Manage signed-in devices with instantaneous remote revocation</p>
            </div>
          </div>

          {sessions.length > 1 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsRevokingAllOthers(true)}
            >
              Revoke All Other Sessions
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                session.isCurrent
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-navy-950 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 mt-0.5">
                  {session.userAgent?.toLowerCase().includes('mobile') ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {session.userAgent ? session.userAgent.slice(0, 60) : 'Browser Client'}
                    </span>
                    {session.isCurrent && (
                      <Badge variant="emerald" dot>
                        Current Session
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                    <span>IP: {session.ipAddress || '127.0.0.1'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Started {new Date(session.createdAt).toLocaleDateString()} at{' '}
                      {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {!session.isCurrent && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRevokingSessionId(session.id)}
                  icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                  className="shrink-0 self-end sm:self-center"
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Revoke Single Session Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(revokingSessionId)}
        onClose={() => setRevokingSessionId(null)}
        onConfirm={handleRevokeSingle}
        title="Revoke Active Session"
        message="Are you sure you want to terminate this session? The device will be immediately signed out and its authentication tokens will be invalidated."
        confirmText="Revoke Session"
      />

      {/* Revoke All Other Sessions Confirmation */}
      <ConfirmDialog
        isOpen={isRevokingAllOthers}
        onClose={() => setIsRevokingAllOthers(false)}
        onConfirm={handleRevokeAllOthers}
        title="Revoke All Other Sessions"
        message="This action will immediately log out all other browsers, mobile devices, and active connections except for your current window."
        confirmText="Revoke All Other Sessions"
      />
    </div>
  );
};
