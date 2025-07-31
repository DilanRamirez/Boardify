import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchWithRetry } from "@/lib/utils";
import {
  CARDS_JSON_PATH,
  SAVE_DEBOUNCE_MS,
  STORAGE_KEY,
} from "@/lib/constants";

// Hook that manages card data, positions, and persistence
export function useCardLayout() {
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

  useEffect(() => {
    let cancelled = false;
    const doLoad = async () => {
      console.time("loadCards");
      setLoading(true);
      try {
        const cardsData = await fetchWithRetry<CardData[]>(CARDS_JSON_PATH);

        if (!Array.isArray(cardsData)) {
          throw new Error("cards.json did not return an array");
        }

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

        if (!cancelled) {
          setCards(merged);
          latestCardsRef.current = merged;

          const uniqueDomains = Array.from(
            new Set(cardsData.map((c) => c.domain)),
          );
          setDomains(uniqueDomains);
          setError(null);
        }
      } catch (err: any) {
        console.error("Error loading cards:", err);
        if (!cancelled) {
          setError(
            "Failed to load cards. Please ensure cards.json exists and has valid data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
        console.timeEnd("loadCards");
      }
    };

    void doLoad();
    return () => {
      cancelled = true;
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [getSavedPositions]);

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
      const cardsData = await fetchWithRetry<CardData[]>(CARDS_JSON_PATH);
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
