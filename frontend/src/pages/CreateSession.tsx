import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { SessionCodeDisplay } from '../components/SessionCodeDisplay';
import SessionConfigForm from '../components/SessionConfigForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, CheckCircle, MapPin } from 'lucide-react';
import { useCreateSession } from '../hooks/useQueries';
import { setCurrentSession } from '../lib/storage';
import { formatErrorMessage } from '../lib/errorHandling';
import { useActor } from '../hooks/useActor';

export default function CreateSession() {
  const navigate = useNavigate();
  const { isFetching: actorFetching } = useActor();
  const createSessionMutation = useCreateSession();
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [courts, setCourts] = useState(2);

  const handleCreate = async (selectedCourts: number) => {
    setCourts(selectedCourts);
    try {
      const result = await createSessionMutation.mutateAsync(selectedCourts);
      const sessionId = result.sessionId;
      if (!sessionId) {
        throw new Error('No session ID returned from backend');
      }
      setCurrentSession({
        sessionId,
        isHost: true,
        hostPrincipal: result.config.host.toString(),
        courts: Number(result.config.courts),
      });
      setCreatedSessionId(sessionId);
      toast.success('Session created!');
    } catch (err: unknown) {
      const message = formatErrorMessage(err);
      toast.error(message);
    }
  };

  if (createdSessionId) {
    return (
      <Layout title="Session Created!" showBack backTo="/">
        <div className="space-y-4 animate-slide-up">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">Share this code with players to join</p>
          </div>

          <SessionCodeDisplay sessionId={createdSessionId} />

          <Card className="border border-border">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Courts
                </p>
                <p className="font-semibold text-foreground">{courts}</p>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <p className="text-muted-foreground">Allocation</p>
                <p className="font-semibold text-foreground">Random</p>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full btn-touch gradient-primary text-primary-foreground font-display font-bold text-base shadow-card"
            onClick={() =>
              navigate({ to: '/session/$sessionId/host', params: { sessionId: createdSessionId } })
            }
          >
            Open Host Dashboard
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Host a Session" showBack backTo="/">
      <div className="space-y-5 animate-slide-up">
        <div className="pt-1">
          <p className="text-sm text-muted-foreground">
            Configure your pickleball session. Players will be randomly allocated to courts.
          </p>
        </div>

        <SessionConfigForm
          onSubmit={handleCreate}
          isLoading={createSessionMutation.isPending || actorFetching}
        />
      </div>
    </Layout>
  );
}
