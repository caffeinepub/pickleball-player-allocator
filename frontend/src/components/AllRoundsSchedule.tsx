import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Ghost, Clock } from 'lucide-react';
import { Round } from '../lib/scheduler';

interface AllRoundsScheduleProps {
  rounds: Round[];
  playerNames?: Record<string, string>;
  guestPlayerIds?: string[];
  currentRound?: number;
}

export default function AllRoundsSchedule({
  rounds,
  playerNames = {},
  guestPlayerIds = [],
  currentRound = 0,
}: AllRoundsScheduleProps) {
  if (rounds.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No schedule generated yet. Add players to see the schedule.
      </div>
    );
  }

  const getName = (id: string) => playerNames[id] || id.slice(0, 8) + '...';
  const isGuest = (id: string) => guestPlayerIds.includes(id) || id.startsWith('guest-');

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={`round-${currentRound}`}
      className="space-y-2"
    >
      {rounds.map((round, idx) => (
        <AccordionItem
          key={round.round}
          value={`round-${idx}`}
          className={`border rounded-xl overflow-hidden ${
            idx === currentRound
              ? 'border-primary/60 bg-primary/5'
              : 'border-border bg-card'
          }`}
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm">Round {round.round}</span>
              {idx === currentRound && (
                <Badge variant="default" className="text-xs">Current</Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto mr-2">
                {round.assignments.length} court{round.assignments.length !== 1 ? 's' : ''}
                {round.waitlist.length > 0 && ` · ${round.waitlist.length} waiting`}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            {round.assignments.map((assignment) => (
              <div key={assignment.court} className="bg-background rounded-lg p-3 border border-border/60">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Court {assignment.court}
                </p>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <div className="flex flex-wrap gap-1">
                    {assignment.teamA.map((id) => (
                      <span
                        key={id}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          isGuest(id)
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {isGuest(id) && <Ghost className="h-2.5 w-2.5 inline mr-0.5" />}
                        {getName(id)}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">vs</span>
                  <div className="flex flex-wrap gap-1">
                    {assignment.teamB.map((id) => (
                      <span
                        key={id}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          isGuest(id)
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'bg-secondary/30 text-secondary-foreground'
                        }`}
                      >
                        {isGuest(id) && <Ghost className="h-2.5 w-2.5 inline mr-0.5" />}
                        {getName(id)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {round.waitlist.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Waiting: {round.waitlist.map(getName).join(', ')}</span>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
