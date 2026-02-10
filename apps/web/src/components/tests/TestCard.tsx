import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { TestType, TEST_CONFIGS } from "@/types";

interface TestCardProps {
  testType: TestType;
  index?: number;
}

export function TestCard({ testType, index = 0 }: TestCardProps) {
  const navigate = useNavigate();
  const config = TEST_CONFIGS[testType];

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

      <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary">
        <Play className="h-4 w-4" />
        Start test
      </div>
    </motion.div>
  );
}
