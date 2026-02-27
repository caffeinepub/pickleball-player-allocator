import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { getPlayerProfile, savePlayerProfile } from '../lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Briefcase, FileText, Edit2, Save, X, ArrowLeft } from 'lucide-react';

export default function ProfileView() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  // Determine guest status from identity alone (Login no longer exports getAuthChoice)
  const isGuest = !identity;

  const { data: backendProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [bio, setBio] = useState('');
  const [workField, setWorkField] = useState('');
  const [error, setError] = useState('');

  // Load profile from backend or localStorage
  useEffect(() => {
    if (backendProfile) {
      setName(backendProfile.name || '');
      setMobile(backendProfile.mobileNumber || '');
      setBio(backendProfile.bio || '');
      setWorkField(backendProfile.workField || '');
    } else if (!profileLoading) {
      // Fallback to localStorage
      const stored = getPlayerProfile();
      if (stored) {
        setName(stored.name || '');
        setMobile(stored.mobileNumber || '');
        setBio(stored.bio || '');
        setWorkField(stored.workField || '');
      }
    }
  }, [backendProfile, profileLoading]);

  const handleSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      if (!isGuest) {
        await saveProfile.mutateAsync({
          name: name.trim(),
          mobileNumber: mobile.trim(),
          bio: bio.trim() || undefined,
          workField: workField.trim() || undefined,
          profilePicture: undefined,
        });
      }

      savePlayerProfile({
        name: name.trim(),
        mobileNumber: mobile.trim(),
        bio: bio.trim() || undefined,
        workField: workField.trim() || undefined,
      });

      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      setError(msg);
    }
  };

  const displayName = name || 'Player';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground text-sm animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
      {/* Back button */}
      <button
        onClick={() => navigate({ to: '/' })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      {/* Avatar & name */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
          {initials}
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground font-display">{displayName}</h1>
          {isGuest && (
            <Badge variant="secondary" className="mt-1 text-xs">
              Guest
            </Badge>
          )}
        </div>
      </div>

      {/* Profile details card */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Profile Details</CardTitle>
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 size={14} className="mr-1" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X size={14} className="mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saveProfile.isPending}>
                <Save size={14} className="mr-1" />
                {saveProfile.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isEditing ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="flex items-center gap-1.5 text-sm">
                  <User size={14} />
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mobile" className="flex items-center gap-1.5 text-sm">
                  <Phone size={14} />
                  Username / Mobile
                </Label>
                <Input
                  id="mobile"
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Username or mobile number"
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
                  placeholder="Tell other players about yourself"
                  className="resize-none"
                  rows={3}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <User size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">{name || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Username / Mobile</p>
                  <p className="text-sm font-medium">{mobile || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Work / Field</p>
                  <p className="text-sm font-medium">{workField || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Bio</p>
                  <p className="text-sm font-medium">{bio || '—'}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
