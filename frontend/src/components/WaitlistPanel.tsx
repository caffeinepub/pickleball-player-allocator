import React from 'react';
import { Ghost, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WaitlistPanelProps {
  waitlist: string[];
  playerNames?: Record<string, string>;
  playerUsernames?: Record<string, string>;
  guestPlayerIds?: string[];
}

export default function WaitlistPanel({
  waitlist,
  playerNames = {},
  playerUsernames = {},
  guestPlayerIds = [],
}: WaitlistPanelProps) {
  if (waitlist.length === 0) return null;

  const isGuest = (id: string) => guestPlayerIds.includes(id) || id.startsWith('guest-');
  const getDisplayName = (id: string) => playerNames[id] || id.slice(0, 8) + '...';
  const getUsername = (id: string) => playerUsernames[id];

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm text-foreground">Waiting Next Round</h3>
        <Badge variant="secondary" className="text-xs ml-auto">
          {waitlist.length}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {waitlist.map((id) => {
          const guest = isGuest(id);
          const username = getUsername(id);
          return (
            <div
              key={id}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm ${
                guest
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-muted/60 border border-border/60'
              }`}
            >
              {guest && <Ghost className="h-3 w-3 text-amber-500 shrink-0" />}
              <div className="min-w-0">
                <span
                  className={`font-medium block ${
                    guest ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
                  }`}
                >
                  {getDisplayName(id)}
                </span>
                {username && !guest && (
                  <span className="text-xs text-muted-foreground block">@{username}</span>
                )}
                {guest && (
                  <span className="text-xs text-amber-600 dark:text-amber-500">Guest</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
