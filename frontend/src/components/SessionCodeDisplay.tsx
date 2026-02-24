import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';

interface SessionCodeDisplayProps {
  sessionId: string;
  compact?: boolean;
}

export function SessionCodeDisplay({ sessionId, compact }: SessionCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(sessionId);
      setCopied(true);
      toast.success('Session code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    const shareText = `Join my Pickleball session! Code: ${sessionId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Pickleball Session', text: shareText });
      } catch {
        // User cancelled
      }
    } else {
      await handleCopy();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-primary tracking-widest text-sm">
          {sessionId}
        </span>
        <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7">
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-2 border-primary/30 bg-primary/5">
      <CardContent className="pt-4 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 text-center">
          Session Code
        </p>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="font-display font-black text-3xl text-primary tracking-[0.2em]">
            {sessionId.slice(0, 8)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 btn-touch border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleCopy}
          >
            {copied ? (
              <><Check className="h-4 w-4 mr-2" /> Copied!</>
            ) : (
              <><Copy className="h-4 w-4 mr-2" /> Copy Code</>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="btn-touch border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
