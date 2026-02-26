import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SessionCodeDisplayProps {
  sessionId: string;
  sessionCode?: string;
}

export default function SessionCodeDisplay({ sessionId, sessionCode }: SessionCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Use the explicit sessionCode if provided, otherwise fall back to sessionId
  const displayCode = sessionCode || sessionId;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const el = document.createElement('textarea');
      el.value = displayCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Pickleball Game',
          text: `Join my game! Use code: ${displayCode}`,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-4 pb-4">
        <div className="text-center space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Game Code
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-black font-mono tracking-[0.2em] text-primary">
              {displayCode}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this code with players to join your game
          </p>
          <div className="flex gap-2 justify-center pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy Code
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-8 text-xs gap-1.5"
            >
              <Share2 className="h-3 w-3" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
