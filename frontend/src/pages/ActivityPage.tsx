import React, { useState, useEffect } from 'react';
import { activityService } from '../services/api';
import { AuditLog } from '../types';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Radio,
  Clock,
  Laptop,
} from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    activityService
      .list(50, 0)
      .then((data) => setLogs(data.logs || []))
      .catch((err) => console.error('Error fetching logs:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const getActionDetails = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
      case 'USER_LOGIN_MFA_SUCCESS':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          title: 'Successful Authentication',
          badge: <Badge variant="emerald">Authentication</Badge>,
        };
      case 'FAILED_LOGIN_ATTEMPT':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          title: 'Failed Login Attempt',
          badge: <Badge variant="rose">Security Alert</Badge>,
        };
      case 'USER_LOGOUT':
        return {
          icon: <LogOut className="w-4 h-4 text-slate-400" />,
          title: 'User Signed Out',
          badge: <Badge variant="slate">Session</Badge>,
        };
      case 'CREDENTIAL_CREATED':
        return {
          icon: <KeyRound className="w-4 h-4 text-teal-400" />,
          title: 'Credential Added to Vault',
          badge: <Badge variant="emerald">Vault Change</Badge>,
        };
      case 'CREDENTIAL_UPDATED':
        return {
          icon: <KeyRound className="w-4 h-4 text-sky-400" />,
          title: 'Credential Updated',
          badge: <Badge variant="sky">Vault Change</Badge>,
        };
      case 'CREDENTIAL_DELETED':
        return {
          icon: <KeyRound className="w-4 h-4 text-amber-400" />,
          title: 'Credential Removed',
          badge: <Badge variant="amber">Vault Change</Badge>,
        };
      case 'CREDENTIAL_REVEALED':
        return {
          icon: <KeyRound className="w-4 h-4 text-indigo-400" />,
          title: 'Credential Password Revealed',
          badge: <Badge variant="indigo">Decrypted</Badge>,
        };
      case 'MFA_ENABLED':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          title: 'Two-Factor Authentication Activated',
          badge: <Badge variant="emerald">Security Policy</Badge>,
        };
      case 'MFA_DISABLED':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          title: 'Two-Factor Authentication Disabled',
          badge: <Badge variant="rose">Security Policy</Badge>,
        };
      case 'SESSION_REVOKED':
      case 'ALL_OTHER_SESSIONS_REVOKED':
        return {
          icon: <Radio className="w-4 h-4 text-amber-400" />,
          title: 'Active Session Terminated',
          badge: <Badge variant="amber">Session</Badge>,
        };
      case 'PASSWORD_RESET_REQUESTED':
      case 'PASSWORD_RESET_COMPLETED':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-teal-400" />,
          title: 'Account Recovery Action',
          badge: <Badge variant="sky">Recovery</Badge>,
        };
      default:
        return {
          icon: <History className="w-4 h-4 text-slate-400" />,
          title: action.replace(/_/g, ' '),
          badge: <Badge variant="slate">Audit</Badge>,
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Activity & Audit Logs</h1>
          <Badge variant="emerald" dot>
            Immutable
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Chronological record of authentication events, credential modifications, and security actions
        </p>
      </div>

      <Card className="border-slate-800 space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No audit records found.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {logs.map((log) => {
              const { icon, title, badge } = getActionDetails(log.action);
              const date = new Date(log.createdAt);

              return (
                <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100">{title}</span>
                        {badge}
                      </div>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                      <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                      {log.userAgent && (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <Laptop className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{log.userAgent}</span>
                        </span>
                      )}
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-500 font-mono">
                        {log.metadata.website && <span>Target: {log.metadata.website} • </span>}
                        {log.metadata.username && <span>Account: {log.metadata.username} • </span>}
                        {log.metadata.note && <span>Note: {log.metadata.note}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
