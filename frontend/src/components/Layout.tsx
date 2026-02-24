import React from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

const AUTH_CHOICE_KEY = 'pickleball_auth_choice';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backTo?: string;
  headerRight?: React.ReactNode;
  noPadding?: boolean;
}

export function Layout({ children, title, showBack, backTo, headerRight, noPadding }: LayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backTo) {
      router.navigate({ to: backTo });
    } else {
      router.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
          <div className="flex items-center gap-3 px-4 py-3">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0 -ml-2 btn-touch"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="font-display font-bold text-lg text-foreground flex-1 truncate">
              {title}
            </h1>
            {headerRight && <div className="shrink-0">{headerRight}</div>}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${noPadding ? '' : 'px-4 py-4'}`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center border-t border-border">
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

export function AppHeader() {
  const router = useRouter();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    // Clear auth choice so user is sent back to login
    sessionStorage.removeItem(AUTH_CHOICE_KEY);
    if (identity) {
      await clear();
    }
    queryClient.clear();
    router.navigate({ to: '/login' });
  };

  return (
    <header className="sticky top-0 z-40 gradient-primary shadow-md">
      <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
        <img
          src="/assets/generated/app-logo.dim_256x256.png"
          alt="Pickleball"
          className="h-8 w-8 rounded-lg object-cover"
        />
        <span className="font-display font-bold text-lg text-primary-foreground flex-1">
          PickleBall Allocator
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-primary-foreground hover:bg-primary-foreground/20 shrink-0"
          title="Sign out / Switch account"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
