
"use client";

import { cn } from "@/lib/utils";
import React from "react";

export type CupStyle = "mug" | "glass" | "takeaway";

interface CoffeeCupProps {
  level: number; // 0-100
  isHot: boolean;
  cupStyle: CupStyle;
}

const cupPaths: Record<CupStyle, { cup: string; handle?: string; steam?: boolean }> = {
  mug: {
    cup: "M20,100 C20,100 20,110 30,110 L110,110 C120,110 120,100 120,100 L110,20 L30,20 Z",
    handle: "M112,40 C135,45 135,75 118,80",
    steam: true,
  },
  glass: {
    cup: "M30,110 L110,110 L120,15 L20,15 Z",
    handle: "M117,40 C130,45 130,75 112,80",
    steam: false,
  },
  takeaway: {
    cup: "M35,110 L105,110 L120,15 L20,15 Z",
    steam: true,
  },
};


export function CoffeeCup({ level, isHot, cupStyle }: CoffeeCupProps) {
  const currentCup = cupPaths[cupStyle] || cupPaths.mug;
  const liquidClipId = `cup-clip-${cupStyle}`;

  const getLid = () => {
    if (cupStyle !== 'takeaway') return null;
    return (
       <g>
          {/* Straw */}
            <path
              d="M82,100 L100,5"
              strokeWidth="5"
              className="stroke-accent"
              fill="transparent"
              strokeLinecap="round"
            />
          <path d="M15,15 L125,15" strokeWidth="6" className="stroke-foreground/80" fill="transparent"/>
        </g>
    )
  }

  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64">
      <svg
        viewBox="0 0 150 150"
        className="w-full h-full"
        aria-hidden="true"
        overflow="visible"
      >
        <defs>
          <clipPath id={liquidClipId}>
            <path d={currentCup.cup} />
          </clipPath>
        </defs>

        {/* Coffee Liquid */}
        <g clipPath={`url(#${liquidClipId})`}>
          <rect
            x="0"
            y="0"
            width="150"
            height="150"
            className="fill-primary transition-transform duration-1000 ease-in-out"
            style={{
              transform: `translateY(${100 - level}%)`,
            }}
          />
        </g>
        
        {/* Steam Animation */}
        {isHot && currentCup.steam && (
           <g transform="translate(0, -5)">
            <g className="stroke-foreground/30" strokeWidth="2" fill="transparent">
              <path
                d="M 50 15 Q 55 5 60 15 T 70 15"
                className="animate-steam"
                style={{ animationDelay: "0s" }}
              />
              <path
                d="M 65 17 Q 70 7 75 17 T 85 17"
                className="animate-steam"
                style={{ animationDelay: "0.7s" }}
              />
              <path
                d="M 80 15 Q 85 5 90 15 T 100 15"
                className="animate-steam"
                style={{ animationDelay: "1.4s" }}
              />
            </g>
          </g>
        )}

        {/* Cup Outline */}
        <path
          d={currentCup.cup}
          className="stroke-foreground/80"
          strokeWidth="6"
          fill="transparent"
        />
        {/* Handle */}
        {currentCup.handle && (
            <path
              d={currentCup.handle}
              strokeWidth="6"
              fill="transparent"
              className="stroke-foreground/80"
            />
        )}

        {/* Lid for Takeaway */}
        {getLid()}

      </svg>
      <style jsx>{`
        @keyframes steam {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          20% {
            opacity: 0.7;
          }
          80% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.2;
          }
          100% {
            transform: translateY(-25px) scale(1.4);
            opacity: 0;
          }
        }
        .animate-steam {
          animation: steam 2.1s infinite linear;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
