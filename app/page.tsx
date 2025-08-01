"use client";

import { useState, useCallback } from "react";
import { DraggableCard } from "@/components/draggable-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
} from "lucide-react";
import React from "react";
import { useCardLayout } from "@/hooks/use-card-layout";

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
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  currentScale: number;
  isMovementLocked: boolean;
  toggleMovementLock: () => void;
}> = React.memo(
  ({
    isCollapsed,
    toggleCollapse,
    cardCount,
    domainStats,
    onResetZoom,
    onZoomIn,
    onZoomOut,
    currentScale,
    isMovementLocked,
    toggleMovementLock,
  }) => (
    <div className="absolute top-4 right-4 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border dark:border-gray-700">
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
          {!isCollapsed && (
            <>
              <div className="flex gap-2" data-cy="control-buttons">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onZoomOut}
                    className="text-xs bg-transparent"
                    data-cy="zoom-out-button"
                  >
                    <ZoomOut className="w-3 h-3 mr-1" aria-hidden />-
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onZoomIn}
                    className="text-xs bg-transparent"
                    data-cy="zoom-in-button"
                  >
                    <ZoomIn className="w-3 h-3 mr-1" aria-hidden />+
                  </Button>
                  <span className="text-xs ml-1">
                    {Math.round(currentScale * 100)}%
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onResetZoom}
                  className="text-xs bg-transparent"
                  data-cy="reset-zoom-button"
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleMovementLock}
                  className={`text-xs bg-transparent flex items-center gap-1 ${
                    isMovementLocked ? "text-red-500" : "text-green-500"
                  }`}
                  data-cy="lock-toggle-button"
                  aria-pressed={isMovementLocked}
                  aria-label={
                    isMovementLocked
                      ? "Unlock card movement"
                      : "Lock card movement"
                  }
                >
                  {isMovementLocked ? (
                    <Lock className="w-3 h-3 font-bold" aria-hidden />
                  ) : (
                    <Unlock className="w-3 h-3 font-bold" aria-hidden />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
        {!isCollapsed && (
          <>
            <DomainBadgeList stats={domainStats} />
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

  const [showStaleBanner, setShowStaleBanner] = useState(false);

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const toggleHeader = useCallback(
    () => setIsHeaderCollapsed((prev) => !prev),
    [],
  );

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isMovementLocked, setIsMovementLocked] = useState(false);
  const toggleMovementLock = useCallback(
    () => setIsMovementLocked((prev) => !prev),
    [],
  );
  const saveViewTimeoutRef = React.useRef<number | null>(null);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const MIN_SCALE = 0.2;
  const MAX_SCALE = 3;
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("boardify_view");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.scale === "number") {
          setScale(clamp(parsed.scale, MIN_SCALE, MAX_SCALE));
        }
        if (
          parsed.pan &&
          typeof parsed.pan.x === "number" &&
          typeof parsed.pan.y === "number"
        ) {
          setPan(parsed.pan);
        }
        if (typeof parsed.movementLocked === "boolean") {
          setIsMovementLocked(parsed.movementLocked);
        }
      }
    } catch {
      // ignore malformed or unavailable storage
    }
  }, []);

  React.useEffect(() => {
    if (saveViewTimeoutRef.current) {
      window.clearTimeout(saveViewTimeoutRef.current);
    }
    saveViewTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          "boardify_view",
          JSON.stringify({ scale, pan, movementLocked: isMovementLocked }),
        );
      } catch {
        // ignore quota errors
      }
    }, 200);
    return () => {
      if (saveViewTimeoutRef.current) {
        window.clearTimeout(saveViewTimeoutRef.current);
      }
    };
  }, [scale, pan, isMovementLocked]);

  const zoomBy = (factor: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newScaleUnclamped = clamp(scale * factor, MIN_SCALE, MAX_SCALE);
    const worldX = (centerX - pan.x) / scale;
    const worldY = (centerY - pan.y) / scale;
    const newPanX = centerX - worldX * newScaleUnclamped;
    const newPanY = centerY - worldY * newScaleUnclamped;
    setScale(newScaleUnclamped);
    setPan({ x: newPanX, y: newPanY });
  };
  const zoomIn = () => zoomBy(1.1);
  const zoomOut = () => zoomBy(1 / 1.1);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const scaleFactor = Math.exp(-e.deltaY * 0.002);
      const newScaleUnclamped = clamp(
        scale * scaleFactor,
        MIN_SCALE,
        MAX_SCALE,
      );
      const worldX = (offsetX - pan.x) / scale;
      const worldY = (offsetY - pan.y) / scale;
      const newPanX = offsetX - worldX * newScaleUnclamped;
      const newPanY = offsetY - worldY * newScaleUnclamped;
      setScale(newScaleUnclamped);
      setPan({ x: newPanX, y: newPanY });
    } else if (e.altKey) {
      e.preventDefault();
      setPan((p) => ({ x: p.x - e.deltaY, y: p.y }));
    }
  };

  const resetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const hardRefresh = async () => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      } catch {
        // ignore
      }
    }
    // Force reload to bypass any stale caches
    window.location.reload();
  };

  React.useEffect(() => {
    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      let msg = "";
      if (event instanceof ErrorEvent) {
        msg = event.error?.message || event.message || "";
      } else if (event instanceof PromiseRejectionEvent) {
        const reason = event.reason;
        if (typeof reason === "string") {
          msg = reason;
        } else if (reason && typeof reason === "object") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          msg = (reason as any).message || "";
        }
      }
      if (
        msg.includes("Loading chunk") ||
        msg.includes("chunk failed") ||
        msg.includes("dynamically imported module")
      ) {
        setShowStaleBanner(true);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener("error", handleError as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener("unhandledrejection", handleError as any);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.removeEventListener("error", handleError as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.removeEventListener("unhandledrejection", handleError as any);
    };
  }, []);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={resetPositions} />;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-screen h-screen bg-white dark:bg-gray-900 overflow-hidden"
      data-cy="digital-cardboard-root"
    >
      {showStaleBanner && (
        <div
          className="fixed top-0 inset-x-0 bg-yellow-500 text-black flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2 z-50 shadow"
          role="alert"
          data-cy="stale-banner"
        >
          <div className="text-sm font-medium">
            New version available—please hard refresh.
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={hardRefresh}
              className="text-xs min-w-[80px]"
            >
              Hard Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStaleBanner(false)}
              className="text-xs min-w-[80px]"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
      <LayoutControls
        isCollapsed={isHeaderCollapsed}
        toggleCollapse={toggleHeader}
        cardCount={cards.length}
        domainStats={domainStats}
        onReset={resetPositions}
        onExport={exportLayout}
        onResetZoom={resetZoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        currentScale={scale}
        isMovementLocked={isMovementLocked}
        toggleMovementLock={toggleMovementLock}
      />
      <div
        className="absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCI+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjEuNSIgZmlsbD0icmdiYSgwLDAsMCwwLjQpIi8+PC9zdmc+")`,
          backgroundSize: "15px 15px",
          backgroundPosition: "center",
        }}
      />
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          width: `${100 / scale}vw`,
          height: `${100 / scale}vh`,
        }}
      >
        {cards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            onPositionChange={
              isMovementLocked ? () => {} : handlePositionChange
            }
            scale={scale}
            pan={pan}
            isDraggable={!isMovementLocked}
          />
        ))}
      </div>
    </div>
  );
}
