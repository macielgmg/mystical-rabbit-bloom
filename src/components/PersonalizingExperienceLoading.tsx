"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils'; // Importar cn para combinar classes

interface PersonalizingExperienceLoadingProps {
  onComplete: () => void;
}

export const PersonalizingExperienceLoading = ({ onComplete }: PersonalizingExperienceLoadingProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false); // Novo estado para controlar a saída

  useEffect(() => {
    const loadingDuration = 3000; // Duração total do carregamento (antes de começar a sair)
    const exitAnimationDuration = 500; // Duração da animação de fade-out/slide-down

    // Animação da barra de progresso
    const progressTimer = setTimeout(() => {
      setProgress(100);
    }, 100); 

    // Inicia a animação de saída após o carregamento principal
    const startExitTimer = setTimeout(() => {
      setIsExiting(true);
    }, loadingDuration);

    // Completa a ação (navega) após a animação de saída
    const finishLoading = setTimeout(() => {
      onComplete();
    }, loadingDuration + exitAnimationDuration);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(startExitTimer);
      clearTimeout(finishLoading);
    };
  }, [onComplete]);

  return (
    <div 
      className={cn(
        "flex min-h-screen flex-col items-center justify-center bg-secondary/40 p-4 text-center animate-fade-in",
        "transition-all duration-500 ease-out", // Transição para a saída
        isExiting && "opacity-0 translate-y-full" // Classes para fade-out e deslize para baixo
      )}
    >
      <div className="relative mb-8">
        <Sparkles className="h-24 w-24 text-primary animate-spin-slow" /> {/* Animação de brilho */}
        <style>{`
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 4s linear infinite;
          }
        `}</style>
      </div>
      <h2 className="text-2xl font-bold text-primary mb-4 animate-fade-in-up animation-delay-100">
        Estamos personalizando sua experiência!
      </h2>
      <div className="w-full max-w-xs space-y-2 animate-fade-in-up animation-delay-200">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">Quase pronto...</p>
      </div>
    </div>
  );
};