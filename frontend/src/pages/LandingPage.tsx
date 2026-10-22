import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  Shield,
  Lock,
  KeyRound,
  Gauge,
  Smartphone,
  RefreshCw,
  FileText,
  CheckCircle2,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-navy-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-navy-950 font-bold" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white font-mono">
              Secure<span className="text-emerald-400">Vault</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic FSD Capstone • End-to-End Cryptographic Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
            Protect Every Password. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
              Secure Every Account.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            SecureVault helps you generate, analyze, and securely manage your passwords with modern authentication,
            AES-256-GCM authenticated encryption, and multi-factor protection.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8" icon={<ArrowRight className="w-5 h-5" />}>
                Get Started Free
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8">
                Existing User Login
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>AES-256-GCM Authenticated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>RFC 6238 TOTP 2FA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero-Plaintext Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="emerald" className="mb-3">CAPABILITIES</Badge>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Engineered for Modern Credential Defense
          </h2>
          <p className="text-slate-400 mt-3 text-base">
            Every feature is built with real cryptographic primitives, complete state isolation, and audit readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Card hover className="flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Secure Credential Vault</h3>
            <p className="text-sm text-slate-400 leading-relaxed flex-1">
              Encrypted using military-grade AES-256-GCM authenticated encryption. Each credential uses a distinct 96-bit initialization vector and 128-bit authentication tag.
            </p>
          </Card>

          {/* Card 2 */}
          <Card hover className="flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
              <Gauge className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Password Strength Analysis</h3>
            <p className="text-sm text-slate-400 leading-relaxed flex-1">
              Real-time entropy estimation in bits, sequential keyboard detection, dictionary lookup, and character distribution metrics without sending passwords to external parties.
            </p>
          </Card>

          {/* Card 3 */}
          <Card hover className="flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Strong Password Generator</h3>
            <p className="text-sm text-slate-400 leading-relaxed flex-1">
              Cryptographically secure random generation (CSPRNG) with configurable length (12–64 characters) and character sets with guaranteed diversity and Fisher-Yates shuffle.
            </p>
          </Card>

          {/* Card 4 */}
          <Card hover className="flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">MFA Protection</h3>
            <p className="text-sm text-slate-400 leading-relaxed flex-1">
              Time-based One-Time Password (TOTP) compatible with Google Authenticator, Authy, and 1Password. Includes securely hashed emergency offline backup recovery codes.
            </p>
          </Card>

          {/* Card 5 */}
          <Card hover className="flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Password Reuse Detection</h3>
            <p className="text-sm text-slate-400 leading-relaxed flex-1">
              Automated in-memory credential comparison across your personal vault. Immediately flags identical passwords across different services to prevent credential stuffing.
            </p>
          </Card>

          {/* Card 6 */}
          <Card hover className="flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Secure Account Recovery</h3>
            <p className="text-sm text-slate-400 leading-relaxed flex-1">
              Time-limited (15-minute TTL) cryptographic reset tokens stored in Redis. Automatic invalidation of all existing browser sessions upon password changes.
            </p>
          </Card>
        </div>
      </section>

      {/* Security Architecture Deep Dive */}
      <section className="py-20 bg-navy-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="sky" className="mb-3">SECURITY ARCHITECTURE</Badge>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Rigorous Implementation Principles
            </h2>
            <p className="text-slate-400 mt-3 text-base">
              How SecureVault protects sensitive identity and credential data at every tier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="space-y-3">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-slate-200">Zero-Plaintext Storage</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                User account authentication passwords are salted and hashed using bcrypt (10 rounds). Stored website credentials are encrypted via AES-256-GCM. Plaintext passwords never enter database tables or persistent logs.
              </p>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-teal-400" />
                <h4 className="font-bold text-slate-200">Authenticated Encryption (AES-256-GCM)</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Galois/Counter Mode guarantees confidentiality and authenticity. If an attacker tampers with a single bit of ciphertext or authentication tag, decryption immediately fails before returning data.
              </p>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-sky-400" />
                <h4 className="font-bold text-slate-200">Active Session Management</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Sessions are tracked in PostgreSQL and cached in Redis. Users can view all active devices/browsers and execute single-click remote revocation or invalidate all other sessions simultaneously.
              </p>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-slate-200">Immutable Audit Logging</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every sensitive event—registration, successful login, failed authentication, credential creation, and MFA modification—is logged with timestamps, client agent, and sanitized metadata.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 bg-navy-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SecureVault — Third-Year Full Stack Development (FSD) Project</p>
          <div className="flex items-center gap-6">
            <span>React + TypeScript + Vite</span>
            <span>Express.js + Node.js</span>
            <span>PostgreSQL + Redis</span>
            <span>Docker</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
