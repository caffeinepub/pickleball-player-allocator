import React, { useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, UserRound, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

const AUTH_CHOICE_KEY = 'pickleball_auth_choice';

export function setAuthChoice(choice: 'identity' | 'guest') {
  sessionStorage.setItem(AUTH_CHOICE_KEY, choice);
}

export function getAuthChoice(): string | null {
  return sessionStorage.getItem(AUTH_CHOICE_KEY);
}

export function clearAuthChoice() {
  sessionStorage.removeItem(AUTH_CHOICE_KEY);
}

export default function Login() {
  const router = useRouter();
  const { login, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If already made a choice this session, skip to home
  useEffect(() => {
    if (getAuthChoice()) {
      router.navigate({ to: '/' });
    }
  }, []);

  // After successful identity login, set choice and navigate
  useEffect(() => {
    if (identity && loginStatus === 'success') {
      setAuthChoice('identity');
      queryClient.clear();
      router.navigate({ to: '/' });
    }
  }, [identity, loginStatus]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      // Navigation handled in useEffect above
    } catch (error: any) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuest = () => {
    setAuthChoice('guest');
    router.navigate({ to: '/' });
  };

  const loading = isLoggingIn || loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Hero */}
      <div
        className="relative overflow-hidden flex-1 flex flex-col"
        style={{
          backgroundImage: 'url(/assets/generated/court-bg.dim_800x600.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-primary/85" />

        {/* Top branding */}
        <div className="relative px-6 pt-16 pb-8 text-center">
          <div className="flex justify-center mb-5">
            <img
              src="/assets/generated/app-logo.dim_256x256.png"
              alt="Pickleball Allocator"
              className="h-24 w-24 rounded-3xl shadow-xl object-cover ring-4 ring-primary-foreground/20"
            />
          </div>
          <h1 className="font-display font-black text-4xl text-primary-foreground mb-2 tracking-tight">
            Pickleball Allocator
          </h1>
          <p className="text-primary-foreground/75 text-base max-w-xs mx-auto leading-relaxed">
            Smart player allocation for your pickleball sessions
          </p>
        </div>

        {/* Auth cards */}
        <div className="relative px-5 pb-10 mt-auto space-y-3">
          {/* Sign In card */}
          <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-sm">
            <CardContent className="pt-5 pb-5 px-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center shrink-0 shadow-md">
                  <LogIn className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground text-base">Sign In</p>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Save your profile and track your stats across sessions
                  </p>
                </div>
              </div>
              <Button
                className="w-full btn-touch gradient-primary text-primary-foreground font-display font-bold text-base shadow-md"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In with Internet Identity
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Guest card */}
          <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-sm">
            <CardContent className="pt-5 pb-5 px-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center shrink-0 shadow-sm">
                  <UserRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground text-base">Continue as Guest</p>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Join or host a session without creating an account
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full btn-touch border-2 border-primary/30 text-primary font-display font-bold text-base"
                onClick={handleGuest}
                disabled={loading}
              >
                <UserRound className="h-4 w-4 mr-2" />
                Continue as Guest
              </Button>
            </CardContent>
          </Card>

          {/* How it works */}
          <div className="pt-2 px-1">
            <p className="text-xs font-semibold text-primary-foreground/60 uppercase tracking-wide mb-3 text-center">
              How it works
            </p>
            <div className="space-y-2">
              {[
                { step: '1', text: 'Host creates a session and shares the code' },
                { step: '2', text: 'Players join using the session code' },
                { step: '3', text: 'Host allocates players to courts randomly' },
                { step: '4', text: 'Play, submit results, and rotate!' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">{step}</span>
                  </div>
                  <p className="text-sm text-primary-foreground/75">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-4 text-center border-t border-border bg-card">
        <p className="text-xs text-muted-foreground">
          Built with{' '}
          <span className="text-destructive">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'pickleball-allocator')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            caffeine.ai
          </a>
          {' '}· © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
