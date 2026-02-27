import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, History, User, Home, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}

function AppHeader() {
  const navigate = useNavigate();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    sessionStorage.removeItem('authChoice');
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2"
        >
          <span className="text-xl font-bold text-primary tracking-tight font-display">
            The Ball Club
          </span>
        </button>

        <div className="flex items-center gap-1">
          {isAuthenticated && (
            <>
              <button
                onClick={() => navigate({ to: '/messages' })}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Messages"
              >
                <MessageSquare size={18} />
              </button>
              <button
                onClick={() => navigate({ to: '/history' })}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Game History"
              >
                <History size={18} />
              </button>
              <button
                onClick={() => navigate({ to: '/profile' })}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Profile"
              >
                <User size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
          {!isAuthenticated && (
            <button
              onClick={() => navigate({ to: '/' })}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Home"
            >
              <Home size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function AppFooter() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'the-ball-club');

  return (
    <footer className="border-t border-border bg-background/80 py-4 px-4 text-center">
      <p className="text-xs text-muted-foreground">
        © {year} The Ball Club.{' '}
        Built with{' '}
        <span className="text-red-500">♥</span>{' '}
        using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </footer>
  );
}
