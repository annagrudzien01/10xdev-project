/**
 * GameApp - Wrapper component for the game
 * Wraps GamePlayView with GameProvider
 */

import { GameProvider } from "@/lib/contexts/GameContext";
import GamePlayView from "./GamePlayView";

interface GameAppProps {
  profileId: string;
  profileName: string;
  initialLevel: number;
  initialScore: number;
}

export default function GameApp({ profileId, profileName, initialLevel, initialScore }: GameAppProps) {
  return (
    <GameProvider profileId={profileId} initialLevel={initialLevel} initialScore={initialScore}>
      <GamePlayView profileName={profileName} />
    </GameProvider>
  );
}
