import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { Credential } from '../types';
import { Globe, User, KeyRound, Eye, EyeOff } from 'lucide-react';

interface EditCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential: Credential | null;
  onUpdate: (id: string, data: { website?: string; username?: string; password?: string }) => Promise<void>;
  isLoading?: boolean;
}

export const EditCredentialModal: React.FC<EditCredentialModalProps> = ({
  isOpen,
  onClose,
  credential,
  onUpdate,
  isLoading = false,
}) => {
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (credential) {
      setWebsite(credential.website);
      setUsername(credential.username);
      setPassword('');
      setShowPassword(false);
    }
  }, [credential]);

  if (!credential) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatePayload: { website?: string; username?: string; password?: string } = {};

    if (website !== credential.website) updatePayload.website = website;
    if (username !== credential.username) updatePayload.username = username;
    if (password.trim()) updatePayload.password = password;

    await onUpdate(credential.id, updatePayload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Stored Credential"
      subtitle="Leave password blank to retain current encrypted password"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          icon={<Globe className="w-4 h-4 text-slate-400" />}
          required
        />

        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={<User className="w-4 h-4 text-slate-400" />}
          required
        />

        <Input
          label="New Password (optional)"
          type={showPassword ? 'text' : 'password'}
          placeholder="Leave blank to keep existing password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<KeyRound className="w-4 h-4 text-slate-400" />}
          rightAction={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
