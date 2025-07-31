"use client";

import React from "react";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  onPositionChange: (id: number, x: number, y: number) => void;
}

export function DraggableCard({ card, onPositionChange }: DraggableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const startDrag = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    setIsDragging(true);
    const rect = cardRef.current.getBoundingClientRect();
    setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    let clientX: number;
    let clientY: number;
    if (e instanceof TouchEvent) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;

    // Ensure card stays within viewport bounds
    const maxX = window.innerWidth - 280; // Card width
    const maxY = window.innerHeight - 200; // Approximate card height

    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));

    onPositionChange(card.id, boundedX, boundedY);
    e.preventDefault();
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Add global mouse and touch event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMove as any);
      document.addEventListener("mouseup", handleEnd as any);
      document.addEventListener("touchmove", handleMove as any, {
        passive: false,
      });
      document.addEventListener("touchend", handleEnd as any);
      document.addEventListener("touchcancel", handleEnd as any);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMove as any);
      document.removeEventListener("mouseup", handleEnd as any);
      document.removeEventListener("touchmove", handleMove as any);
      document.removeEventListener("touchend", handleEnd as any);
      document.removeEventListener("touchcancel", handleEnd as any);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMove as any);
      document.removeEventListener("mouseup", handleEnd as any);
      document.removeEventListener("touchmove", handleMove as any);
      document.removeEventListener("touchend", handleEnd as any);
      document.removeEventListener("touchcancel", handleEnd as any);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, dragOffset]);

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
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold leading-tight">
          {card.title}
        </CardTitle>
        <Badge variant="secondary" className="text-[10px] w-fit">
          {card.domain}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {card.description}
        </p>
      </CardContent>
    </Card>
  );
}
