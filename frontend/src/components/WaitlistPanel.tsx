import React from 'react';
import { Clock, Users } from 'lucide-react';

interface WaitlistPlayer {
  id: string;
  name: string;
}

interface WaitlistPanelProps {
  waitlist: WaitlistPlayer[];
  currentPlayerId: string | null;
}

export default function WaitlistPanel({ waitlist, currentPlayerId }: WaitlistPanelProps) {
  if (waitlist.length === 0) {
    return (
      <div className="bg-muted/30 border border-dashed border-border rounded-xl p-4 text-center">
        <Users className="w-6 h-6 mx-auto mb-1 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No players waiting</p>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-amber-600" />
        <span className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
          Waitlist ({waitlist.length})
        </span>
      </div>
      <div className="space-y-2">
        {waitlist.map((player, idx) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                isCurrentPlayer
                  ? 'bg-amber-500/20 border border-amber-500/40'
                  : 'bg-background/60'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-400 flex-shrink-0">
                {idx + 1}
              </span>
              <span className={`font-medium ${isCurrentPlayer ? 'text-amber-700 dark:text-amber-300' : 'text-foreground'}`}>
                {player.name}
              </span>
              {isCurrentPlayer && (
                <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 font-medium">You</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
