import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { getCurrentSession } from '../lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Users,
  ChevronRight,
  Zap,
  MessageSquare,
  History,
  User,
} from 'lucide-react';
import { getAuthChoice } from './Login';

export default function Home() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const authChoice = getAuthChoice();
  const isGuest = authChoice === 'guest' || !identity;

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const currentSession = getCurrentSession();

  // Redirect to login if no auth choice
  React.useEffect(() => {
    if (!authChoice && !identity) {
      navigate({ to: '/login' });
    }
  }, [authChoice, identity, navigate]);

  // Redirect to profile setup if authenticated but no profile
  React.useEffect(() => {
    if (!isGuest && !profileLoading && isFetched && userProfile === null) {
      navigate({ to: '/profile-setup' });
    }
  }, [isGuest, profileLoading, isFetched, userProfile, navigate]);

  const displayName = userProfile?.name || 'Player';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Hey, {displayName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Ready to play some pickleball?
          </p>
        </div>
        {isGuest && (
          <Badge variant="secondary" className="text-xs shrink-0">Guest</Badge>
        )}
      </div>

      {/* Active session chip */}
      {currentSession && (
        <Card
          className="bg-primary/10 border-primary/30 cursor-pointer hover:bg-primary/15 transition-colors"
          onClick={() => {
            const isHost = currentSession.role === 'host' || (currentSession as any).isHost;
            if (isHost) {
              navigate({ to: '/host/$sessionId', params: { sessionId: currentSession.sessionId } });
            } else {
              navigate({ to: '/session/$sessionId', params: { sessionId: currentSession.sessionId } });
            }
          }}
        >
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Active Game</p>
                  <p className="text-xs text-muted-foreground">
                    Code: {currentSession.sessionCode || currentSession.sessionId}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate({ to: '/create' })}
        >
          <CardContent className="py-5 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Plus size={20} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Host a Game</p>
            <p className="text-xs text-muted-foreground text-center">Create a new session</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate({ to: '/join' })}
        >
          <CardContent className="py-5 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center">
              <Users size={20} className="text-secondary-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Join a Game</p>
            <p className="text-xs text-muted-foreground text-center">Enter a session code</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="flex flex-col gap-2">
        {!isGuest && (
          <>
            <button
              onClick={() => navigate({ to: '/messages' })}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="text-primary" />
                <span className="text-sm font-medium text-foreground">Messages</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate({ to: '/history' })}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <History size={18} className="text-primary" />
                <span className="text-sm font-medium text-foreground">Game History</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </>
        )}

        <button
          onClick={() => navigate({ to: '/profile' })}
          className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <User size={18} className="text-primary" />
            <span className="text-sm font-medium text-foreground">My Profile</span>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
