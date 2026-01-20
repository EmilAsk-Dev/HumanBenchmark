import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TestRun, TEST_CONFIGS } from '@/types';
import { generateTypingText } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { sounds, initAudio } from '@/lib/sounds';
import { cn } from '@/lib/utils';

interface TypingTestProps {
  onComplete: (score: number) => Promise<TestRun | null>;
}

type GameState = 'instructions' | 'countdown' | 'playing' | 'results';

export function TypingTest({ onComplete }: TypingTestProps) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('instructions');
  const [duration, setDuration] = useState(30);
  const [text, setText] = useState('');
  const [typed, setTyped] = useState('');
  const [timeLeft, setTimeLeft] = useState(duration);
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<TestRun | null>(null);
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

  const calculateWPM = useCallback((typedText: string, textToType: string, testDuration: number) => {
    let correctChars = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === textToType[i]) {
        correctChars++;
      }
    }
    const minutes = testDuration / 60;
    const wpm = Math.round((correctChars / 5) / minutes);
    return Math.max(0, wpm);
  }, []);

  const calculateAccuracy = useCallback(() => {
    if (typed.length === 0) return 100;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === text[i]) correct++;
    }
    return Math.round((correct / typed.length) * 100);
  }, [typed, text]);

  const currentWPM = useCallback(() => {
    if (typed.length === 0 || timeLeft === duration) return 0;
    const elapsedTime = duration - timeLeft;
    if (elapsedTime === 0) return 0;
    return calculateWPM(typed, text, elapsedTime);
  }, [typed, text, timeLeft, duration, calculateWPM]);

  const startGame = useCallback((dur: number) => {
    initAudio();
    setDuration(dur);
    setTimeLeft(dur);
    setText(generateTypingText(100));
    setTyped('');
    setCountdown(3);
    prevTypedLengthRef.current = 0;
    setGameState('countdown');
  }, []);

  // Countdown effect
  useEffect(() => {
    if (gameState !== 'countdown') return;
    
    if (countdown > 0) {
      sounds.countdown();
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setCountdown(c => c - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      sounds.go();
      setGameState('playing');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [gameState, countdown]);

  // Game timer effect - use setInterval for consistent timing
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState]);

  // Handle game completion when time runs out
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft > 0) return;
    
    const finalWPM = calculateWPM(typed, text, duration);
    onComplete(finalWPM).then(r => {
      if (isMountedRef.current && r) {
        setResult(r);
        sounds.newRecord();
        setGameState('results');
      } else if (isMountedRef.current) {
        setResult({ id: 'local', testType: 'typing', score: finalWPM, percentile: 50, createdAt: new Date(), userId: 'local' });
        setGameState('results');
      }
    }).catch(() => {
      if (isMountedRef.current) {
        setResult({ id: 'local', testType: 'typing', score: finalWPM, percentile: 50, createdAt: new Date(), userId: 'local' });
        setGameState('results');
      }
    });
  }, [gameState, timeLeft, typed, text, duration, calculateWPM, onComplete]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return;
    
    const newTyped = e.target.value;
    
    // Play sound for new characters
    if (newTyped.length > prevTypedLengthRef.current) {
      const newChar = newTyped[newTyped.length - 1];
      const expectedChar = text[newTyped.length - 1];
      if (newChar === expectedChar) {
        sounds.typeCorrect();
      } else {
        sounds.typeError();
      }
    }
    
    prevTypedLengthRef.current = newTyped.length;
    setTyped(newTyped);
  }, [gameState, text]);

  const handleContainerClick = useCallback(() => {
    if (gameState === 'playing') {
      inputRef.current?.focus();
    }
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState('instructions');
    setTyped('');
    setResult(null);
    prevTypedLengthRef.current = 0;
  }, []);

  if (gameState === 'results' && result) {
    const accuracy = calculateAccuracy();
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-scale-in bg-background">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⌨️</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Typing Test Complete</h2>
          <div className="text-6xl font-bold text-gradient-primary mb-2">
            {result.score} <span className="text-3xl">WPM</span>
          </div>
          <div className={cn(
            'text-xl font-semibold',
            result.percentile >= 90 ? 'text-yellow-500' : 'text-primary'
          )}>
            Top {100 - result.percentile}%
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3 mb-8">
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

        <div className="flex gap-3 w-full max-w-sm">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/tests')}>
            Back
          </Button>
          <Button className="flex-1 gradient-primary text-primary-foreground" onClick={resetGame}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (gameState === 'instructions') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-slide-up bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4"
          onClick={() => navigate('/tests')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center">
          <div className="text-6xl mb-6">⌨️</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">{config.name}</h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Type the words as fast and accurately as you can. Your WPM will be calculated based on correct characters.
          </p>
          
          <div className="flex gap-3 justify-center mb-6">
            {[15, 30, 60].map(dur => (
              <Button
                key={dur}
                variant="outline"
                className={cn(
                  'px-6',
                  duration === dur && 'border-primary text-primary bg-primary/10'
                )}
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

  if (gameState === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4"
          onClick={() => setGameState('instructions')}
        >
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
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4"
        onClick={() => navigate('/tests')}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      {/* Timer & Stats */}
      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <div className={cn(
            "text-4xl font-bold",
            timeLeft <= 10 ? "text-destructive" : "text-primary"
          )}>
            {timeLeft}s
          </div>
          <div className="text-xs text-muted-foreground">Time Left</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{currentWPM()}</div>
          <div className="text-xs text-muted-foreground">WPM</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{calculateAccuracy()}%</div>
          <div className="text-xs text-muted-foreground">Accuracy</div>
        </div>
      </div>

      {/* Text Display */}
      <div className="w-full max-w-2xl p-6 rounded-xl bg-card border border-border mb-4 cursor-text">
        <p className="text-lg leading-relaxed font-mono whitespace-pre-wrap">
          {text.split('').map((char, i) => {
            let className = 'text-muted-foreground/50';
            if (i < typed.length) {
              className = typed[i] === char ? 'text-success' : 'text-destructive bg-destructive/20';
            } else if (i === typed.length) {
              className = 'text-foreground bg-primary/40 animate-pulse';
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
        ref={inputRef}
        type="text"
        value={typed}
        onChange={handleInput}
        className="opacity-0 absolute -z-10"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      
      <p className="text-sm text-muted-foreground">Click the text area and start typing</p>
    </div>
  );
}
