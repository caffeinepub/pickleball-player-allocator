import React from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetPublicProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Briefcase, FileText, Trophy, TrendingUp } from 'lucide-react';
import LoadingGame from '../components/LoadingGame';

export default function PublicProfile() {
  const { principal } = useParams({ from: '/player/$principal' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const { data: profile, isLoading, error } = useGetPublicProfile(principal);

  const isOwnProfile = identity?.getPrincipal().toString() === principal;
  const isAuthenticated = !!identity;

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <LoadingGame message="Loading player profile..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Player profile not found.</p>
        </div>
      </div>
    );
  }

  const wins = profile.winLossRecord ? Number(profile.winLossRecord[0]) : 0;
  const losses = profile.winLossRecord ? Number(profile.winLossRecord[1]) : 0;
  const total = wins + losses;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : null;

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
      {/* Back */}
      <button
        onClick={() => navigate({ to: -1 as never })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
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
          {profile.workField && (
            <p className="text-sm text-muted-foreground mt-0.5">{profile.workField}</p>
          )}
        </div>

        {/* Message button — only for authenticated non-self viewers */}
        {isAuthenticated && !isOwnProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/messages/$principal', params: { principal } })}
            className="mt-1"
          >
            <MessageSquare size={14} className="mr-1.5" />
            Message
          </Button>
        )}
      </div>

      {/* Stats */}
      {total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy size={16} className="text-primary" />
              Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{wins}</p>
                <p className="text-xs text-muted-foreground">Wins</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{losses}</p>
                <p className="text-xs text-muted-foreground">Losses</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{winRate ?? '—'}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bio */}
      {profile.bio && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Work field */}
      {profile.workField && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase size={16} className="text-primary" />
              Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80">{profile.workField}</p>
          </CardContent>
        </Card>
      )}

      {/* Win rate badge */}
      {winRate && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
            <TrendingUp size={12} />
            {winRate}% win rate across {total} games
          </Badge>
        </div>
      )}
    </div>
  );
}
