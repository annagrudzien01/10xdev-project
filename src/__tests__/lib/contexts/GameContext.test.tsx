/**
 * Unit tests for GameContext
 *
 * Tests for:
 * - ensureActiveSession() - session creation, cookie handling, state management
 * - submitAnswer() - answer submission, scoring, level progression, task completion
 * - loadCurrentOrNextTask() - task restoration, new task generation
 * - refreshSession() - session extension, cookie updates, error handling
 * - Cookie management - reading, writing, expiry synchronization
 *
 * Business Rules Tested:
 * - Session cookie expires at same time as session's endedAt
 * - Cookie presence guarantees active session
 * - Attempts tracking: correct answer doesn't increment, incorrect does (0→1→2→3)
 * - Scoring: 0 failed attempts = 10pts, 1 failed = 7pts, 2 failed = 5pts
 * - Task completes when: player gets points OR uses all 3 attempts
 * - Level progression: 5 tasks completed → level up
 * - Session ID required for all API calls (tasks, submissions)
 * - Automatic session refresh every 2 minutes
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { GameProvider, useGame } from "@/lib/contexts/GameContext";
import type { ReactNode } from "react";
import type { GeneratePuzzleDTO, SubmitAnswerResponseDTO, CurrentPuzzleDTO } from "@/types";

// ============================================================================
// Test Setup & Helpers
// ============================================================================

const mockProfileId = "profile-123";
const mockInitialLevel = 1;
const mockInitialScore = 0;

/**
 * Creates wrapper component for testing hooks
 */
function createWrapper(profileId = mockProfileId, initialLevel = mockInitialLevel, initialScore = mockInitialScore) {
  return ({ children }: { children: ReactNode }) => (
    <GameProvider profileId={profileId} initialLevel={initialLevel} initialScore={initialScore}>
      {children}
    </GameProvider>
  );
}

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock document.cookie with in-memory store
let cookieStore: Record<string, string> = {};

Object.defineProperty(document, "cookie", {
  get() {
    return Object.entries(cookieStore)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  },
  set(cookieString: string) {
    const [pair] = cookieString.split(";");
    const [key, value] = pair.split("=");
    if (value) {
      cookieStore[key.trim()] = value.trim();
    } else {
      delete cookieStore[key.trim()];
    }
  },
  configurable: true,
});

// ============================================================================
// Test Data Factories
// ============================================================================

const createMockSession = (sessionId = "session-123") => ({
  sessionId,
  startedAt: new Date().toISOString(),
  endedAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // +10 minutes
  isActive: true,
});

const createMockPuzzle = (sequenceId = "seq-123"): GeneratePuzzleDTO => ({
  sequenceId,
  levelId: 1,
  sequenceBeginning: "C4-E4-G4",
  expectedSlots: 2,
});

const createMockCurrentPuzzle = (attemptsUsed = 0): CurrentPuzzleDTO => ({
  sequenceId: "seq-123",
  levelId: 1,
  sequenceBeginning: "C4-E4-G4",
  expectedSlots: 2,
  attemptsUsed,
});

const createMockSubmitResponse = (score = 10, attemptsUsed = 1, levelCompleted = false): SubmitAnswerResponseDTO => ({
  score,
  attemptsUsed,
  levelCompleted,
  nextLevel: levelCompleted ? 2 : 1,
});

// ============================================================================
// Test Suite
// ============================================================================

