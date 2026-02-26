import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, LogIn, User, ChevronRight, Zap } from 'lucide-react';
import { getPlayerProfile, getCurrentSession } from '@/lib/storage';

export function Home() {
  const navigate = useNavigate();
  const profile = getPlayerProfile();
  const currentSession = getCurrentSession();

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/generated/court-bg.dim_800x600.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative px-6 pt-12 pb-10 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/generated/app-logo.dim_256x256.png"
              alt="Pickleball"
              className="h-20 w-20 rounded-2xl shadow-lg object-cover"
            />
          </div>
          <h1 className="font-display font-black text-3xl text-primary-foreground mb-2">
            Pickleball Allocator
          </h1>
          <p className="text-primary-foreground/80 text-sm">
            Smart player allocation for your pickleball games
          </p>
          {profile && (
            <div className="mt-4 inline-flex items-center gap-2 bg-primary-foreground/20 rounded-full px-4 py-1.5">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-xs font-bold text-accent-foreground">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-primary-foreground font-medium">{profile.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex-1 px-4 py-6 space-y-4">
        {/* Resume Session */}
        {currentSession && (
          <Card className="border-2 border-primary/30 bg-primary/5 animate-fade-in">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Active Game</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Code: {currentSession.sessionCode || currentSession.sessionId.slice(0, 8)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 bg-primary text-primary-foreground"
                  onClick={() => {
                    const isHost = currentSession.role === 'host' || currentSession.isHost === true;
                    const dest = isHost
                      ? `/session/${currentSession.sessionId}/host`
                      : `/session/${currentSession.sessionId}/player`;
                    navigate({ to: dest });
                  }}
                >
                  Resume
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Setup / View */}
        {!profile ? (
          <Card
            className="border border-border shadow-card card-hover cursor-pointer"
            onClick={() => navigate({ to: '/profile/setup' })}
          >
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-foreground">Create Profile</p>
                  <p className="text-sm text-muted-foreground">Set your name and mobile number</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            className="border border-border shadow-card card-hover cursor-pointer"
            onClick={() => navigate({ to: '/profile/view' })}
          >
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shrink-0 overflow-hidden">
                  {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-primary-foreground text-lg">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-foreground">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">View Profile</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Host a Game */}
        <Button
          className="w-full btn-touch gradient-primary text-primary-foreground font-display font-bold text-base shadow-card"
          onClick={() => navigate({ to: '/session/create' })}
        >
          <Plus className="h-5 w-5 mr-2" />
          Host a Game
        </Button>

        {/* Join Game */}
        <Button
          variant="outline"
          className="w-full btn-touch border-2 border-primary/30 text-primary font-display font-bold text-base"
          onClick={() => navigate({ to: '/session/join' })}
        >
          <LogIn className="h-5 w-5 mr-2" />
          Join a Game
        </Button>
      </div>

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
