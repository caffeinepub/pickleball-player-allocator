import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateSession, useHostAddPlayer } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Timer,
  Hash,
  Shuffle,
  RotateCcw,
  TrendingUp,
  Crown,
} from 'lucide-react';
import { SessionType } from '../backend';
import { toast } from 'sonner';

const SESSION_TYPES = [
  {
    value: SessionType.randomAllotment,
    label: 'Random',
    icon: Shuffle,
    description: 'Random court assignments',
  },
  {
    value: SessionType.roundRobin,
    label: 'Round Robin',
    icon: RotateCcw,
    description: 'Everyone plays everyone',
  },
  {
    value: SessionType.ladderLeague,
    label: 'Ladder',
    icon: TrendingUp,
    description: 'Winners face winners',
  },
  {
    value: SessionType.kingQueenOfTheCourt,
    label: 'King/Queen',
    icon: Crown,
    description: 'Winners advance courts',
  },
];

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function CreateSession() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const createSession = useCreateSession();
  const hostAddPlayer = useHostAddPlayer();

  const [formData, setFormData] = useState({
    courts: '2',
    venue: '',
    date: '',
    time: '',
    duration: '60',
    sessionCode: generateSessionCode(),
    sessionType: SessionType.randomAllotment as SessionType,
    isRanked: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const courts = parseInt(formData.courts, 10);
    if (isNaN(courts) || courts < 1) {
      toast.error('Please enter a valid number of courts');
      return;
    }

    try {
      const result = await createSession.mutateAsync({
        courts: BigInt(courts),
        date: formData.date || null,
        time: formData.time || null,
        venue: formData.venue || null,
        duration: formData.duration ? BigInt(parseInt(formData.duration, 10)) : null,
        sessionCode: formData.sessionCode,
        sessionType: formData.sessionType,
        isRanked: formData.isRanked,
      });

      const sessionId = result.sessionId;

      // If authenticated, the backend already adds the host as the first player
      // (createSession initializes players: [caller])
      // No need to call hostAddPlayer again for the host

      toast.success('Session created!');
      navigate({ to: '/host/$sessionId', params: { sessionId } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      toast.error(message);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Host a Game</h1>
        <p className="text-muted-foreground text-sm mt-1">Set up your pickleball session</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="venue" className="flex items-center gap-1.5 text-sm">
              <MapPin className="h-3.5 w-3.5" /> Venue
            </Label>
            <Input
              id="venue"
              placeholder="e.g. Central Park Courts"
              value={formData.venue}
              onChange={(e) => setFormData((f) => ({ ...f, venue: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5" /> Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time" className="flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5" /> Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData((f) => ({ ...f, time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="courts" className="flex items-center gap-1.5 text-sm">
                <Hash className="h-3.5 w-3.5" /> Courts
              </Label>
              <Input
                id="courts"
                type="number"
                min="1"
                max="20"
                value={formData.courts}
                onChange={(e) => setFormData((f) => ({ ...f, courts: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration" className="flex items-center gap-1.5 text-sm">
                <Timer className="h-3.5 w-3.5" /> Duration (min)
              </Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData((f) => ({ ...f, duration: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Session Code</Label>
            <div className="flex gap-2">
              <Input
                value={formData.sessionCode}
                onChange={(e) => setFormData((f) => ({ ...f, sessionCode: e.target.value.toUpperCase() }))}
                className="font-mono tracking-widest"
                maxLength={8}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData((f) => ({ ...f, sessionCode: generateSessionCode() }))}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Session Type */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Game Format</Label>
          <div className="grid grid-cols-2 gap-2">
            {SESSION_TYPES.map(({ value, label, icon: Icon, description }) => (
              <Card
                key={value}
                className={`cursor-pointer transition-all ${
                  formData.sessionType === value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40'
                }`}
                onClick={() => setFormData((f) => ({ ...f, sessionType: value }))}
              >
                <CardContent className="p-3 flex items-start gap-2">
                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    formData.sessionType === value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      formData.sessionType === value ? 'text-primary' : 'text-foreground'
                    }`}>{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ranked Toggle */}
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
          <div>
            <p className="font-medium text-sm text-foreground">Ranked Session</p>
            <p className="text-xs text-muted-foreground">Updates player ratings after scores</p>
          </div>
          <Switch
            checked={formData.isRanked}
            onCheckedChange={(checked) => setFormData((f) => ({ ...f, isRanked: checked }))}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={createSession.isPending}
        >
          {createSession.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Session'
          )}
        </Button>
      </form>
    </div>
  );
}
