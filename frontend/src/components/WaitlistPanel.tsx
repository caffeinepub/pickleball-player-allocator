import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Ghost } from 'lucide-react';

interface WaitlistPlayer {
  id: string;
  name: string;
  isGuest?: boolean;
}

interface WaitlistPanelProps {
  waitlist: WaitlistPlayer[];
  currentPlayerId?: string;
}

export default function WaitlistPanel({ waitlist, currentPlayerId }: WaitlistPanelProps) {
  if (waitlist.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No players on the waitlist</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Waitlist ({waitlist.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1.5">
        {waitlist.map((player, index) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const isGuest = player.isGuest || player.id.startsWith('guest-');
          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
                isCurrentPlayer
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-muted/40 hover:bg-muted/60'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isCurrentPlayer ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                }`}
              >
                {index + 1}
              </span>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {isGuest && <Ghost className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                <span className={`text-sm font-medium truncate ${isCurrentPlayer ? 'text-primary' : ''}`}>
                  {player.name}
                </span>
                {isCurrentPlayer && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">(you)</span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isGuest && (
                  <Badge
                    variant="outline"
                    className="text-xs border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 py-0 px-1.5"
                  >
                    Guest
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
