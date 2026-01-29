import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Friend } from "@/types/friends";
import { TestType, TEST_CONFIGS } from "@/types";
import { mockFriends } from "@/lib/mockFriends";

interface ShareScoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  testType: TestType;
  score: number;
}

export function ShareScoreSheet({
  isOpen,
  onClose,
  testType,
  score,
}: ShareScoreSheetProps) {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const config = TEST_CONFIGS[testType];

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
  };

  const handleShare = () => {
    // In a real app, this would send the score to selected friends
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSelectedFriends([]);
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    setSelectedFriends([]);
    setSent(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-foreground">Dela resultat</SheetTitle>
        </SheetHeader>

        {/* Score Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-primary/10 border border-primary/30 mb-6"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${config.color}30` }}
            >
              <span className="text-2xl">
                {config.icon === "Zap" && "⚡"}
                {config.icon === "Brain" && "🧠"}
                {config.icon === "Keyboard" && "⌨️"}
                {config.icon === "Grid3x3" && "🔲"}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{config.name}</p>
              <p className="text-2xl font-bold text-primary">
                {score} {config.unit}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Friends List */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-3">
            Välj vänner att dela med
          </p>
          <div className="space-y-2 max-h-[30vh] overflow-y-auto">
            {mockFriends.map((friend, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleFriend(friend.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selectedFriends.includes(friend.id)
                    ? "bg-primary/20 border border-primary"
                    : "bg-card border border-border hover:border-primary/50"
                }`}
              >
                <img
                  src={friend.avatar}
                  alt={friend.displayName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {friend.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{friend.username}
                  </p>
                </div>
                {selectedFriends.includes(friend.id) && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <Button
          className="w-full gap-2"
          disabled={selectedFriends.length === 0 || sent}
          onClick={handleShare}
        >
          {sent ? (
            <>
              <Check className="h-4 w-4" />
              Skickat!
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Dela med{" "}
              {selectedFriends.length > 0
                ? `${selectedFriends.length} vänner`
                : "vänner"}
            </>
          )}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
