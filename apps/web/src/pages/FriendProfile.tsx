import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, UserMinus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { mockFriends, mockFriendStats } from "@/lib/mockFriends";
import { TEST_CONFIGS } from "@/types";

export default function FriendProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const friend = mockFriends.find((f) => f.id === id);
  const stats = id ? mockFriendStats[id] : undefined;

  if (!friend) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">
            Användaren hittades inte eller är inte din vän
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/friends")}
          >
            Tillbaka till vänner
          </Button>
        </div>
      </AppLayout>
    );
  }

  const getStatusColor = () => {
    switch (friend.status) {
      case "online":
        return "bg-green-500";
      case "playing":
        return "bg-primary";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusText = () => {
    switch (friend.status) {
      case "online":
        return "Online";
      case "playing":
        return `Spelar ${friend.currentGame}`;
      default:
        return "Offline";
    }
  };

  return (
    <AppLayout>
      <div className="p-4 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Profil</h1>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card border border-border mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <img
                src={friend.avatar}
                alt={friend.userName}
                className="w-20 h-20 rounded-full border-4 border-primary/30"
              />
              <div
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card ${getStatusColor()}`}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {friend.userName}
              </h2>
              <p className="text-muted-foreground">@{friend.userName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {getStatusText()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => navigate("/friends")}
            >
              <MessageCircle className="h-4 w-4" />
              Skicka meddelande
            </Button>
            <Button variant="outline" size="icon">
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-bold text-foreground mb-3">Resultat</h3>
          {stats && stats.length > 0 ? (
            <div className="space-y-3">
              {stats.map((stat, index) => {
                const config = TEST_CONFIGS[stat.testType];
                return (
                  <motion.div
                    key={stat.testType}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <span className="text-xl">
                            {config.icon === "Zap" && "⚡"}
                            {config.icon === "Brain" && "🧠"}
                            {config.icon === "Keyboard" && "⌨️"}
                            {config.icon === "Grid3x3" && "🔲"}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {config.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stat.totalAttempts} försök
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground text-lg">
                          {stat.personalBest} {config.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">Bästa</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Inga resultat ännu</p>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
