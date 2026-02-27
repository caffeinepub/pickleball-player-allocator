import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { LogIn, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function setAuthChoice(choice: 'ii' | 'guest') {
  sessionStorage.setItem('authChoice', choice);
}

export function getAuthChoice(): 'ii' | 'guest' | null {
  const val = sessionStorage.getItem('authChoice');
  if (val === 'ii' || val === 'guest') return val;
  return null;
}

export function clearAuthChoice() {
  sessionStorage.removeItem('authChoice');
}

export default function Login() {
  const navigate = useNavigate();
  const { login, loginStatus } = useInternetIdentity();
  const [guestLoading, setGuestLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setAuthChoice('ii');
      await login();
      navigate({ to: '/' });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGuest = () => {
    setGuestLoading(true);
    setAuthChoice('guest');
    setTimeout(() => {
      setGuestLoading(false);
      navigate({ to: '/profile-setup' });
    }, 300);
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background court pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url('/assets/generated/court-bg.dim_800x600.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* App name */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary font-display tracking-tight">
            The Ball Club
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Organize & play pickleball with your crew
          </p>
        </div>

        {/* Auth options */}
        <div className="w-full flex flex-col gap-3">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full h-12 text-base font-semibold"
              >
                <LogIn size={18} className="mr-2" />
                {isLoggingIn ? 'Connecting...' : 'Sign In'}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Secure login with Internet Identity
              </p>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <Button
                variant="outline"
                onClick={handleGuest}
                disabled={guestLoading}
                className="w-full h-12 text-base font-semibold"
              >
                <UserCircle size={18} className="mr-2" />
                {guestLoading ? 'Loading...' : 'Continue as Guest'}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                No account needed — join a game instantly
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
