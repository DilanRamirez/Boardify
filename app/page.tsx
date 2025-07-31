"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DraggableCard } from "@/components/draggable-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Download, ChevronDown, ChevronUp } from "lucide-react";
import React from "react";

// ---------- Types ----------
interface CardData {
  id: number;
  title: string;
  description: string;
  domain: string;
  x: number;
  y: number;
}

interface Position {
  x: number;
  y: number;
}

interface DomainStat {
  name: string;
  count: number;
}

// ---------- Constants / Config ----------
const STORAGE_KEY = "cardPositions";
const FETCH_RETRY_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 500; // exponential backoff base
const SAVE_DEBOUNCE_MS = 300;

// ---------- Utility Functions ----------
async function fetchWithRetry<T = any>(
  url: string,
  attempts = FETCH_RETRY_ATTEMPTS,
  backoffMs = INITIAL_BACKOFF_MS,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      // exponential backoff before next try, but don't wait after last attempt
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

// Hook that manages card data, positions, and persistence
function useCardLayout() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to hold latest cards for debounced save
  const latestCardsRef = useRef<CardData[]>([]);
  const saveTimeoutRef = useRef<number | null>(null);

  // Load from localStorage safely
  const getSavedPositions = useCallback((): Record<number, Position> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null)
        return {} as Record<number, Position>;
      return parsed;
    } catch {
      console.warn("Failed to parse saved positions from localStorage");
      return {} as Record<number, Position>;
    }
  }, []);

  // Persist positions with debounce
  const scheduleSavePositions = useCallback((cardsToSave: CardData[]) => {
    latestCardsRef.current = cardsToSave;
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        const positions = latestCardsRef.current.reduce(
          (acc, card) => {
            acc[card.id] = { x: card.x, y: card.y };
            return acc;
          },
          {} as Record<number, Position>,
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      } catch (e) {
        console.warn("Failed to save positions to localStorage", e);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const loadCards = useCallback(async () => {
    console.time("loadCards");
    setLoading(true);
    try {
      const cardsData = await fetchWithRetry<CardData[]>("/cards.json");

      if (!Array.isArray(cardsData)) {
        throw new Error("cards.json did not return an array");
      }

      // Basic validation: ensure required fields exist on first card (could be expanded)
      if (cardsData.length > 0) {
        const sample = cardsData[0] as Partial<CardData>;
        if (
          typeof sample.id !== "number" ||
          typeof sample.title !== "string" ||
          typeof sample.domain !== "string"
        ) {
          throw new Error("cards.json has unexpected shape");
        }
      }

      const savedPositions = getSavedPositions();

      const merged = cardsData.map((card) => ({
        ...card,
        x: savedPositions[card.id]?.x ?? card.x,
        y: savedPositions[card.id]?.y ?? card.y,
      }));

      setCards(merged);
      latestCardsRef.current = merged;

      const uniqueDomains = Array.from(new Set(cardsData.map((c) => c.domain)));
      setDomains(uniqueDomains);
      setError(null);
    } catch (err: any) {
      console.error("Error loading cards:", err);
      setError(
        "Failed to load cards. Please ensure cards.json exists and has valid data.",
      );
    } finally {
      setLoading(false);
      console.timeEnd("loadCards");
    }
  }, [getSavedPositions]);

  // Initial load
  useEffect(() => {
    void loadCards();
    // cleanup on unmount: flush pending save
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadCards]);

  const handlePositionChange = useCallback(
    (id: number, x: number, y: number) => {
      setCards((prev) => {
        const updated = prev.map((card) =>
          card.id === id ? { ...card, x, y } : card,
        );
        scheduleSavePositions(updated);
        return updated;
      });
    },
    [scheduleSavePositions],
  );

  const resetPositions = useCallback(async () => {
    try {
      const cardsData = await fetchWithRetry<CardData[]>("/cards.json");
      if (!Array.isArray(cardsData)) {
        throw new Error("cards.json did not return an array");
      }
      setCards(cardsData);
      latestCardsRef.current = cardsData;
      localStorage.removeItem(STORAGE_KEY);
      setError(null);
    } catch (err) {
      console.error("Failed to reset positions:", err);
      setError("Unable to reset positions at this time.");
    }
  }, []);

  const exportLayout = useCallback(() => {
    try {
      const layout = cards.map((card) => ({
        id: card.id,
        title: card.title,
        x: card.x,
        y: card.y,
      }));
      const dataStr = JSON.stringify(layout, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cardboard-layout.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export layout failed:", err);
      setError("Failed to export layout.");
    }
  }, [cards]);

  const domainStats: DomainStat[] = useMemo(() => {
    if (!Array.isArray(domains) || !Array.isArray(cards)) return [];
    return domains.map((domain) => ({
      name: domain,
      count: cards.filter((card) => card.domain === domain).length,
    }));
  }, [domains, cards]);

  return {
    cards,
    domains,
    loading,
    error,
    domainStats,
    handlePositionChange,
    resetPositions,
    exportLayout,
  } as const;
}

// ---------- Presentational / Memoized Subcomponents ----------

const LoadingView = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center" data-cy="loading-state">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 dark:border-amber-400 mx-auto mb-4"></div>
      <p className="text-amber-800 dark:text-amber-200">
        Loading your Boardify...
      </p>
    </div>
  </div>
);

const ErrorView: React.FC<{ message: string; onRetry: () => void }> =
  React.memo(({ message, onRetry }) => (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md" data-cy="error-state">
        <p className="text-red-800 dark:text-red-200 mb-4">{message}</p>
        <Button onClick={onRetry} data-cy="retry-button">
          Try Again
        </Button>
      </div>
    </div>
  ));

ErrorView.displayName = "ErrorView";

const DomainBadgeList: React.FC<{ stats: DomainStat[] }> = React.memo(
  ({ stats }) => (
    <div
      className="flex items-center gap-2 mt-3 mb-3"
      aria-label="domain summary"
    >
      {stats.map(({ name, count }) => (
        <Badge
          key={name}
          variant="secondary"
          className="text-xs"
          data-cy={`badge-${name}`}
        >
          {name} ({count})
        </Badge>
      ))}
    </div>
  ),
);
DomainBadgeList.displayName = "DomainBadgeList";

const LayoutControls: React.FC<{
  isCollapsed: boolean;
  toggleCollapse: () => void;
  cardCount: number;
  domainStats: DomainStat[];
  onReset: () => void;
  onExport: () => void;
}> = React.memo(
  ({
    isCollapsed,
    toggleCollapse,
    cardCount,
    domainStats,
    onReset,
    onExport,
  }) => (
    <div className="absolute top-4 left-4 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border dark:border-gray-700">
      <div className="p-3">
        <div className="flex items-center gap-3">
          <button
            aria-expanded={!isCollapsed}
            aria-label="Toggle header"
            onClick={toggleCollapse}
            className="flex items-center gap-3 bg-transparent p-0"
            data-cy="header-toggle"
            style={{ border: "none", background: "none" }}
          >
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              Boardify
            </h1>
            <Badge
              variant="outline"
              className="text-xs"
              data-cy="card-count-badge"
            >
              {cardCount} cards
            </Badge>
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {!isCollapsed && (
          <>
            <DomainBadgeList stats={domainStats} />

            <div className="flex gap-2" data-cy="control-buttons">
              <Button
                size="sm"
                variant="outline"
                onClick={onReset}
                className="text-xs bg-transparent"
                data-cy="reset-button"
              >
                <RotateCcw className="w-3 h-3 mr-1" aria-hidden />
                Reset
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onExport}
                className="text-xs bg-transparent"
                data-cy="export-button"
              >
                <Download className="w-3 h-3 mr-1" aria-hidden />
                Export
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  ),
);
LayoutControls.displayName = "LayoutControls";

// ---------- Main Component ----------
export default function DigitalCardboard() {
  const {
    cards,
    domainStats,
    loading,
    error,
    handlePositionChange,
    resetPositions,
    exportLayout,
  } = useCardLayout();

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const toggleHeader = useCallback(
    () => setIsHeaderCollapsed((prev) => !prev),
    [],
  );

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={resetPositions} />;

  return (
    <div
      className="relative w-screen h-screen bg-white dark:bg-gray-900 overflow-hidden"
      data-cy="digital-cardboard-root"
    >
      <LayoutControls
        isCollapsed={isHeaderCollapsed}
        toggleCollapse={toggleHeader}
        cardCount={cards.length}
        domainStats={domainStats}
        onReset={resetPositions}
        onExport={exportLayout}
      />

      {cards.map((card) => (
        <DraggableCard
          key={card.id}
          card={card}
          onPositionChange={handlePositionChange}
        />
      ))}

      <div
        className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
}
