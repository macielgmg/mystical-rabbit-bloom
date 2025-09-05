import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpiritualJournalTaskProps {
  initialIsCompleted: boolean;
  className?: string; // Adicionado para permitir classes externas
}

export const SpiritualJournalTask = ({ initialIsCompleted, className }: SpiritualJournalTaskProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Permite expandir/recolher o card a qualquer momento.
    setIsExpanded(!isExpanded);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique no botão feche o card
    navigate('/today/spiritual-journal');
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "w-full p-4 rounded-2xl text-left transition-all duration-500 ease-in-out cursor-pointer overflow-hidden relative",
        "bg-gradient-to-br from-cyan-100 to-purple-200 text-gray-800 shadow-lg",
        // Mantém uma opacidade para indicar que foi feito, mas remove a restrição de clique.
        initialIsCompleted && "opacity-80",
        className // Aplica as classes externas aqui
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-black/70" />
          <span className="font-bold text-sm">DIÁRIO ESPIRITUAL</span>
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
          <p className="text-xl font-semibold max-w-[70%]">
            Como está seu relacionamento com Deus hoje?
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