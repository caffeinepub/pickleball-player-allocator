import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Star } from 'lucide-react';
import { formatDuprRating } from '@/lib/utils';

interface PlayerStatsCardProps {
  name: string;
  duprRating?: number | null;
  wins?: number;
  losses?: number;
}

export function PlayerStatsCard({ name, duprRating, wins = 0, losses = 0 }: PlayerStatsCardProps) {
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return (
    <Card className="border border-border shadow-card">
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-primary-foreground text-sm">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground truncate">{name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="h-3 w-3 text-yellow-500" />
              <Badge variant="secondary" className="text-xs">
                {formatDuprRating(duprRating)}
              </Badge>
            </div>
          </div>
        </div>

        {totalGames > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
            <div className="text-center">
              <p className="font-display font-bold text-lg text-primary">{wins}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg text-destructive">{losses}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg text-foreground">{winRate}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
        )}

        {totalGames === 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No matches recorded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PlayerStatsCard;
