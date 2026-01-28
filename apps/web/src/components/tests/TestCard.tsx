import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { TestType, TEST_CONFIGS, TestStats } from "@/types";
import { cn } from "@/lib/utils";

interface TestCardProps {
  testType: TestType;
  stats?: TestStats;
  index?: number;
}

export function TestCard({ testType, stats, index = 0 }: TestCardProps) {
  const navigate = useNavigate();
  const config = TEST_CONFIGS[testType];

  const getTrendIcon = () => {
    if (!stats || stats.history.length < 2)
      return <Minus className="h-4 w-4 text-muted-foreground" />;

    const recent = stats.history[0]?.score ?? 0;
    const previous = stats.history[1]?.score ?? 0;

    if (config.higherIsBetter) {
      if (recent > previous)
        return <TrendingUp className="h-4 w-4 text-success" />;
      if (recent < previous)
        return <TrendingDown className="h-4 w-4 text-destructive" />;
    } else {
      if (recent < previous)
        return <TrendingUp className="h-4 w-4 text-success" />;
      if (recent > previous)
        return <TrendingDown className="h-4 w-4 text-destructive" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const handleClick = () => {
    navigate(`/tests/${testType}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3, type: "spring" }}
      whileHover={{
        y: -4,
        boxShadow: "0 20px 40px -10px hsl(var(--primary) / 0.2)",
      }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="group relative p-5 rounded-2xl bg-card border border-border transition-colors cursor-pointer hover:border-primary/50"
    >
      {/* Icon */}
      <motion.div
        className="flex h-14 w-14 items-center justify-center rounded-xl mb-4"
        style={{ backgroundColor: `${config.color}20` }}
        whileHover={{ scale: 1.15, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <span className="text-3xl">
          {config.icon === "Zap" && "⚡"}
          {config.icon === "Brain" && "🧠"}
          {config.icon === "Keyboard" && "⌨️"}
          {config.icon === "Grid3x3" && "🔲"}
        </span>
      </motion.div>

      {/* Name & Description */}
      <h3 className="font-bold text-foreground mb-1">{config.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
        {config.description}
      </p>

      {/* Stats */}
      {stats ? (
        <div className="space-y-2">
          {/* Personal Best */}
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold text-foreground">
              {stats.personalBest} {config.unit}
            </span>
          </div>

          {/* Last Score with Trend */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Last:</span>
              <span className="text-sm font-medium text-foreground">
                {stats.lastScore} {config.unit}
              </span>
              {getTrendIcon()}
            </div>
          </div>

          {/* Percentile Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Percentile</span>
              <span
                className={cn(
                  "font-medium",
                  stats.percentile >= 90
                    ? "text-yellow-500"
                    : stats.percentile >= 70
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                Top {100 - stats.percentile}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${stats.percentile}%` }}
                transition={{
                  delay: index * 0.1 + 0.3,
                  duration: 0.6,
                  ease: "easeOut",
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No attempts yet</div>
      )}
    </motion.div>
  );
}
