import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Trophy, MapPin } from 'lucide-react';

interface GameScheduleInfoProps {
  courts: number;
  totalMinutes: number;
  gameDurationMinutes: number;
}

export default function GameScheduleInfo({
  courts,
  totalMinutes,
  gameDurationMinutes,
}: GameScheduleInfoProps) {
  const gamesPerCourt = Math.floor(totalMinutes / gameDurationMinutes);
  const totalGames = gamesPerCourt * courts;

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-lg font-bold font-display">{totalMinutes}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <p className="text-lg font-bold font-display">{courts}</p>
            <p className="text-xs text-muted-foreground">Court{courts !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <p className="text-lg font-bold font-display">{totalGames}</p>
            <p className="text-xs text-muted-foreground">Total Games</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