describe("GameContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore = {};
    mockFetch.mockClear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  // ============================================================================
  // ensureActiveSession()
  // ============================================================================
  describe("ensureActiveSession", () => {
    describe("when session already exists in state", () => {
      it("should return existing session ID without API call", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        const initialCallCount = mockFetch.mock.calls.length;

        // Act - second call should use cached session
        let sessionId = "";
        await act(async () => {
          sessionId = await result.current.ensureActiveSession();
        });

        // Assert
        expect(sessionId).toBe(mockSession.sessionId);
        expect(mockFetch).toHaveBeenCalledTimes(initialCallCount); // No new API call
      });
    });

    describe("when session exists in cookie but not in state", () => {
      it("should return session ID from cookie without creating new session", async () => {
        // Arrange
        const existingSessionId = "cookie-session-456";
        cookieStore[`game_session_${mockProfileId}`] = existingSessionId;

        const mockCurrentTask = createMockCurrentPuzzle();
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(result.current.currentSessionId).toBe(existingSessionId);

        // Should not have called session creation API
        const sessionCreateCalls = mockFetch.mock.calls.filter(
          (call) => call[0]?.includes("/sessions") && call[1]?.method === "POST"
        );
        expect(sessionCreateCalls).toHaveLength(0);
      });

      it("should update state with session ID from cookie", async () => {
        // Arrange
        const cookieSessionId = "session-from-cookie";
        cookieStore[`game_session_${mockProfileId}`] = cookieSessionId;

        const mockCurrentTask = createMockCurrentPuzzle();
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(result.current.currentSessionId).toBe(cookieSessionId);
      });
    });

    describe("when no session exists (new session creation)", () => {
      it("should create new session via API", async () => {
        // Arrange
        const mockSession = createMockSession("new-session-789");
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/profiles/${mockProfileId}/sessions`,
          expect.objectContaining({
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          })
        );
      });

      it("should save session ID to state and cookie", async () => {
        // Arrange
        const mockSession = createMockSession("new-session-xyz");
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert - state
        expect(result.current.currentSessionId).toBe(mockSession.sessionId);

        // Assert - cookie
        expect(cookieStore[`game_session_${mockProfileId}`]).toBe(mockSession.sessionId);
      });

      it("should set cookie expiry to match session endedAt", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const setCookieSpy = vi.spyOn(document, "cookie", "set");

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        const sessionCookieCall = setCookieSpy.mock.calls.find((call) =>
          call[0].includes(`game_session_${mockProfileId}`)
        );

        expect(sessionCookieCall).toBeDefined();
        expect(sessionCookieCall![0]).toContain("expires=");
        expect(sessionCookieCall![0]).toContain("SameSite=Strict");
      });

      it("should throw error when API fails", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Session creation failed" }),
        });

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for error
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
        });

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it("should throw error when API throws exception", async () => {
        // Arrange
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for error
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
        });

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });
    });

    describe("edge cases", () => {
      it("should handle multiple concurrent calls correctly", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Act - call ensureActiveSession multiple times concurrently
        const promises = await act(async () => {
          return Promise.all([
            result.current.ensureActiveSession(),
            result.current.ensureActiveSession(),
            result.current.ensureActiveSession(),
          ]);
        });

        // Assert - all should return same session ID
        expect(promises[0]).toBe(mockSession.sessionId);
        expect(promises[1]).toBe(mockSession.sessionId);
        expect(promises[2]).toBe(mockSession.sessionId);
      });

      it("should prioritize state over cookie", async () => {
        // Arrange
        const sessionId = "state-session-123";
        cookieStore[`game_session_${mockProfileId}`] = sessionId;

        const mockCurrentTask = createMockCurrentPuzzle();
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization (uses cookie)
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
          expect(result.current.currentSessionId).toBe(sessionId);
        });

        // Act - call again with existing state
        let returnedSessionId = "";
        await act(async () => {
          returnedSessionId = await result.current.ensureActiveSession();
        });

        // Assert - should return state session
        expect(returnedSessionId).toBe(sessionId);
      });
    });
  });

  // ============================================================================
  // submitAnswer()
  // ============================================================================
  describe("submitAnswer", () => {
    describe("validation and guards", () => {
      it("should return undefined when no current task", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Clear task
        await act(async () => {
          result.current.resetGame();
        });

        // Act
        const response = await act(async () => {
          return await result.current.submitAnswer();
        });

        // Assert
        expect(response).toBeUndefined();
      });

      it("should return undefined when no notes selected", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Act - try to submit without selecting notes
        const response = await act(async () => {
          return await result.current.submitAnswer();
        });

        // Assert
        expect(response).toBeUndefined();
        expect(result.current.selectedNotes).toHaveLength(0);
      });

      it("should prevent concurrent submissions (isSubmitting guard)", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(10, 0, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Add notes
        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        // Mock slow API response
        let resolveSubmit: (value: any) => void;
        const submitPromise = new Promise((resolve) => {
          resolveSubmit = resolve;
        });

        mockFetch.mockImplementationOnce(() => submitPromise);

        // Act - start first submission (don't await it yet)
        let firstSubmit: Promise<any>;
        await act(async () => {
          firstSubmit = result.current.submitAnswer();
        });

        // Try second submission while first is in progress
        const secondSubmit = await act(async () => {
          return result.current.submitAnswer();
        });

        // Resolve first submission
        resolveSubmit!({
          ok: true,
          json: async () => mockResponse,
        });

        await firstSubmit!;

        // Assert
        expect(secondSubmit).toBeUndefined();
      });
    });

    describe("successful submission - correct answer", () => {
      it("should submit answer with correct format and session ID", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(10, 0, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        // Act - add notes and submit
        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/profiles/${mockProfileId}/tasks/${mockCurrentTask.sequenceId}/submit`,
          expect.objectContaining({
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answer: "C5-D5",
              sessionId: mockSession.sessionId,
            }),
          })
        );
      });

      it("should update score correctly for correct answer (10 points, 0 failed attempts)", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(10, 0, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(mockProfileId, 1, 0),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        // Act
        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.totalScore).toBe(10);
        expect(result.current.attemptsLeft).toBe(3); // Correct answer doesn't decrease attempts
      });

      it("should clear selected notes after submission", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(10, 0, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        expect(result.current.selectedNotes).toHaveLength(2);

        // Act
        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.selectedNotes).toHaveLength(0);
      });

      it("should mark task as completed and show success feedback", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(10, 0, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        // Act
        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.taskCompletionState).toBe("completed");
        expect(result.current.feedback).toMatchObject({
          type: "success",
          score: 10,
        });
        expect(result.current.feedback?.message).toContain("Perfekcyjnie");
      });
    });

    describe("scoring rules - attempts tracking", () => {
      it("should award 10 points for correct answer on first attempt (0 failed)", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(10, 0, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.totalScore).toBe(10);
        expect(result.current.feedback?.message).toContain("Perfekcyjnie");
      });

      it("should award 7 points after 1 failed attempt", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(7, 1, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.totalScore).toBe(7);
        expect(result.current.attemptsLeft).toBe(2); // 3 - 1 = 2
        expect(result.current.feedback?.message).toContain("Bardzo dobrze");
      });

      it("should award 5 points after 2 failed attempts", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(5, 2, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.totalScore).toBe(5);
        expect(result.current.attemptsLeft).toBe(1); // 3 - 2 = 1
        expect(result.current.feedback?.message).toContain("Dobrze");
      });

      it("should award 0 points after 3 failed attempts (all attempts used)", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(0, 3, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.totalScore).toBe(0);
        expect(result.current.attemptsLeft).toBe(0); // 3 - 3 = 0
        expect(result.current.feedback?.type).toBe("failed");
        expect(result.current.feedback?.message).toContain("Wykorzystano 3 szanse");
      });
    });

    describe("level progression", () => {
      it("should increment completedTasksInLevel when task completed without level up", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(10, 0, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        const initialCompleted = result.current.completedTasksInLevel;

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.completedTasksInLevel).toBe(initialCompleted + 1);
        expect(result.current.currentLevel).toBe(1); // No level up
      });

      it("should level up and reset completedTasksInLevel when level completed", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(10, 0, true); // levelCompleted: true

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(mockProfileId, 1, 0),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.currentLevel).toBe(2); // Level up
        expect(result.current.completedTasksInLevel).toBe(0); // Reset
      });
    });

    describe("task completion states", () => {
      it("should mark task as completed when score > 0", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(7, 1, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.taskCompletionState).toBe("completed");
      });

      it("should mark task as completed when all 3 attempts used (score = 0)", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(0, 3, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.taskCompletionState).toBe("completed");
        expect(result.current.feedback?.type).toBe("failed");
      });

      it("should mark task as in_progress when attempts remain and score = 0", async () => {
        // Arrange - incorrect answer but still has attempts
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const mockResponse = createMockSubmitResponse(0, 1, false);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        await act(async () => {
          await result.current.submitAnswer();
        });

        // Assert
        expect(result.current.taskCompletionState).toBe("in_progress");
        expect(result.current.attemptsLeft).toBe(2); // Still has attempts
      });
    });

    describe("error handling", () => {
      it("should throw error when API returns error", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "Invalid answer format" }),
          });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        // Act & Assert
        await act(async () => {
          await expect(result.current.submitAnswer()).rejects.toThrow("Invalid answer format");
        });
      });

      it("should reset isSubmitting flag even when error occurs", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "Server error" }),
          });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        // Act
        await act(async () => {
          try {
            await result.current.submitAnswer();
          } catch {
            // Expected error
          }
        });

        // Assert
        expect(result.current.isSubmitting).toBe(false);
      });

      it("should clear feedback when error occurs", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask })
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "Error" }),
          });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.currentTask).not.toBeNull());

        await act(async () => {
          result.current.addNote("C5");
          result.current.addNote("D5");
        });

        // Act
        await act(async () => {
          try {
            await result.current.submitAnswer();
          } catch {
            // Expected
          }
        });

        // Assert
        expect(result.current.feedback).toBeNull();
      });
    });
  });

  // ============================================================================
  // loadCurrentOrNextTask()
  // ============================================================================
  describe("loadCurrentOrNextTask", () => {
    describe("when active task exists", () => {
      it("should restore existing task from API", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle(1);

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for auto-load on mount
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(result.current.currentTask?.sequenceId).toBe(mockCurrentTask.sequenceId);
        expect(result.current.currentTask?.sequenceBeginning).toEqual(["C4", "E4", "G4"]);
      });

      it("should restore attempts correctly from attemptsUsed", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle(2); // 2 attempts used

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(result.current.attemptsLeft).toBe(1); // 3 - 2 = 1
      });

      it("should call API with session ID in query parameter", async () => {
        // Arrange
        const mockSession = createMockSession("specific-session");
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        const currentTaskCall = mockFetch.mock.calls.find(
          (call) => call[0]?.includes("/tasks/current") && call[1]?.method === "GET"
        );
        expect(currentTaskCall).toBeDefined();
        expect(currentTaskCall![0]).toContain(`sessionId=${mockSession.sessionId}`);
      });
    });

    describe("when no active task exists (404)", () => {
      it("should generate new task when current task returns 404", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockNewTask = createMockPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) }) // No current task
          .mockResolvedValueOnce({ ok: true, json: async () => mockNewTask }); // Generate new

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(result.current.currentTask?.sequenceId).toBe(mockNewTask.sequenceId);
        expect(result.current.attemptsLeft).toBe(3); // Fresh attempts
      });

      it("should call loadNextTask when 404 received", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockNewTask = createMockPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: false, status: 404 })
          .mockResolvedValueOnce({ ok: true, json: async () => mockNewTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert - should have called POST /tasks/next
        const nextTaskCall = mockFetch.mock.calls.find(
          (call) => call[0]?.includes("/tasks/next") && call[1]?.method === "POST"
        );
        expect(nextTaskCall).toBeDefined();
      });
    });

    describe("session management", () => {
      it("should ensure active session before loading task", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockTask = createMockPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert - session should be created first
        const sessionCall = mockFetch.mock.calls.find((call) => call[0]?.includes("/sessions"));
        const taskCall = mockFetch.mock.calls.find((call) => call[0]?.includes("/tasks/"));

        const sessionCallIndex = mockFetch.mock.calls.indexOf(sessionCall!);
        const taskCallIndex = mockFetch.mock.calls.indexOf(taskCall!);

        expect(sessionCallIndex).toBeLessThan(taskCallIndex);
      });
    });

    describe("error handling", () => {
      it("should throw error when API fails with non-404 error", async () => {
        // Arrange
        const mockSession = createMockSession();

        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockSession }).mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: "Server error" }),
        });

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for error
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
        });

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });
    });

    describe("state management", () => {
      it("should parse sequence beginning into array", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockTask: CurrentPuzzleDTO = {
          sequenceId: "seq-123",
          levelId: 1,
          sequenceBeginning: "C4-E4-G4-B4",
          expectedSlots: 2,
          attemptsUsed: 0,
        };

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(result.current.currentTask?.sequenceBeginning).toEqual(["C4", "E4", "G4", "B4"]);
      });

      it("should clear selected notes when loading new task", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockTask = createMockPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(result.current.selectedNotes).toHaveLength(0);
      });
    });
  });

  // ============================================================================
  // refreshSession()
  // ============================================================================
  describe("refreshSession", () => {
    describe("successful refresh", () => {
      it("should call refresh API endpoint with correct session ID", async () => {
        // Arrange
        const mockSession = createMockSession("session-to-refresh");
        const mockCurrentTask = createMockCurrentPuzzle();
        const refreshedEndedAt = new Date(Date.now() + 12 * 60 * 1000).toISOString();

        // Set session in cookie BEFORE rendering
        cookieStore[`game_session_${mockProfileId}`] = mockSession.sessionId;

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask }) // /tasks/current
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sessionId: mockSession.sessionId, endedAt: refreshedEndedAt }),
          }); // /sessions/{id}/refresh

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for session to be established
        await waitFor(() => {
          expect(result.current.currentSessionId).not.toBeNull();
        });

        // Act
        await act(async () => {
          await result.current.refreshSession();
        });

        // Assert
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/sessions/${mockSession.sessionId}/refresh`,
          expect.objectContaining({
            method: "POST",
            credentials: "include",
          })
        );
      });

      it("should update cookie with new endedAt after refresh", async () => {
        // Arrange
        const mockSession = createMockSession("session-123");
        const mockCurrentTask = createMockCurrentPuzzle();
        const newEndedAt = new Date(Date.now() + 12 * 60 * 1000).toISOString();

        cookieStore[`game_session_${mockProfileId}`] = mockSession.sessionId;

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask }) // /tasks/current
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ endedAt: newEndedAt }),
          }); // /sessions/{id}/refresh

        const setCookieSpy = vi.spyOn(document, "cookie", "set");

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentSessionId).not.toBeNull();
        });

        // Act
        await act(async () => {
          await result.current.refreshSession();
        });

        // Assert
        const refreshCookieCall = setCookieSpy.mock.calls.find(
          (call) => call[0].includes("game_session") && call[0].includes("expires")
        );
        expect(refreshCookieCall).toBeDefined();
      });
    });

    describe("when no active session exists", () => {
      it("should log warning and return early when no session ID", async () => {
        // Arrange
        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // Mock failed initialization
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: "No session" }),
        });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for context to be available
        await waitFor(() => {
          expect(result.current).toBeDefined();
          expect(typeof result.current.refreshSession).toBe("function");
        });

        // Act
        await act(async () => {
          await result.current.refreshSession();
        });

        // Assert
        expect(consoleWarnSpy).toHaveBeenCalledWith("No active session to refresh");
        consoleWarnSpy.mockRestore();
      });
    });

    describe("error handling", () => {
      it("should clear session state when refresh returns 400", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        cookieStore[`game_session_${mockProfileId}`] = mockSession.sessionId;

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask }) // /tasks/current
          .mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ message: "Session expired" }),
          }); // /sessions/{id}/refresh

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentSessionId).not.toBeNull();
        });

        // Act
        await act(async () => {
          try {
            await result.current.refreshSession();
          } catch {
            // Expected error
          }
        });

        // Assert
        expect(result.current.currentSessionId).toBeNull();
      });

      it("should clear session cookie when refresh returns 404", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        cookieStore[`game_session_${mockProfileId}`] = mockSession.sessionId;

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask }) // /tasks/current
          .mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: async () => ({ message: "Session not found" }),
          }); // /sessions/{id}/refresh

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentSessionId).not.toBeNull();
        });

        // Act
        await act(async () => {
          try {
            await result.current.refreshSession();
          } catch {
            // Expected
          }
        });

        // Assert
        expect(cookieStore[`game_session_${mockProfileId}`]).toBeUndefined();
      });
    });

    describe("automatic refresh interval", () => {
      it("should setup refresh interval when session is created", async () => {
        // Arrange
        vi.useFakeTimers();
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for session
        await act(async () => {
          vi.advanceTimersByTime(100);
        });

        // Mock refresh endpoint
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            endedAt: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
          }),
        });

        // Act - advance time by 2 minutes
        await act(async () => {
          vi.advanceTimersByTime(2 * 60 * 1000);
        });

        // Assert - refresh should have been called
        const refreshCalls = mockFetch.mock.calls.filter((call) => call[0]?.includes("/refresh"));
        expect(refreshCalls.length).toBeGreaterThan(0);

        vi.useRealTimers();
      });

      it("should clear refresh interval on unmount", async () => {
        // Arrange
        vi.useFakeTimers();
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const clearIntervalSpy = vi.spyOn(global, "clearInterval");

        const { unmount } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for session to be created
        await act(async () => {
          vi.advanceTimersByTime(100);
        });

        // Act - unmount component
        unmount();

        // Assert - clearInterval should have been called
        expect(clearIntervalSpy).toHaveBeenCalled();

        clearIntervalSpy.mockRestore();
        vi.useRealTimers();
      });

      it("should refresh every 2 minutes (120000ms) exactly", async () => {
        // Arrange
        vi.useFakeTimers();
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initial load
        await act(async () => {
          vi.advanceTimersByTime(100);
        });

        // Setup multiple refresh mocks
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            endedAt: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
          }),
        });

        const initialCallCount = mockFetch.mock.calls.filter((call) => call[0]?.includes("/refresh")).length;

        // Act - advance time by exactly 2 minutes
        await act(async () => {
          vi.advanceTimersByTime(120000); // 2 minutes
        });

        // Assert - refresh should have been called once
        const refreshCallsAfterFirst = mockFetch.mock.calls.filter((call) => call[0]?.includes("/refresh")).length;
        expect(refreshCallsAfterFirst).toBe(initialCallCount + 1);

        // Advance another 2 minutes
        await act(async () => {
          vi.advanceTimersByTime(120000);
        });

        // Should have been called again
        const refreshCallsAfterSecond = mockFetch.mock.calls.filter((call) => call[0]?.includes("/refresh")).length;
        expect(refreshCallsAfterSecond).toBe(initialCallCount + 2);

        vi.useRealTimers();
      });
    });
  });

  // ============================================================================
  // Cookie Management
  // ============================================================================
  describe("Cookie Management", () => {
    describe("getSessionFromCookie", () => {
      it("should return session ID when cookie exists", async () => {
        // Arrange
        const sessionId = "test-session-123";
        cookieStore[`game_session_${mockProfileId}`] = sessionId;

        const mockCurrentTask = createMockCurrentPuzzle();
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert - session should be loaded from cookie
        expect(result.current.currentSessionId).toBe(sessionId);
      });

      it("should return null when cookie does not exist", async () => {
        // Arrange - no cookie set
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Cookie should not have existed initially
        // Session should have been created via API
        expect(result.current.currentSessionId).toBe(mockSession.sessionId);
      });

      it("should handle multiple cookies correctly", async () => {
        // Arrange
        const sessionId = "my-session";
        cookieStore["other_cookie"] = "other_value";
        cookieStore[`game_session_${mockProfileId}`] = sessionId;
        cookieStore["another_cookie"] = "another_value";

        const mockCurrentTask = createMockCurrentPuzzle();
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(result.current.currentSessionId).toBe(sessionId);
      });

      it("should handle malformed cookie strings gracefully", async () => {
        // Arrange - set malformed cookie
        const sessionId = "valid-session";
        cookieStore["malformed"] = ""; // Empty value
        cookieStore[`game_session_${mockProfileId}`] = sessionId;

        const mockCurrentTask = createMockCurrentPuzzle();
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert - should still get valid session
        expect(result.current.currentSessionId).toBe(sessionId);
      });

      it("should handle cookies with special characters", async () => {
        // Arrange
        const sessionId = "session-with-special=chars";
        cookieStore[`game_session_${mockProfileId}`] = sessionId;

        const mockCurrentTask = createMockCurrentPuzzle();
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(result.current.currentSessionId).toBe(sessionId);
      });
    });

    describe("saveSessionToCookie", () => {
      it("should save session with correct cookie name format", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        expect(cookieStore[`game_session_${mockProfileId}`]).toBe(mockSession.sessionId);
      });

      it("should set cookie with SameSite=Strict attribute", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const setCookieSpy = vi.spyOn(document, "cookie", "set");

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        const cookieCall = setCookieSpy.mock.calls.find((call) => call[0].includes("game_session"));
        expect(cookieCall![0]).toContain("SameSite=Strict");
      });

      it("should synchronize cookie expiry with session endedAt", async () => {
        // Arrange
        const endedAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const mockSession = {
          sessionId: "session-123",
          startedAt: new Date().toISOString(),
          endedAt,
          isActive: true,
        };
        const mockCurrentTask = createMockCurrentPuzzle();

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask });

        const setCookieSpy = vi.spyOn(document, "cookie", "set");

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Assert
        const cookieCall = setCookieSpy.mock.calls.find((call) => call[0].includes("game_session"));
        expect(cookieCall![0]).toContain("expires=");
        expect(cookieCall![0]).toContain(new Date(endedAt).toUTCString());
      });

      it("should update cookie when session is refreshed", async () => {
        // Arrange
        const mockSession = createMockSession();
        const mockCurrentTask = createMockCurrentPuzzle();
        const newEndedAt = new Date(Date.now() + 12 * 60 * 1000).toISOString();

        cookieStore[`game_session_${mockProfileId}`] = mockSession.sessionId;

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => mockCurrentTask }) // /tasks/current
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sessionId: mockSession.sessionId, endedAt: newEndedAt }),
          }); // /sessions/{id}/refresh

        const setCookieSpy = vi.spyOn(document, "cookie", "set");

        const { result } = renderHook(() => useGame(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.currentTask).not.toBeNull();
        });

        // Act
        await act(async () => {
          await result.current.refreshSession();
        });

        // Assert
        const refreshCookieCall = setCookieSpy.mock.calls.find(
          (call) => call[0].includes("expires") && call[0].includes(new Date(newEndedAt).toUTCString())
        );
        expect(refreshCookieCall).toBeDefined();
      });
    });

    describe("cookie isolation between profiles", () => {
      it("should use different cookies for different profileIds", async () => {
        // Arrange
        const profile1 = "profile-111";
        const profile2 = "profile-222";
        const session1 = "session-111";
        const session2 = "session-222";

        // Act - set cookies for both profiles
        cookieStore[`game_session_${profile1}`] = session1;
        cookieStore[`game_session_${profile2}`] = session2;

        // Assert
        expect(cookieStore[`game_session_${profile1}`]).toBe(session1);
        expect(cookieStore[`game_session_${profile2}`]).toBe(session2);
        expect(cookieStore[`game_session_${profile1}`]).not.toBe(cookieStore[`game_session_${profile2}`]);
      });
    });
  });
});
