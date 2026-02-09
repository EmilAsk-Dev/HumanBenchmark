import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import { TEST_CONFIGS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sounds, initAudio } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface SequenceTestProps {
  submitAttempt: (
    score: number,
    details: { level: number; mistakes: number; timeMs: number },
  ) => Promise<{ id: number } | null>;
}

type GameState =
  | "instructions"
  | "showing"
  | "input"
  | "levelComplete"
  | "results";

type LocalResult = {
  score: number; // final level
  percentile: number; // placeholder
};

const colors = [
  { bg: "bg-red-500", active: "bg-red-400", glow: "shadow-red-500/50" },
  { bg: "bg-blue-500", active: "bg-blue-400", glow: "shadow-blue-500/50" },
  { bg: "bg-green-500", active: "bg-green-400", glow: "shadow-green-500/50" },
  { bg: "bg-yellow-500", active: "bg-yellow-400", glow: "shadow-yellow-500/50" },
];

export function SequenceTest({ submitAttempt }: SequenceTestProps) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>("instructions");
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<LocalResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ share state
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const showingRef = useRef(false);
  const isMountedRef = useRef(true);
  const startedAtRef = useRef<number | null>(null);

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
      try {
        sounds.sequenceButton(seq[i]);
      } catch {
        // ignore
      }
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

    // reset all gameplay
    showingRef.current = false;
    setActiveButton(null);
    setSequence([]);
    setUserInput([]);
    setLevel(1);
    setMistakes(0);
    setIsProcessing(false);
    setResult(null);

    // ✅ reset share state
    setAttemptId(null);
    setCaption("");
    setIsSharing(false);
    setShareError(null);

    // start timing
    startedAtRef.current = performance.now();

    const firstItem = Math.floor(Math.random() * 4);
    const newSequence = [firstItem];

    requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      setSequence(newSequence);
      setTimeout(() => {
        if (isMountedRef.current) showSequence(newSequence);
      }, 100);
    });
  }, [showSequence]);

  const finishGame = useCallback(
    async (finalLevel: number) => {
      setIsProcessing(true);
      showingRef.current = false;

      const startedAt = startedAtRef.current ?? performance.now();
      const timeMs = Math.max(0, Math.round(performance.now() - startedAt));

      // show results immediately (placeholder percentile)
      setResult({ score: finalLevel, percentile: 50 });
      setGameState("results");

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
        console.error("Failed to submit sequence attempt:", e);
      } finally {
        if (isMountedRef.current) setIsProcessing(false);
      }
    },
    [mistakes, submitAttempt],
  );

  const handleButtonClick = useCallback(
    async (index: number) => {
      if (gameState !== "input" || isProcessing) return;

      try {
        sounds.sequenceButton(index);
      } catch {
        // ignore
      }
      setActiveButton(index);
      setTimeout(() => setActiveButton(null), 150);

      const newInput = [...userInput, index];
      setUserInput(newInput);

      const expectedIndex = newInput.length - 1;

      // wrong => end game
      if (index !== sequence[expectedIndex]) {
        setMistakes((m) => m + 1);
        try {
          sounds.error();
        } catch {
          // ignore
        }
        const finalLevel = Math.max(1, level);
        await finishGame(finalLevel);
        return;
      }

      // completed current sequence => next level
      if (newInput.length === sequence.length) {
        try {
          sounds.levelUp();
        } catch {
          // ignore
        }

        setGameState("levelComplete");

        const newLevel = level + 1;
        const newItem = Math.floor(Math.random() * 4);
        const newSequence = [...sequence, newItem];

        setTimeout(() => {
          if (!isMountedRef.current) return;
          setLevel(newLevel);
          setSequence(newSequence);
          showSequence(newSequence);
        }, 800);
      }
    },
    [finishGame, gameState, isProcessing, level, sequence, showSequence, userInput],
  );

  const resetGame = useCallback(() => {
    showingRef.current = false;
    setActiveButton(null);

    setGameState("instructions");
    setSequence([]);
    setUserInput([]);
    setLevel(1);
    setMistakes(0);
    setResult(null);
    setIsProcessing(false);
    startedAtRef.current = null;

    // ✅ reset share state
    setAttemptId(null);
    setCaption("");
    setIsSharing(false);
    setShareError(null);
  }, []);

  const handleShare = useCallback(async () => {
    if (!attemptId || isSharing) return;

    setIsSharing(true);
    setShareError(null);

    const { data, error } = await api.createPost(attemptId, caption);

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
  }, [attemptId, caption, isSharing, navigate]);

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

          <p className="text-xs text-muted-foreground mt-3">
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

          <Button
            onClick={handleShare}
            disabled={!attemptId || isSharing}
            className="w-full"
            variant="secondary"
          >
            <Share2 className="h-4 w-4 mr-2" />
            {isSharing ? "Sharing..." : attemptId ? "Share as post" : "Saving attempt..."}
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
              aria-label="Something"
              key={index}
              onClick={() => handleButtonClick(index)}
              disabled={gameState === "showing" || isProcessing}
              className={cn(
                "aspect-square rounded-2xl transition-all duration-150",
                isActive ? color.active : color.bg,
                isActive
                  ? `opacity-100 scale-105 shadow-xl ${color.glow}`
                  : "opacity-60 hover:opacity-80",
                (gameState === "showing" || isProcessing) && "cursor-not-allowed",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
