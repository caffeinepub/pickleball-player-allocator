import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameOutcome } from "../backend";
import { Trophy, Loader2 } from "lucide-react";

export type MatchFormat = "casual" | "standard" | "tournament" | "finals";

interface MatchResultSubmissionProps {
  court: number | bigint;
  teamA: string[];
  teamB: string[];
  onSubmit: (outcome: GameOutcome, format: MatchFormat) => void;
  isLoading?: boolean;
  onSkip?: () => void;
}

const FORMAT_OPTIONS: { value: MatchFormat; label: string; multiplier: string }[] = [
  { value: "casual", label: "Casual", multiplier: "0.6×" },
  { value: "standard", label: "Standard", multiplier: "1.0×" },
  { value: "tournament", label: "Tournament", multiplier: "1.2×" },
  { value: "finals", label: "Finals", multiplier: "1.4×" },
];

export function MatchResultSubmission({
  court,
  teamA,
  teamB,
  onSubmit,
  isLoading = false,
  onSkip,
}: MatchResultSubmissionProps) {
  const [selectedFormat, setSelectedFormat] = useState<MatchFormat>("standard");

  const handleSubmit = (outcome: GameOutcome) => {
    onSubmit(outcome, selectedFormat);
  };

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4 text-primary" />
          Court {court.toString()} Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Format Selector */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Match Format
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {FORMAT_OPTIONS.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setSelectedFormat(fmt.value)}
                disabled={isLoading}
                className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                  selectedFormat === fmt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span>{fmt.label}</span>
                <span className="text-[10px] opacity-70 mt-0.5">
                  {fmt.multiplier}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Team A
            </p>
            <div className="space-y-1">
              {teamA.map((player, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-primary">
                      {player.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-foreground truncate">
                    {player}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Team B
            </p>
            <div className="space-y-1">
              {teamB.map((player, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-secondary/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-secondary-foreground">
                      {player.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-foreground truncate">
                    {player}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Win Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleSubmit(GameOutcome.teamAWin)}
            disabled={isLoading}
            className="w-full text-sm"
            variant="default"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : null}
            Team A Wins
          </Button>
          <Button
            onClick={() => handleSubmit(GameOutcome.teamBWin)}
            disabled={isLoading}
            variant="outline"
            className="w-full text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : null}
            Team B Wins
          </Button>
        </div>

        {onSkip && (
          <Button
            onClick={onSkip}
            disabled={isLoading}
            variant="ghost"
            className="w-full text-xs text-muted-foreground"
          >
            Skip this court
          </Button>
        )}

        {selectedFormat !== "standard" && (
          <p className="text-[11px] text-muted-foreground text-center">
            <Badge variant="outline" className="text-[10px] mr-1">
              {FORMAT_OPTIONS.find((f) => f.value === selectedFormat)?.label}
            </Badge>
            format applies a{" "}
            {FORMAT_OPTIONS.find((f) => f.value === selectedFormat)?.multiplier}{" "}
            rating multiplier
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default MatchResultSubmission;
