"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; // Importar Badge

interface DailyStudyTaskProps {
  initialIsCompleted: boolean;
  tags: string[] | null; // Adicionado o campo tags
  className?: string;
}

export const DailyStudyTask = ({ initialIsCompleted, tags, className }: DailyStudyTaskProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Removido o estado showAllTags e a lógica de toggle

  const navigate = useNavigate();

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/today/daily-study'); // Nova rota para o estudo diário
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "w-full p-4 rounded-2xl text-left transition-all duration-500 ease-in-out cursor-pointer relative",
        "bg-gradient-to-br from-blue-100 to-blue-200 text-gray-800 shadow-lg",
        initialIsCompleted && "opacity-80",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-black/70" />
          <span className="font-bold text-sm">ESTUDO DIÁRIO</span>
          <span className="text-xs text-black/60 font-semibold">• 10MIN</span>
        </div>
        {initialIsCompleted && <span className="font-bold text-xs text-black/70">FEITO</span>}
      </div>

      {tags && tags.length > 0 && (
        <div 
          className={cn(
            "mt-2 flex gap-1",
            !isExpanded ? "flex-nowrap overflow-hidden max-h-[24px]" : "flex-wrap" // Ajuste aqui
          )}
        >
          {tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="bg-white/50 text-gray-700 border-none px-2 py-0.5 text-xs font-medium flex-shrink-0 whitespace-nowrap" // Adicionado whitespace-nowrap
            >
              {tag.toUpperCase()}
            </Badge>
          ))}
        </div>
      )}

      <div 
        className={cn(
          "transition-all duration-500 ease-in-out",
          isExpanded ? "max-h-40 mt-8 opacity-100" : "max-h-0 mt-0 opacity-0"
        )}
      >
        <div className="flex items-end justify-between">
          <p className="text-xl font-semibold max-w-[70%]">
            Aprofunde-se na Palavra com o estudo de hoje.
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