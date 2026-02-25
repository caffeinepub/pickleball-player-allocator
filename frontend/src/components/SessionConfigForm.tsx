import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Minus, Plus, Loader2 } from 'lucide-react';

interface SessionConfigFormProps {
  onSubmit: (courts: number) => void | Promise<void>;
  isLoading?: boolean;
}

export default function SessionConfigForm({ onSubmit, isLoading = false }: SessionConfigFormProps) {
  const [courts, setCourts] = useState(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    await onSubmit(courts);
  };

  const decrementCourts = () => {
    setCourts((prev) => Math.max(1, prev - 1));
  };

  const incrementCourts = () => {
    setCourts((prev) => Math.min(10, prev + 1));
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-display">Session Configuration</CardTitle>
        <CardDescription>Choose how many courts you have available</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Courts Stepper */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Number of Courts
            </label>
            <div className="flex items-center justify-center gap-6">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementCourts}
                disabled={courts <= 1 || isLoading}
                className="h-12 w-12 rounded-full"
                aria-label="Decrease courts"
              >
                <Minus className="h-5 w-5" />
              </Button>

              <div className="flex flex-col items-center">
                <span className="text-5xl font-bold font-display text-primary leading-none">
                  {courts}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {courts === 1 ? 'court' : 'courts'}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementCourts}
                disabled={courts >= 10 || isLoading}
                className="h-12 w-12 rounded-full"
                aria-label="Increase courts"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Each court supports 4 players (2 vs 2)
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Session…
              </>
            ) : (
              'Create Session'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
