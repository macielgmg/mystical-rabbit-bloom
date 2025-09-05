"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowUpRight } from 'lucide-react'; // Alterado para BookOpen
import { cn } from '@/lib/utils';

interface VerseOfTheDayTaskProps {
  initialIsCompleted: boolean;
}

export const VerseOfTheDayTask = ({ initialIsCompleted }: VerseOfTheDayTaskProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/today/verse-of-the-day'); // Nova rota
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "w-full p-4 rounded-2xl text-left transition-all duration-500 ease-in-out cursor-pointer overflow-hidden relative",
        "bg-gradient-to-br from-blue-100 to-blue-200 text-gray-800 shadow-lg", // Novas cores
        initialIsCompleted && "opacity-80"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-black/70" /> {/* Novo ícone */}
          <span className="font-bold text-sm">VERSÍCULO DO DIA</span> {/* Novo texto */}
          <span className="text-xs text-black/60 font-semibold">• 5MIN</span>
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
          <p className="text-xl font-semibold max-w-[70%]">
            Medite no versículo do dia e aplique-o à sua vida.
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