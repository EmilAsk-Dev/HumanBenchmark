import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'login' | 'register';

const AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
];

export default function Login() {
  const navigate = useNavigate();
  const { login, register, isLoading, error: authError, clearError, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [gender, setGender] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>(AVATARS[0]); 

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when switching modes
  useEffect(() => {
    setValidationError('');
    clearError?.();
  }, [mode, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (mode === 'login') {
      const result = await login(email, password);
      if (!result.error) {
        navigate('/');
      }
    } else {
      if (!username.trim()) {
        setValidationError('Username is required');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match');
        return;
      }
      if (!dateOfBirth) {
        setValidationError('Date of birth is required');
        return;
      }
      if (!gender) {
        setValidationError('Please select your gender');
        return;
      }
      if (!avatarUrl) {
        setValidationError('Please select an avatar');
        return;
      }

      const result = await register(
        email,
        password,
        username,
        dateOfBirth.toISOString(),
        gender,
        avatarUrl
      );

      if (!result.error) {
        navigate('/');
      }
    }
  };

  const displayError = validationError || authError;

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/20 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/20 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg glow-primary"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl font-bold text-primary-foreground">H</span>
            </motion.div>
            <span className="text-3xl font-bold text-gradient-primary">Human Bench</span>
          </div>
          <p className="text-muted-foreground">Test your cognitive abilities</p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            {/* Tabs */}
            <div className="flex mb-6 p-1 rounded-lg bg-muted relative">
              <motion.div
                className="absolute top-1 bottom-1 rounded-md bg-background shadow-sm"
                initial={false}
                animate={{
                  left: mode === 'login' ? '4px' : '50%',
                  right: mode === 'login' ? '50%' : '4px',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors relative z-10 ${
                  mode === 'login' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors relative z-10 ${
                  mode === 'register' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="speedster123"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-muted/50"
                      />
                    </div>

                    {/* ✅ Avatar picker */}
                    <div className="space-y-2">
                      
                      <Label>Choose an avatar</Label>
                      <div className="flex flex-wrap gap-2">
                        {AVATARS.map((src) => {
                          const selected = avatarUrl === src;
                          return (
                            <button
                              key={src}
                              type="button"
                              onClick={() => setAvatarUrl(src)}
                              className={cn(
                                "rounded-xl p-1 transition border",
                                selected ? "border-primary" : "border-transparent hover:border-border"
                              )}
                              aria-label="Select avatar"
                            >
                              <img
                                src={src}
                                alt="Avatar"
                                width={44}
                                height={44}
                                className={cn(
                                  "rounded-lg block",
                                  selected ? "ring-2 ring-primary" : ""
                                )}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You can change this later in your profile.
                      </p>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-muted/50",
                              !dateOfBirth && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateOfBirth}
                            onSelect={setDateOfBirth}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                            className="p-3 pointer-events-auto"
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="bg-muted/50">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="email">Email or username</Label>
                <Input
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted/50"
                  required
                />
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted/50 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Confirm Password - only in register mode */}
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="confirm-password-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-muted/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {displayError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-destructive"
                  >
                    {displayError}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground gap-2"
                  disabled={isLoading}
                >
                  <motion.span
                    key={mode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {isLoading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Create Account'}
                  </motion.span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </form>

            {mode === 'login' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground mt-4"
              >
                <button className="text-primary hover:underline">Forgot password?</button>
              </motion.p>
            )}
          </div>

          {/* Skip for now */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Skip for now →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
