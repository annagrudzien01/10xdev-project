/**
 * GameHeader Component
 *
 * Displays game status information: level, score, attempts
 */

import { memo } from "react";

interface GameHeaderProps {
  /** Current level (1-20) */
  level: number;
  /** Total accumulated score */
  score: number;
  /** Attempts remaining for current task (1-3) */
  attemptsLeft: number;
  /** Profile name */
  profileName?: string;
  /** Demo mode - hides attempts indicator */
  demoMode?: boolean;
}

function GameHeaderComponent({ level, score, attemptsLeft, profileName, demoMode = false }: GameHeaderProps) {
  return (
    <div className="w-full bg-white shadow-md rounded-lg p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Profile info */}
        {profileName && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {profileName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-gray-800">{profileName}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 md:gap-6">
          {/* Level */}
          <div className="flex flex-col items-center">
            <span className="text-xs md:text-sm text-gray-500 uppercase">Poziom</span>
            <span className="text-lg md:text-xl font-bold text-gray-800">{level}</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center">
            <span className="text-xs md:text-sm text-gray-500 uppercase">Punkty</span>
            <span className="text-lg md:text-xl font-bold text-blue-600">{score}</span>
          </div>

          {/* Attempts */}
          {!demoMode && (
            <div className="flex flex-col items-center">
              <span className="text-xs md:text-sm text-gray-500 uppercase">Próby</span>
              <div className="flex gap-1">
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < attemptsLeft ? "bg-green-500" : "bg-gray-300"}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Memoize component for performance
export const GameHeader = memo(GameHeaderComponent);
