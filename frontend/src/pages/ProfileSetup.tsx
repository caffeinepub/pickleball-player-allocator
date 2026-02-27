import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSaveCallerUserProfile, useCreateGuestProfile } from '../hooks/useQueries';
import { getAuthChoice } from './Login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Briefcase, FileText } from 'lucide-react';
import { savePlayerProfile, type StoredPlayerProfile } from '../lib/storage';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const authChoice = getAuthChoice();
  const isGuest = authChoice === 'guest' || !identity;

  const saveProfile = useSaveCallerUserProfile();
  const createGuestProfile = useCreateGuestProfile();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [bio, setBio] = useState('');
  const [workField, setWorkField] = useState('');
  const [error, setError] = useState('');

  const isLoading = saveProfile.isPending || createGuestProfile.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      if (isGuest) {
        // Guest profile: call createGuestProfile on backend
        const result = await createGuestProfile.mutateAsync({
          name: name.trim(),
          mobileNumber: mobile.trim(),
          bio: bio.trim() || undefined,
          workField: workField.trim() || undefined,
        });

        // Save to localStorage for persistence
        const stored: StoredPlayerProfile = {
          name: name.trim(),
          mobileNumber: mobile.trim(),
          bio: bio.trim() || undefined,
          workField: workField.trim() || undefined,
          principalId: result.id.toString(),
        };
        savePlayerProfile(stored);
      } else {
        // Authenticated user: save via saveCallerUserProfile
        await saveProfile.mutateAsync({
          name: name.trim(),
          mobileNumber: mobile.trim(),
          bio: bio.trim() || undefined,
          workField: workField.trim() || undefined,
          profilePicture: undefined,
        });

        // Also save to localStorage
        const stored: StoredPlayerProfile = {
          name: name.trim(),
          mobileNumber: mobile.trim(),
          bio: bio.trim() || undefined,
          workField: workField.trim() || undefined,
          principalId: identity?.getPrincipal().toString(),
        };
        savePlayerProfile(stored);
      }

      navigate({ to: '/' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground font-display">
            {isGuest ? 'Set Up Guest Profile' : 'Create Your Profile'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tell us a bit about yourself to get started
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Player Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="flex items-center gap-1.5 text-sm">
                  <User size={14} />
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mobile" className="flex items-center gap-1.5 text-sm">
                  <Phone size={14} />
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+1 234 567 8900"
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="workField" className="flex items-center gap-1.5 text-sm">
                  <Briefcase size={14} />
                  Work / Field
                </Label>
                <Input
                  id="workField"
                  value={workField}
                  onChange={(e) => setWorkField(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bio" className="flex items-center gap-1.5 text-sm">
                  <FileText size={14} />
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short bio about yourself..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Saving...' : 'Save Profile & Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
