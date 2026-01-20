import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Gamepad2, Plus, Trophy, User, X, Zap, Brain, Keyboard, Grid3x3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TEST_CONFIGS, TestType } from '@/types';

const navItems = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/tests', icon: Gamepad2, label: 'Tests' },
  { path: '', icon: Plus, label: 'Quick', isAction: true },
  { path: '/leaderboards', icon: Trophy, label: 'Ranks' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const quickTests: { type: TestType; icon: React.ReactNode; color: string }[] = [
  { type: 'reaction', icon: <Zap className="h-5 w-5" />, color: 'bg-green-500' },
  { type: 'chimp', icon: <Brain className="h-5 w-5" />, color: 'bg-orange-500' },
  { type: 'typing', icon: <Keyboard className="h-5 w-5" />, color: 'bg-cyan-500' },
  { type: 'sequence', icon: <Grid3x3 className="h-5 w-5" />, color: 'bg-purple-500' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const handleQuickTest = (type: TestType) => {
    setIsQuickMenuOpen(false);
    navigate(`/tests/${type}`);
  };

  return (
    <>
      {/* Quick Action Menu Overlay */}
      <AnimatePresence>
        {isQuickMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsQuickMenuOpen(false)}
            />
            
            {/* Quick Actions */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
              <motion.div 
                className="flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                {quickTests.map((test, index) => (
                  <motion.button
                    key={test.type}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      transition: { delay: index * 0.05 }
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.5, 
                      y: 20,
                      transition: { delay: (quickTests.length - index) * 0.03 }
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickTest(test.type)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl shadow-lg',
                      test.color,
                      'text-white'
                    )}
                  >
                    {test.icon}
                    <span className="text-xs font-medium">{TEST_CONFIGS[test.type].name.split(' ')[0]}</span>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            if (item.isAction) {
              return (
                <motion.button
                  key="quick-action"
                  className="relative -mt-6"
                  onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div 
                    className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary shadow-lg glow-primary"
                    animate={{ rotate: isQuickMenuOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isQuickMenuOpen ? (
                      <X className="h-6 w-6 text-primary-foreground" />
                    ) : (
                      <Plus className="h-6 w-6 text-primary-foreground" />
                    )}
                  </motion.div>
                </motion.button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 transition-colors',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_8px_hsl(var(--primary))]')} />
                </motion.div>
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
