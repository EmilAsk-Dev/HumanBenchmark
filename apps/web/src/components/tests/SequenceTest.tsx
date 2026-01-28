import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TestRun, TEST_CONFIGS } from "@/types";
import { Button } from "@/components/ui/button";
import { sounds, initAudio } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface SequenceTestProps {
  onComplete: (score: number) => Promise<TestRun | null>;
}

type GameState =
  | "instructions"
  | "showing"
  | "input"
  | "levelComplete"
  | "results";

const colors = [
  { bg: "bg-red-500", active: "bg-red-400", glow: "shadow-red-500/50" },
  { bg: "bg-blue-500", active: "bg-blue-400", glow: "shadow-blue-500/50" },
  { bg: "bg-green-500", active: "bg-green-400", glow: "shadow-green-500/50" },
  {
    bg: "bg-yellow-500",
    active: "bg-yellow-400",
    glow: "shadow-yellow-500/50",
  },
];

export function SequenceTest({ onComplete }: SequenceTestProps) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>("instructions");
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [result, setResult] = useState<TestRun | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const showingRef = useRef(false);
  const isMountedRef = useRef(true);

  const config = TEST_CONFIGS.sequence;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      showingRef.current = false;
    };
  }, []);

  const showSequence = useCallback(async (seq: number[]) => {
    showingRef.current = true;
    setGameState("showing");
    setUserInput([]);

    await new Promise((r) => setTimeout(r, 600));

    for (let i = 0; i < seq.length; i++) {
      if (!showingRef.current || !isMountedRef.current) return;

      setActiveButton(seq[i]);
      sounds.sequenceButton(seq[i]);
      await new Promise((r) => setTimeout(r, 400));

      if (!showingRef.current || !isMountedRef.current) return;
      setActiveButton(null);
      await new Promise((r) => setTimeout(r, 200));
    }

    if (showingRef.current && isMountedRef.current) {
      setGameState("input");
    }
  }, []);

  const startGame = useCallback(() => {
    initAudio();

    // Reset all state completely
    showingRef.current = false;
    setActiveButton(null);
    setSequence([]);
    setUserInput([]);
    setLevel(1);
    setIsProcessing(false);
    setResult(null);
    setGameState("instructions");

    // Generate new sequence after state is reset
    const firstItem = Math.floor(Math.random() * 4);
    const newSequence = [firstItem];

    // Use requestAnimationFrame to ensure state is updated before showing
    requestAnimationFrame(() => {
      if (isMountedRef.current) {
        setSequence(newSequence);
        setTimeout(() => {
          if (isMountedRef.current) {
            showSequence(newSequence);
          }
        }, 100);
      }
    });
  }, [showSequence]);

  const handleButtonClick = useCallback(
    async (index: number) => {
      if (gameState !== "input" || isProcessing) return;

      sounds.sequenceButton(index);
      setActiveButton(index);
      setTimeout(() => setActiveButton(null), 150);

      const newInput = [...userInput, index];
      setUserInput(newInput);

      const expectedIndex = newInput.length - 1;

      // Check if wrong
      if (index !== sequence[expectedIndex]) {
        setIsProcessing(true);
        sounds.error();
        showingRef.current = false;

        const finalLevel = Math.max(1, level);

        try {
          const testResult = await onComplete(finalLevel);
          if (isMountedRef.current && testResult) {
            setResult(testResult);
            sounds.newRecord();
            setGameState("results");
          } else if (isMountedRef.current) {
            setResult({
              id: "local",
              testType: "sequence",
              score: finalLevel,
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
              testType: "sequence",
              score: finalLevel,
              percentile: 50,
              createdAt: new Date(),
              userId: "local",
            });
            setGameState("results");
          }
        }
        setIsProcessing(false);
        return;
      }

      // Check if sequence complete
      if (newInput.length === sequence.length) {
        sounds.levelUp();
        setGameState("levelComplete");

        const newLevel = level + 1;
        const newItem = Math.floor(Math.random() * 4);
        const newSequence = [...sequence, newItem];

        setTimeout(() => {
          if (isMountedRef.current) {
            setLevel(newLevel);
            setSequence(newSequence);
            showSequence(newSequence);
          }
        }, 800);
      }
    },
    [
      gameState,
      userInput,
      sequence,
      level,
      onComplete,
      showSequence,
      isProcessing,
    ],
  );

  const resetGame = useCallback(() => {
    // Stop any ongoing sequence display
    showingRef.current = false;
    setActiveButton(null);

    // Reset all state
    setGameState("instructions");
    setSequence([]);
    setUserInput([]);
    setLevel(1);
    setResult(null);
    setIsProcessing(false);
  }, []);

  if (gameState === "results" && result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-scale-in bg-background">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔲</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Sequence Complete
          </h2>
          <div className="text-6xl font-bold text-gradient-primary mb-2">
            Level {result.score}
          </div>
          <div
            className={cn(
              "text-xl font-semibold",
              result.percentile >= 90 ? "text-yellow-500" : "text-primary",
            )}
          >
            Top {100 - result.percentile}%
          </div>
          <p className="text-muted-foreground mt-2">
            {result.score >= 12
              ? "Incredible memory!"
              : result.score >= 8
                ? "Great job!"
                : "Keep practicing!"}
          </p>
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

  if (gameState === "instructions") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-slide-up bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4"
          onClick={() => navigate("/tests")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <div className="text-6xl mb-6">🔲</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {config.name}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Watch the sequence of colors that light up, then repeat the pattern
            by clicking the buttons in the same order.
          </p>
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={startGame}
          >
            Start Test
          </Button>
        </div>
      </div>
    );
  }

  if (gameState === "levelComplete") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Level {level} Complete!
          </h2>
          <p className="text-muted-foreground">
            Get ready for level {level + 1}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4"
        onClick={() => {
          showingRef.current = false;
          navigate("/tests");
        }}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="text-center mb-6">
        <span className="text-lg font-bold text-foreground">Level {level}</span>
        <p className="text-sm text-muted-foreground">
          {gameState === "showing"
            ? "Watch the sequence..."
            : `Your turn: ${userInput.length}/${sequence.length}`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-[280px]">
        {colors.map((color, index) => {
          const isActive = activeButton === index;
          return (
            <button
              key={index}
              onClick={() => handleButtonClick(index)}
              disabled={gameState === "showing" || isProcessing}
              className={cn(
                "aspect-square rounded-2xl transition-all duration-150",
                isActive ? color.active : color.bg,
                isActive
                  ? `opacity-100 scale-105 shadow-xl ${color.glow}`
                  : "opacity-60 hover:opacity-80",
                (gameState === "showing" || isProcessing) &&
                  "cursor-not-allowed",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
