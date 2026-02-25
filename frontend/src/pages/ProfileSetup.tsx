import React, { useState } from 'react';
import { useRouter, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, ChevronRight, Star } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useSaveCallerUserProfile } from '@/hooks/useQueries';
import { setPlayerProfile } from '@/lib/storage';
import { toast } from 'sonner';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { formatErrorMessage } from '@/lib/errorHandling';

export default function ProfileSetup() {
  const router = useRouter();
  const search = useSearch({ strict: false }) as { next?: string };
  const [name, setName] = useState('');
  const [duprRating, setDuprRating] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saveProfile = useSaveCallerUserProfile();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;

  const navigateNext = () => {
    const next = search?.next;
    if (next === 'create') {
      router.navigate({ to: '/session/create' });
    } else if (next === 'join') {
      router.navigate({ to: '/session/join' });
    } else {
      router.navigate({ to: '/' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const parsedRating = duprRating ? parseFloat(duprRating) : undefined;
    if (parsedRating !== undefined && (isNaN(parsedRating) || parsedRating < 2.0 || parsedRating > 8.0)) {
      toast.error('DUPR rating must be between 2.00 and 8.00');
      return;
    }

    setIsSaving(true);

    try {
      // Always save to localStorage first — works for both guests and authenticated users
      setPlayerProfile({ name: name.trim(), duprRating: parsedRating });

      // Only call the backend if the user is authenticated (has Internet Identity)
      // Guest users (anonymous principals) don't have the #user role and cannot call saveCallerUserProfile
      if (isAuthenticated) {
        await saveProfile.mutateAsync({
          name: name.trim(),
          duprRating: parsedRating,
        });
      }

      toast.success('Profile created!');
      navigateNext();
    } catch (err) {
      // If backend save fails, we still have the localStorage copy
      // Show a user-friendly error but don't block navigation for non-critical failures
      const msg = formatErrorMessage(err);
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        // Unauthorized means the user doesn't have the right role
        // This shouldn't happen for authenticated users, but handle gracefully
        toast.error('Unable to save profile to the server. Your profile has been saved locally.');
        navigateNext();
      } else {
        toast.error(`Failed to save profile: ${msg}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isPending = isSaving || saveProfile.isPending;

  return (
    <Layout title="Create Profile" showBack backTo="/">
      <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
        {/* Avatar Preview */}
        <div className="flex justify-center pt-2">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-card">
            {name ? (
              <span className="font-display font-black text-3xl text-primary-foreground">
                {name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
        </div>

        {/* Name Input */}
        <Card className="border border-border shadow-card">
          <CardContent className="pt-4 pb-4 px-4">
            <Label htmlFor="name" className="text-sm font-semibold text-foreground mb-2 block">
              Your Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base"
              autoFocus
              maxLength={30}
            />
          </CardContent>
        </Card>

        {/* DUPR Rating */}
        <Card className="border border-border shadow-card">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              DUPR Rating
              <span className="text-xs font-normal text-muted-foreground ml-1">(Optional)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Your Dynamic Universal Pickleball Rating (2.00–8.00)
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <Input
              id="duprRating"
              type="number"
              placeholder="e.g. 3.50"
              value={duprRating}
              onChange={(e) => setDuprRating(e.target.value)}
              min={2.0}
              max={8.0}
              step={0.01}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Leave blank if you don't have a DUPR rating yet.
            </p>
          </CardContent>
        </Card>

        {/* Guest notice */}
        {!isAuthenticated && (
          <p className="text-xs text-muted-foreground text-center px-2">
            You're continuing as a guest. Your profile will be saved on this device only.
          </p>
        )}

        <Button
          type="submit"
          className="w-full btn-touch gradient-primary text-primary-foreground font-display font-bold text-base shadow-card"
          disabled={isPending || !name.trim()}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            <>
              Create Profile
              <ChevronRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </form>
    </Layout>
  );
}
