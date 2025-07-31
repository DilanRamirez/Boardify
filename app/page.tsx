"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { DraggableCard } from "@/components/draggable-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Download, ChevronDown, ChevronUp } from "lucide-react";
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
