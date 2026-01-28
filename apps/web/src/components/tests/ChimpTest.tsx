import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TestRun, TEST_CONFIGS } from "@/types";
import { Button } from "@/components/ui/button";
import { sounds, initAudio } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface ChimpTestProps {
  onComplete: (score: number) => Promise<TestRun | null>;
}

type GameState =
  | "instructions"
  | "showing"
  | "hidden"
  | "levelComplete"
  | "results";

export function ChimpTest({ onComplete }: ChimpTestProps) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>("instructions");
  const [level, setLevel] = useState(1);
  const [numbers, setNumbers] = useState<
    { value: number; x: number; y: number; clicked: boolean }[]
  >([]);
  const [nextExpected, setNextExpected] = useState(1);
  const [result, setResult] = useState<TestRun | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMountedRef = useRef(true);

  const config = TEST_CONFIGS.chimp;
  const gridSize = 5;
  const startingLevel = 1;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const generateNumbers = useCallback((count: number) => {
    const positions = new Set<string>();
    const nums: { value: number; x: number; y: number; clicked: boolean }[] =
      [];

    while (nums.length < count) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      const key = `${x}-${y}`;

      if (!positions.has(key)) {
        positions.add(key);
        nums.push({ value: nums.length + 1, x, y, clicked: false });
      }
    }

    return nums;
  }, []);

  const startLevel = useCallback(
    (lvl: number) => {
      // Keep the single source of truth for the current level here
      setLevel(lvl);
      const nums = generateNumbers(lvl);
      setNumbers(nums);
      setNextExpected(1);
      setGameState("showing");
    },
    [generateNumbers],
  );

  const handleCellClick = useCallback(
    async (clickedNum: { value: number; x: number; y: number }) => {
      if (isProcessing) return;

      // Helper function to advance level
      const advanceLevel = () => {
        sounds.levelUp();
        setGameState("levelComplete");
        const nextLevel = level + 1;

        setTimeout(() => {
          if (isMountedRef.current) {
            startLevel(nextLevel);
          }
        }, 800);
      };

      // Helper function to end game - show results immediately, API call in background
      const endGame = () => {
        setIsProcessing(true);
        sounds.error();
        const finalLevel = level;

        // Show results immediately with placeholder percentile
        const immediateResult: TestRun = {
          id: "local",
          testType: "chimp",
          score: finalLevel,
          percentile: 50,
          createdAt: new Date(),
          userId: "local",
        };
        setResult(immediateResult);
        sounds.newRecord();
        setGameState("results");
        setIsProcessing(false);

        // Update with real percentile from API in background (non-blocking)
        onComplete(finalLevel)
          .then((testResult) => {
            if (isMountedRef.current && testResult) {
              setResult(testResult);
            }
          })
          .catch((e) => {
            console.error("Error completing test:", e);
          });
      };

      if (gameState === "showing") {
        if (clickedNum.value === 1) {
          sounds.click();
          setNumbers((prev) =>
            prev.map((n) => (n.value === 1 ? { ...n, clicked: true } : n)),
          );

          // If level 1, clicking "1" completes the level immediately
          if (level === 1) {
            advanceLevel();
          } else {
            setGameState("hidden");
            setNextExpected(2);
          }
        }
        return;
      }

      if (gameState === "hidden") {
        if (clickedNum.value === nextExpected) {
          sounds.click();
          setNumbers((prev) =>
            prev.map((n) =>
              n.value === clickedNum.value ? { ...n, clicked: true } : n,
            ),
          );

          if (nextExpected === level) {
            // Level complete
            advanceLevel();
          } else {
            setNextExpected((prev) => prev + 1);
          }
        } else {
          // Wrong click - game over
          endGame();
        }
      }
    },
    [gameState, nextExpected, level, onComplete, startLevel, isProcessing],
  );

  const resetGame = useCallback(() => {
    setGameState("instructions");
    setLevel(startingLevel);
    setNumbers([]);
    setNextExpected(1);
    setResult(null);
    setIsProcessing(false);
  }, []);

  const handleStart = useCallback(() => {
    initAudio();
    sounds.click();
    startLevel(startingLevel);
  }, [startLevel]);

  if (gameState === "results" && result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-scale-in bg-background">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Chimp Test Complete
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
            {result.score >= 9
              ? "Amazing! You beat the average chimp!"
              : result.score >= 7
                ? "Great memory!"
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
          <div className="text-6xl mb-6">🧠</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {config.name}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Numbers will appear on screen. Memorize their positions, then click
            them in order starting from 1. Can you beat a chimpanzee?
          </p>
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={handleStart}
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
        onClick={() => navigate("/tests")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="text-center mb-4">
        <span className="text-lg font-bold text-foreground">Level {level}</span>
        {gameState === "showing" && (
          <p className="text-sm text-muted-foreground">
            Memorize positions, then click 1
          </p>
        )}
        {gameState === "hidden" && (
          <p className="text-sm text-primary font-medium">
            Click {nextExpected}
          </p>
        )}
      </div>

      <div
        className="grid gap-2 w-full max-w-[320px] aspect-square"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
          const x = idx % gridSize;
          const y = Math.floor(idx / gridSize);
          const num = numbers.find((n) => n.x === x && n.y === y);

          if (!num) {
            return (
              <div key={idx} className="aspect-square rounded-lg bg-muted/30" />
            );
          }

          const isClicked = num.clicked;
          const showNumber = gameState === "showing" || isClicked;

          return (
            <button
              key={idx}
              onClick={() => !isClicked && handleCellClick(num)}
              disabled={isClicked || isProcessing}
              className={cn(
                "aspect-square rounded-lg font-bold text-xl transition-all duration-150",
                isClicked
                  ? "bg-success/30 text-success scale-95"
                  : "bg-primary hover:bg-primary/80 text-primary-foreground active:scale-95",
              )}
            >
              {showNumber ? num.value : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
