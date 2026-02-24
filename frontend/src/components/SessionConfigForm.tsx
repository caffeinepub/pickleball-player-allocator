import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, MapPin } from "lucide-react";

interface SessionConfigFormProps {
  onSubmit: (courts: number) => void;
  isLoading?: boolean;
}

export default function SessionConfigForm({ onSubmit, isLoading }: SessionConfigFormProps) {
  const [courts, setCourts] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(courts);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Number of Courts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              How many courts are available?
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => setCourts((c) => Math.max(1, c - 1))}
                disabled={courts <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-2xl font-bold w-8 text-center tabular-nums">
                {courts}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => setCourts((c) => Math.min(10, c + 1))}
                disabled={courts >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Players will be randomly allocated across {courts} court{courts !== 1 ? "s" : ""} (4 players per court).
          </p>
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Creating Session...
          </span>
        ) : (
          "Create Session"
        )}
      </Button>
    </form>
  );
}
