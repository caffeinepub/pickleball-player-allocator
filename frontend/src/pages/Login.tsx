import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Zap, LogIn, UserCircle } from 'lucide-react';

export default function Login() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const navigate = useNavigate();
  const isLoggingIn = loginStatus === 'logging-in';

  React.useEffect(() => {
    if (identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  const handleGuestContinue = () => {
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Zap className="h-9 w-9 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Rally</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your pickleball session manager
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to access your profile and stats</p>
          </div>

          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {isLoggingIn ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGuestContinue}
            className="w-full"
            size="lg"
          >
            <UserCircle className="h-4 w-4 mr-2" />
            Continue as Guest
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Guest users can join and host games without an account
        </p>
      </div>
    </div>
  );
}
