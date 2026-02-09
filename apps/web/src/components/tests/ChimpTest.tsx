import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import { TEST_CONFIGS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sounds, initAudio } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface ChimpTestProps {
  submitAttempt: (
    score: number,
    details: { level: number; mistakes: number; timeMs: number },
  ) => Promise<{ id: number } | null>;
}

type GameState =
  | "instructions"
  | "showing"
  | "hidden"
  | "levelComplete"
  | "results";

export function ChimpTest({ submitAttempt }: ChimpTestProps) {
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<GameState>("instructions");
  const [level, setLevel] = useState(1);
  const [numbers, setNumbers] = useState<
    { value: number; x: number; y: number; clicked: boolean }[]
  >([]);
  const [nextExpected, setNextExpected] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);

  // ✅ Share as post
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const testStartRef = useRef<number | null>(null);

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
      setLevel(lvl);
      const nums = generateNumbers(lvl);
      setNumbers(nums);
      setNextExpected(1);
      setGameState("showing");
    },
    [generateNumbers],
  );

  const endGame = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      sounds.error();
    } catch {
      // ignore
    }

    const finalLevel = level;

    // Show results immediately
    setFinalScore(finalLevel);
    setGameState("results");

    const startedAt = testStartRef.current ?? Date.now();
    const timeMs = Math.max(0, Date.now() - startedAt);

    try {
      const created = await submitAttempt(finalLevel, {
        level: finalLevel,
        mistakes,
        timeMs,
      });

      if (isMountedRef.current) {
        setAttemptId(created?.id ?? null);
      }

      try {
        sounds.newRecord();
      } catch {
        // ignore
      }
    } catch (e) {
      console.error("submitAttempt failed:", e);
    } finally {
      if (isMountedRef.current) setIsProcessing(false);
    }
  }, [isProcessing, level, mistakes, submitAttempt]);

  const handleCellClick = useCallback(
    async (clickedNum: { value: number; x: number; y: number }) => {
      if (isProcessing) return;

      const advanceLevel = () => {
        try {
          sounds.levelUp();
        } catch {
          // ignore
        }
        setGameState("levelComplete");
        const nextLevel = level + 1;

        setTimeout(() => {
          if (isMountedRef.current) {
            startLevel(nextLevel);
          }
        }, 800);
      };

      if (gameState === "showing") {
        if (clickedNum.value === 1) {
          try {
            sounds.click();
          } catch {
            // ignore
          }
          setNumbers((prev) =>
            prev.map((n) => (n.value === 1 ? { ...n, clicked: true } : n)),
          );

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
          try {
            sounds.click();
          } catch {
            // ignore
          }
          setNumbers((prev) =>
            prev.map((n) =>
              n.value === clickedNum.value ? { ...n, clicked: true } : n,
            ),
          );

          if (nextExpected === level) {
            advanceLevel();
          } else {
            setNextExpected((prev) => prev + 1);
          }
        } else {
          setMistakes((m) => m + 1);
          await endGame();
        }
      }
    },
    [endGame, gameState, isProcessing, level, nextExpected, startLevel],
  );

  const resetGame = useCallback(() => {
    setGameState("instructions");
    setLevel(startingLevel);
    setNumbers([]);
    setNextExpected(1);

    setFinalScore(null);
    setMistakes(0);
    setIsProcessing(false);

    // ✅ reset share state
    setAttemptId(null);
    setCaption("");
    setIsSharing(false);
    setShareError(null);
    setIsPublic(false);

    testStartRef.current = null;
  }, []);

  const handleStart = useCallback(() => {
    initAudio();
    try {
      sounds.click();
    } catch {
      // ignore
    }

    setMistakes(0);

    // reset share state for a new run
    setAttemptId(null);
    setCaption("");
    setIsSharing(false);
    setShareError(null);
    setIsPublic(false);
    testStartRef.current = Date.now();
    startLevel(startingLevel);
  }, [startLevel]);

  const handleShare = useCallback(async () => {
    if (!attemptId || isSharing) return;

    setIsSharing(true);
    setShareError(null);

    const { data, error } = await api.createPost(isPublic, attemptId, caption);

    if (error) {
      try {
        const parsed = JSON.parse(error);
        setShareError(parsed.reason ?? parsed.error ?? error);
      } catch {
        setShareError(error);
      }
      setIsSharing(false);
      return;
    }

    const postId = (data as any)?.id ?? (data as any)?.post?.id;
    if (postId) navigate(`/post/${postId}`);
    else navigate("/feed");

    setIsSharing(false);
  }, [attemptId, caption, isSharing, navigate, isPublic]);

  if (gameState === "results" && finalScore !== null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-scale-in bg-background">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Chimp Test Complete
          </h2>
          <div className="text-6xl font-bold text-gradient-primary mb-2">
            Level {finalScore}
          </div>

          <p className="text-muted-foreground mt-2">
            {finalScore >= 9
              ? "Amazing! You beat the average chimp!"
              : finalScore >= 7
                ? "Great memory!"
                : "Keep practicing!"}
          </p>

          <p className="text-sm text-muted-foreground mt-2">
            Mistakes: {mistakes}
          </p>

          <p className="text-sm text-muted-foreground mt-2">
            Saving attempt: {isProcessing ? "..." : attemptId ? "done" : "failed"}
          </p>
        </div>

        {/* ✅ Share as post */}
        <div className="w-full max-w-sm space-y-2 mb-6">
          {shareError && (
            <div className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm">
              {shareError}
            </div>
          )}

          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption (optional)..."
            maxLength={140}
            disabled={!attemptId || isSharing}
          />

          {/* ✅ Public / Private toggle */}
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={!attemptId || isSharing}
            />
            Share publicly
          </label>

          <Button
            onClick={handleShare}
            disabled={!attemptId || isSharing}
            className="w-full"
            variant="secondary"
          >
            <Share2 className="h-4 w-4 mr-2" />
            {isSharing
              ? "Sharing..."
              : attemptId
                ? "Share as post"
                : "Saving attempt..."}
          </Button>
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
