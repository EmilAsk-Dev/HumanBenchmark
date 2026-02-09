import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import { TEST_CONFIGS } from "@/types";
import { generateTypingText } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sounds, initAudio } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface TypingTestProps {
  submitAttempt: (
    score: number,
    details: { wpm: number; accuracy: number; characters: number },
  ) => Promise<{ id: number } | null>;
}

type GameState = "instructions" | "countdown" | "playing" | "results";

type LocalResult = {
  score: number; // wpm
  percentile: number; // placeholder
};

export function TypingTest({ submitAttempt }: TypingTestProps) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>("instructions");
  const [duration, setDuration] = useState(30);
  const [text, setText] = useState("");
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<LocalResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ share state
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const prevTypedLengthRef = useRef(0);

  const config = TEST_CONFIGS.typing;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const calculateWPM = useCallback(
    (typedText: string, textToType: string, elapsedSeconds: number) => {
      let correctChars = 0;
      for (let i = 0; i < typedText.length; i++) {
        if (typedText[i] === textToType[i]) correctChars++;
      }
      const minutes = Math.max(0.0001, elapsedSeconds / 60);
      const wpm = Math.round(correctChars / 5 / minutes);
      return Math.max(0, wpm);
    },
    [],
  );

  const calculateAccuracy = useCallback(
    (typedText: string, textToType: string) => {
      if (typedText.length === 0) return 100;
      let correct = 0;
      for (let i = 0; i < typedText.length; i++) {
        if (typedText[i] === textToType[i]) correct++;
      }
      return Math.round((correct / typedText.length) * 100);
    },
    [],
  );

  const currentWPM = useCallback(() => {
    if (typed.length === 0 || timeLeft === duration) return 0;
    const elapsed = duration - timeLeft;
    if (elapsed <= 0) return 0;
    return calculateWPM(typed, text, elapsed);
  }, [typed, text, timeLeft, duration, calculateWPM]);

  const startGame = useCallback((dur: number) => {
    initAudio();
    setDuration(dur);
    setTimeLeft(dur);
    setText(generateTypingText(100));
    setTyped("");
    setCountdown(3);
    prevTypedLengthRef.current = 0;

    // ✅ reset result + share state
    setResult(null);
    setIsProcessing(false);
    setAttemptId(null);
    setCaption("");
    setIsSharing(false);
    setShareError(null);

    setGameState("countdown");
  }, []);

  // Countdown
  useEffect(() => {
    if (gameState !== "countdown") return;

    if (countdown > 0) {
      try {
        sounds.countdown();
      } catch {
        // ignore
      }
      const timer = setTimeout(() => {
        if (isMountedRef.current) setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        sounds.go();
      } catch {
        // ignore
      }
      setGameState("playing");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [gameState, countdown]);

  // Game timer
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Finish when time runs out
  useEffect(() => {
    if (gameState !== "playing" || timeLeft > 0) return;

    const finalWpm = calculateWPM(typed, text, duration);
    const accuracy = calculateAccuracy(typed, text);
    const characters = typed.length;

    // show results immediately
    setResult({ score: finalWpm, percentile: 50 });
    setGameState("results");

    (async () => {
      setIsProcessing(true);
      try {
        // ✅ IMPORTANT: submitAttempt MUST return { id }
        const created = await submitAttempt(finalWpm, {
          wpm: finalWpm,
          accuracy,
          characters,
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
        console.error("Failed to submit typing attempt:", e);
      } finally {
        if (isMountedRef.current) setIsProcessing(false);
      }
    })();
  }, [gameState, timeLeft, typed, text, duration, calculateWPM, calculateAccuracy, submitAttempt]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (gameState !== "playing") return;

      const newTyped = e.target.value;

      if (newTyped.length > prevTypedLengthRef.current) {
        const newChar = newTyped[newTyped.length - 1];
        const expectedChar = text[newTyped.length - 1];
        try {
          if (newChar === expectedChar) sounds.typeCorrect();
          else sounds.typeError();
        } catch {
          // ignore
        }
      }

      prevTypedLengthRef.current = newTyped.length;
      setTyped(newTyped);
    },
    [gameState, text],
  );

  const handleContainerClick = useCallback(() => {
    if (gameState === "playing") inputRef.current?.focus();
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState("instructions");
    setTyped("");
    setResult(null);
    setIsProcessing(false);

    // ✅ reset share state
    setAttemptId(null);
    setCaption("");
    setIsSharing(false);
    setShareError(null);

    prevTypedLengthRef.current = 0;
  }, []);

  const handleShare = useCallback(async () => {
    if (!attemptId || isSharing) return;

    setIsSharing(true);
    setShareError(null);

    // expects api.createPost(attemptId, caption) -> PostDto (or {post:{...}})
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
    const accuracy = calculateAccuracy(typed, text);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-scale-in bg-background">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⌨️</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Typing Test Complete</h2>
          <div className="text-6xl font-bold text-gradient-primary mb-2">
            {result.score} <span className="text-3xl">WPM</span>
          </div>

          <div className="text-sm text-muted-foreground mt-2">
            Saving attempt: {isProcessing ? "..." : attemptId ? "done" : "failed"}
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3 mb-6">
          <div className="flex justify-between p-3 rounded-lg bg-card border border-border">
            <span className="text-muted-foreground">Accuracy</span>
            <span className="font-bold text-foreground">{accuracy}%</span>
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-card border border-border">
            <span className="text-muted-foreground">Characters</span>
            <span className="font-bold text-foreground">{typed.length}</span>
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-card border border-border">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-bold text-foreground">{duration}s</span>
          </div>
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
          <Button variant="outline" className="flex-1" onClick={() => navigate("/tests")}>
            Back
          </Button>
          <Button className="flex-1 gradient-primary text-primary-foreground" onClick={resetGame}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (gameState === "instructions") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-slide-up bg-background">
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => navigate("/tests")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <div className="text-6xl mb-6">⌨️</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">{config.name}</h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Type the words as fast and accurately as you can. Your WPM will be calculated based on correct characters.
          </p>

          <div className="flex gap-3 justify-center mb-6">
            {[15, 30, 60].map((dur) => (
              <Button
                key={dur}
                variant="outline"
                className={cn("px-6", duration === dur && "border-primary text-primary bg-primary/10")}
                onClick={() => setDuration(dur)}
              >
                {dur}s
              </Button>
            ))}
          </div>

          <Button className="gradient-primary text-primary-foreground" onClick={() => startGame(duration)}>
            Start Test
          </Button>
        </div>
      </div>
    );
  }

  if (gameState === "countdown") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => setGameState("instructions")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-8xl font-bold text-primary animate-pulse">{countdown}</div>
        <p className="text-muted-foreground mt-4">Get ready...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-screen p-4 bg-background"
      onClick={handleContainerClick}
    >
      <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => navigate("/tests")}>
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Timer & Stats */}
      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <div className={cn("text-4xl font-bold", timeLeft <= 10 ? "text-destructive" : "text-primary")}>
            {timeLeft}s
          </div>
          <div className="text-xs text-muted-foreground">Time Left</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{currentWPM()}</div>
          <div className="text-xs text-muted-foreground">WPM</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{calculateAccuracy(typed, text)}%</div>
          <div className="text-xs text-muted-foreground">Accuracy</div>
        </div>
      </div>

      {/* Text Display */}
      <div className="w-full max-w-2xl p-6 rounded-xl bg-card border border-border mb-4 cursor-text">
        <p className="text-lg leading-relaxed font-mono whitespace-pre-wrap">
          {text.split("").map((char, i) => {
            let className = "text-muted-foreground/50";
            if (i < typed.length) {
              className = typed[i] === char ? "text-success" : "text-destructive bg-destructive/20";
            } else if (i === typed.length) {
              className = "text-foreground bg-primary/40 animate-pulse";
            }
            return (
              <span key={i} className={className}>
                {char}
              </span>
            );
          })}
        </p>
      </div>

      {/* Hidden Input */}
      <input
        aria-label="Input"
        ref={inputRef}
        type="text"
        value={typed}
        onChange={handleInput}
        className="opacity-0 absolute -z-10"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <p className="text-sm text-muted-foreground">Click the text area and start typing</p>
    </div>
  );
}
