"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface CardData {
  id: number;
  title: string;
  description: string;
  domain: string;
  x: number;
  y: number;
}

interface DraggableCardProps {
  card: CardData;
  scale: number;
  pan: { x: number; y: number };
  onPositionChange: (id: number, x: number, y: number) => void;
}

export function DraggableCard({
  card,
  scale,
  pan,
  onPositionChange,
}: DraggableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const startDrag = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    setIsDragging(true);
    const worldX = (clientX - pan.x) / scale;
    const worldY = (clientY - pan.y) / scale;
    dragOffsetRef.current = { x: worldX - card.x, y: worldY - card.y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startDrag(e.clientX, e.clientY);
    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
  };

  const handleMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    const worldX = (clientX - pan.x) / scale;
    const worldY = (clientY - pan.y) / scale;
    const { x: dragOffsetX, y: dragOffsetY } = dragOffsetRef.current;
    const newX = worldX - dragOffsetX;
    const newY = worldY - dragOffsetY;

    const cardWidth = 280; // should match the visual card width
    const cardHeight = 200; // approximate card height used previously

    // Compute world-space bounds so after transform (scale + pan) the card stays in viewport
    const minXWorld = -pan.x / scale;
    const minYWorld = -pan.y / scale;
    const maxXWorld = Math.max(
      minXWorld,
      (window.innerWidth - cardWidth * scale - pan.x) / scale
    );
    const maxYWorld = Math.max(
      minYWorld,
      (window.innerHeight - cardHeight * scale - pan.y) / scale
    );

    const boundedX = Math.max(minXWorld, Math.min(newX, maxXWorld));
    const boundedY = Math.max(minYWorld, Math.min(newY, maxYWorld));

    onPositionChange(card.id, boundedX, boundedY);
    e.preventDefault();
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Add global pointer event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("pointermove", handleMove as any);
      document.addEventListener("pointerup", handleEnd as any);
      document.addEventListener("pointercancel", handleEnd as any);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("pointermove", handleMove as any);
      document.removeEventListener("pointerup", handleEnd as any);
      document.removeEventListener("pointercancel", handleEnd as any);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("pointermove", handleMove as any);
      document.removeEventListener("pointerup", handleEnd as any);
      document.removeEventListener("pointercancel", handleEnd as any);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      "Security & Compliance":
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700",
      "Billing & Pricing":
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700",
      Technology:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700",
      "Cloud Concepts":
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-700",
      Governance:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
      Compute:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
      Storage:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700",
      Database:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700",
      Networking:
        "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700",
      Monitoring:
        "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700",
    };
    return (
      colors[domain] ||
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-200 dark:border-gray-600"
    );
  };

  return (
    <Card
      ref={cardRef}
      className={`absolute w-72 cursor-grab shadow-lg transition-shadow hover:shadow-xl dark:shadow-gray-800 gap-2 py-3 px-0 ${
        isDragging
          ? "shadow-2xl scale-105 cursor-grabbing dark:shadow-gray-700"
          : ""
      } ${getDomainColor(card.domain)} border-2`}
      style={{
        left: card.x,
        top: card.y,
        zIndex: isDragging ? 1000 : 1,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
    >
      <CardHeader>
        <CardTitle className="text-lg font-bold leading-tight">
          {card.title}
        </CardTitle>
        <Badge variant="secondary" className="text-[10px] w-fit">
          {card.domain}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              u: (props) => <u {...props} />,
            }}
          >
            {card.description}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
