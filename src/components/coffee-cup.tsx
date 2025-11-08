
"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface CoffeeCupProps {
  level: number; // 0-100
  isHot: boolean;
}

export function CoffeeCup({ level, isHot }: CoffeeCupProps) {
  const coffeeHeight = 85 * (level / 100);
  const coffeeY = 100 - coffeeHeight;

  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64">
      <svg
        viewBox="0 0 150 150"
        className="w-full h-full"
        aria-hidden="true"
        overflow="visible"
      >
        <defs>
          <clipPath id="cup-clip">
            <path d="M20,100 C20,100 20,110 30,110 L110,110 C120,110 120,100 120,100 L110,20 L30,20 Z" />
          </clipPath>
        </defs>

        {/* Coffee Liquid */}
        <g clipPath="url(#cup-clip)">
          <rect
            x="20"
            y={coffeeY + 15}
            width="100"
            height={coffeeHeight}
            className="fill-primary transition-all duration-1000 ease-in-out"
          />
        </g>

        {/* Cup Outline */}
        <path
          d="M20,100 C20,100 20,110 30,110 L110,110 C120,110 120,100 120,100 L110,20 L30,20 Z"
          className="stroke-foreground/80"
          strokeWidth="6"
          fill="transparent"
        />
        {/* Handle */}
        <path
          d="M110,40 C135,45 135,75 110,80"
          strokeWidth="6"
          fill="transparent"
          className="stroke-foreground/80"
        />

        {/* Steam Animation */}
        {isHot && (
          <g className="stroke-foreground/30" strokeWidth="2">
            <path
              d="M 60 20 Q 65 10 70 20 T 80 20"
              style={{
                animation: "steam 2s infinite linear",
                animationDelay: "0s",
                opacity: 0,
              }}
            />
            <path
              d="M 75 23 Q 80 13 85 23 T 95 23"
              style={{
                animation: "steam 2s infinite linear",
                animationDelay: "0.5s",
                opacity: 0,
              }}
            />
            <path
              d="M 90 20 Q 95 10 100 20 T 110 20"
              style={{
                animation: "steam 2s infinite linear",
                animationDelay: "1s",
                opacity: 0,
              }}
            />
          </g>
        )}
      </svg>
      <style jsx>{`
        @keyframes steam {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 0.7;
          }
          80% {
            transform: translateY(-20px) scale(1);
            opacity: 0.2;
          }
          100% {
            transform: translateY(-25px) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
