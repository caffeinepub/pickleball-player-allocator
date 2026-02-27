import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Users, Zap, Trophy, History, User } from 'lucide-react';

export default function Home() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const isAuthenticated = !!identity;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Rally</h1>
          <p className="text-muted-foreground mt-1">
            Organize your pickleball sessions with ease
          </p>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:border-primary/60 hover:shadow-md transition-all group"
          onClick={() => navigate({ to: '/create-session' })}
        >
          <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <PlusCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Host Game</p>
              <p className="text-xs text-muted-foreground mt-0.5">Create a new session</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/60 hover:shadow-md transition-all group"
          onClick={() => navigate({ to: '/join' })}
        >
          <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center group-hover:bg-secondary/50 transition-colors">
              <Users className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Join Game</p>
              <p className="text-xs text-muted-foreground mt-0.5">Enter a session code</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links for authenticated users */}
      {isAuthenticated && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Quick Access
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate({ to: '/history' })}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-muted/40 transition-all"
            >
              <History className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">History</span>
            </button>
            <button
              onClick={() => navigate({ to: '/messages' })}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-muted/40 transition-all"
            >
              <Trophy className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Messages</span>
            </button>
            <button
              onClick={() => navigate({ to: '/profile' })}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-muted/40 transition-all"
            >
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Guest prompt */}
      {!isAuthenticated && (
        <div className="bg-muted/40 border border-border/60 rounded-xl p-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Sign in to track your stats, rankings, and match history
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/login' })}
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
}
