import React from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetPublicProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Briefcase, FileText, MessageSquare, Trophy, Loader2 } from 'lucide-react';

export default function PublicProfile() {
  const { principalId } = useParams({ from: '/player/$principalId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const { data: profile, isLoading } = useGetPublicProfile(principalId ?? null);

  const isOwnProfile = identity?.getPrincipal().toString() === principalId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <User className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Player not found</p>
        <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
      </div>
    );
  }

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const wins = profile.winLossRecord ? Number(profile.winLossRecord[0]) : 0;
  const losses = profile.winLossRecord ? Number(profile.winLossRecord[1]) : 0;
  const winRate = profile.winRate != null ? profile.winRate.toFixed(1) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Back */}
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Avatar & name */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {initials}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground font-display">{profile.name}</h1>
          </div>
        </div>

        {/* Stats */}
        {profile.winLossRecord && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{wins}</p>
                  <p className="text-xs text-muted-foreground">Wins</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{losses}</p>
                  <p className="text-xs text-muted-foreground">Losses</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {winRate != null ? `${winRate}%` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.workField && (
              <div className="flex items-center gap-3">
                <Briefcase size={16} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Work / Field</p>
                  <p className="text-sm font-medium">{profile.workField}</p>
                </div>
              </div>
            )}
            {profile.bio && (
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Bio</p>
                  <p className="text-sm font-medium">{profile.bio}</p>
                </div>
              </div>
            )}
            {!profile.workField && !profile.bio && (
              <p className="text-sm text-muted-foreground text-center py-2">No details available</p>
            )}
          </CardContent>
        </Card>

        {/* Message button — only for authenticated non-self viewers */}
        {identity && !isOwnProfile && (
          <Button
            className="w-full"
            onClick={() =>
              navigate({ to: '/messages/$principalId', params: { principalId } })
            }
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        )}
      </div>
    </div>
  );
}
