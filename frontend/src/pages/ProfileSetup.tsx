import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useSaveCallerUserProfile, useCreateGuestProfile } from '../hooks/useQueries';
import { savePlayerProfile } from '../lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { User, Phone, Briefcase, FileText, Loader2 } from 'lucide-react';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [bio, setBio] = useState('');
  const [workField, setWorkField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveProfileMutation = useSaveCallerUserProfile();
  const createGuestProfileMutation = useCreateGuestProfile();

  const isGuest = !identity;
  const isActorReady = !!actor && !actorFetching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!isActorReady) {
      toast.error('Still connecting to network. Please wait a moment and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isGuest) {
        // Guest profile creation — use null instead of undefined for optional fields
        await createGuestProfileMutation.mutateAsync({
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          bio: bio.trim() || null,
          profilePicture: null,
          workField: workField.trim() || null,
        });

        // Save to localStorage for guest persistence
        savePlayerProfile({
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          bio: bio.trim() || undefined,
          workField: workField.trim() || undefined,
        });

        toast.success('Profile created! Welcome to Rally.');
        navigate({ to: '/' });
      } else {
        // Authenticated user profile creation
        await saveProfileMutation.mutateAsync({
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          bio: bio.trim() || undefined,
          profilePicture: undefined,
          workField: workField.trim() || undefined,
        });

        // Also save to localStorage
        savePlayerProfile({
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          bio: bio.trim() || undefined,
          workField: workField.trim() || undefined,
        });

        toast.success('Profile saved! Welcome to Rally.');
        navigate({ to: '/' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      if (message === 'Actor not available') {
        toast.error('Connection issue. Please refresh and try again.');
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending =
    isSubmitting ||
    saveProfileMutation.isPending ||
    createGuestProfileMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {isGuest ? 'Create Guest Profile' : 'Set Up Your Profile'}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isGuest
              ? 'Enter your name to get started as a guest player'
              : 'Tell us a bit about yourself to get started'}
          </p>
        </div>

        {/* Network connecting indicator */}
        {actorFetching && (
          <div className="mb-4 p-3 rounded-lg bg-muted border border-border flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Connecting to network...</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4 text-muted-foreground" />
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="h-11"
              required
            />
          </div>

          {/* Mobile Number / Username */}
          <div className="space-y-2">
            <Label htmlFor="mobile" className="flex items-center gap-2 text-sm font-medium">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Username / Mobile
            </Label>
            <Input
              id="mobile"
              type="text"
              placeholder="Username or mobile number (optional)"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              disabled={isPending}
              className="h-11"
            />
          </div>

          {/* Work Field */}
          <div className="space-y-2">
            <Label htmlFor="workField" className="flex items-center gap-2 text-sm font-medium">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              Work / Profession
            </Label>
            <Input
              id="workField"
              type="text"
              placeholder="What do you do? (optional)"
              value={workField}
              onChange={(e) => setWorkField(e.target.value)}
              disabled={isPending}
              className="h-11"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Bio
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell other players about yourself (optional)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isPending}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 font-display font-semibold text-base"
            disabled={isPending || !isActorReady}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isGuest ? 'Creating Profile...' : 'Saving Profile...'}
              </>
            ) : isGuest ? (
              'Create Guest Profile'
            ) : (
              'Save Profile'
            )}
          </Button>

          {!isActorReady && !actorFetching && (
            <p className="text-center text-xs text-destructive">
              Network unavailable. Please refresh the page.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
