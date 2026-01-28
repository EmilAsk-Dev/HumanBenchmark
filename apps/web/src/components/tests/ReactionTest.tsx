import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TestRun, TEST_CONFIGS } from "@/types";
import { Button } from "@/components/ui/button";
import { sounds, initAudio } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface ReactionTestProps {
  onComplete: (score: number) => Promise<TestRun | null>;
}

type GameState =
  | "instructions"
  | "waiting"
  | "ready"
  | "clicked"
  | "tooEarly"
  | "results";

export function ReactionTest({ onComplete }: ReactionTestProps) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>("instructions");
  const [rounds, setRounds] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [result, setResult] = useState<TestRun | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const totalRounds = 5;
  const config = TEST_CONFIGS.reaction;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearGameTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startRound = useCallback(() => {
    clearGameTimeout();
    setGameState("waiting");

    const delay = 1500 + Math.random() * 3000; // 1.5-4.5 seconds
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setStartTime(Date.now());
        setGameState("ready");
        sounds.go();
      }
    }, delay);
  }, [clearGameTimeout]);

  const handleClick = useCallback(async () => {
    if (isProcessing) return;

    if (gameState === "instructions") {
      initAudio();
      sounds.click();
      startRound();
      return;
    }

    if (gameState === "waiting") {
      clearGameTimeout();
      setGameState("tooEarly");
      sounds.error();
      return;
    }

    if (gameState === "ready") {
      setIsProcessing(true);
      const reactionTime = Date.now() - startTime;
      sounds.success();
      const newRounds = [...rounds, reactionTime];
      setRounds(newRounds);
      const newRoundNum = currentRound + 1;
      setCurrentRound(newRoundNum);

      if (newRounds.length >= totalRounds) {
        setGameState("clicked");
        const average = Math.round(
          newRounds.reduce((a, b) => a + b, 0) / newRounds.length,
        );
        try {
          const testResult = await onComplete(average);
          if (isMountedRef.current && testResult) {
            setResult(testResult);
            sounds.newRecord();
            setGameState("results");
          } else if (isMountedRef.current) {
            // Fallback result if API fails
            setResult({
              id: "local",
              testType: "reaction",
              score: average,
              percentile: 50,
              createdAt: new Date(),
              userId: "local",
            });
            setGameState("results");
          }
        } catch (e) {
          console.error("Error completing test:", e);
          if (isMountedRef.current) {
            setResult({
              id: "local",
              testType: "reaction",
              score: average,
              percentile: 50,
              createdAt: new Date(),
              userId: "local",
            });
            setGameState("results");
          }
        }
      } else {
        setGameState("clicked");
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsProcessing(false);
            startRound();
          }
        }, 1000);
        return;
      }
      setIsProcessing(false);
      return;
    }

    if (gameState === "tooEarly") {
      sounds.click();
      startRound();
      return;
    }
  }, [
    gameState,
    startTime,
    rounds,
    currentRound,
    onComplete,
    startRound,
    clearGameTimeout,
    isProcessing,
  ]);

  const handleBack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearGameTimeout();
      navigate("/tests");
    },
    [clearGameTimeout, navigate],
  );

  const resetGame = useCallback(() => {
    clearGameTimeout();
    setRounds([]);
    setCurrentRound(0);
    setResult(null);
    setIsProcessing(false);
    setGameState("instructions");
  }, [clearGameTimeout]);

  const getBackgroundColor = () => {
    switch (gameState) {
      case "waiting":
        return "bg-destructive";
      case "ready":
        return "bg-success";
      case "tooEarly":
        return "bg-warning";
      case "clicked":
        return "bg-primary";
      default:
        return "bg-background";
    }
  };

  if (gameState === "results" && result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-scale-in bg-background">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Your Reaction Time
          </h2>
          <div className="text-6xl font-bold text-gradient-primary mb-2">
            {result.score} <span className="text-3xl">ms</span>
          </div>
          <div
            className={cn(
              "text-xl font-semibold",
              result.percentile >= 90 ? "text-yellow-500" : "text-primary",
            )}
          >
            Top {100 - result.percentile}%
          </div>
        </div>

        <div className="w-full max-w-sm space-y-2 mb-8">
          {rounds.map((time, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
            >
              <span className="text-muted-foreground">Round {i + 1}</span>
              <span className="font-mono font-bold text-foreground">
                {time}ms
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/tests")}
          >
            Back
          </Button>
          <Button
            className="flex-1 gradient-primary text-primary-foreground"
            onClick={resetGame}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-screen p-6 cursor-pointer transition-colors duration-200 select-none",
        getBackgroundColor(),
      )}
      onClick={handleClick}
    >
      {gameState === "instructions" && (
        <div className="text-center animate-slide-up">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="text-6xl mb-6">⚡</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {config.name}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            When the red box turns{" "}
            <span className="text-success font-semibold">green</span>, click as
            quickly as you can! {totalRounds} rounds total.
          </p>
          <div className="text-lg font-semibold text-foreground animate-pulse">
            Tap anywhere to start
          </div>
        </div>
      )}

      {gameState === "waiting" && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 text-destructive-foreground hover:bg-destructive-foreground/10"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-3xl font-bold text-destructive-foreground mb-2">
            Wait for green...
          </h2>
          <p className="text-destructive-foreground/80">
            Round {currentRound + 1} of {totalRounds}
          </p>
        </div>
      )}

      {gameState === "ready" && (
        <div className="text-center">
          <h2 className="text-4xl font-bold text-success-foreground animate-pulse">
            Click now!
          </h2>
        </div>
      )}

      {gameState === "clicked" && rounds.length > 0 && (
        <div className="text-center">
          <div className="text-4xl font-bold text-primary-foreground mb-2">
            {rounds[rounds.length - 1]}ms
          </div>
          <p className="text-primary-foreground/80">
            {rounds.length < totalRounds
              ? "Getting next round ready..."
              : "Calculating results..."}
          </p>
        </div>
      )}

      {gameState === "tooEarly" && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 text-warning-foreground hover:bg-warning-foreground/10"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-3xl font-bold text-warning-foreground mb-2">
            Too early! 🙈
          </h2>
          <p className="text-warning-foreground/80">Tap to try again</p>
        </div>
      )}
    </div>
  );
}
