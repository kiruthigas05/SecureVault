import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { StrengthMeter } from './StrengthMeter';
import { passwordToolsService } from '../services/api';
import { PasswordAnalysisResult } from '../types';
import { Eye, EyeOff, Wand2, Globe, User, KeyRound } from 'lucide-react';

interface AddCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cred: { website: string; username: string; password: string }) => Promise<void>;
  isLoading?: boolean;
}

export const AddCredentialModal: React.FC<AddCredentialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState<PasswordAnalysisResult | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setWebsite('');
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setAnalysis(null);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (password) {
      passwordToolsService.analyze(password).then(setAnalysis).catch(() => {});
    } else {
      setAnalysis(null);
    }
  }, [password]);

  const handleGenerate = async () => {
    try {
      const res = await passwordToolsService.generate({
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        special: true,
      });
      setPassword(res.password);
      setShowPassword(true);
      setAnalysis(res.analysis);
    } catch (err) {
      console.error('Error generating password', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!website.trim()) newErrors.website = 'Website is required';
    if (!username.trim()) newErrors.username = 'Username or email is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave({ website: website.trim(), username: username.trim(), password });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Credential to Vault"
      subtitle="Encrypted with AES-256-GCM before saving to database"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Website or Service Name"
          placeholder="e.g. github.com, Google Cloud, Netflix"
          value={website}
          onChange={(e) => {
            setWebsite(e.target.value);
            if (errors.website) setErrors((prev) => ({ ...prev, website: '' }));
          }}
          error={errors.website}
          icon={<Globe className="w-4 h-4 text-slate-400" />}
        />

        <Input
          label="Username or Email"
          placeholder="e.g. alex@example.com or dev_user"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
          }}
          error={errors.username}
          icon={<User className="w-4 h-4 text-slate-400" />}
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter secure password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
            }}
            error={errors.password}
            icon={<KeyRound className="w-4 h-4 text-slate-400" />}
            rightAction={
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="p-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded flex items-center gap-1 transition-colors"
                  title="Generate strong password"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Generate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            }
          />
        </div>

        {/* Strength Meter */}
        {analysis && (
          <div className="pt-1">
            <StrengthMeter analysis={analysis} showDetails={false} />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isLoading}>
            Save Credential
          </Button>
        </div>
      </form>
    </Modal>
  );
};
