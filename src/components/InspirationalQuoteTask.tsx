"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspirationalQuoteTaskProps {
  initialIsCompleted: boolean;
  contentSnippet: string | null;
  className?: string;
}

export const InspirationalQuoteTask = ({ initialIsCompleted, contentSnippet, className }: InspirationalQuoteTaskProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/today/inspirational-quote');
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "w-full p-4 rounded-2xl text-left transition-all duration-500 ease-in-out cursor-pointer overflow-hidden relative",
        "bg-gradient-to-br from-yellow-100 to-orange-200 text-gray-800 shadow-lg",
        initialIsCompleted && "opacity-80",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-black/70" />
          <span className="font-bold text-sm">CITAÇÃO INSPIRADORA</span>
          <span className="text-xs text-black/60 font-semibold">• 1MIN</span>
        </div>
        {initialIsCompleted && <span className="font-bold text-xs text-black/70">FEITO</span>}
      </div>

      <div 
        className={cn(
          "transition-all duration-500 ease-in-out",
          isExpanded ? "max-h-40 mt-8 opacity-100" : "max-h-0 mt-0 opacity-0"
        )}
      >
        <div className="flex items-end justify-between">
          <p className="text-xl font-semibold max-w-[70%] line-clamp-2">
            {contentSnippet || "Encontre inspiração para o seu dia."}
          </p>
          <button
            onClick={handleNavigate}
            className="bg-white/50 rounded-lg p-3 hover:bg-white/80 transition-colors"
          >
            <ArrowUpRight className="h-6 w-6 text-black/80" />
          </button>
        </div>
      </div>
    </div>
  );
};