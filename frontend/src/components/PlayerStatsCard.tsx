import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRating } from "@/lib/utils";

interface PlayerStats {
  name: string;
  rating?: number;
  wins?: number;
  losses?: number;
  profilePicture?: string;
}

interface PlayerStatsCardProps {
  player: PlayerStats;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PlayerStatsCard({ player, className }: PlayerStatsCardProps) {
  const totalGames = (player.wins ?? 0) + (player.losses ?? 0);
  const winRate =
    totalGames > 0 ? Math.round(((player.wins ?? 0) / totalGames) * 100) : 0;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {player.profilePicture ? (
              <img
                src={player.profilePicture}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary font-bold text-sm">
                {getInitials(player.name)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {player.name}
            </p>
            {player.rating !== undefined && (
              <Badge variant="secondary" className="text-xs mt-0.5">
                Rating: {formatRating(player.rating)}
              </Badge>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">
              {player.wins ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">
              {player.losses ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Losses</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { PlayerStatsCard };
export default PlayerStatsCard;
