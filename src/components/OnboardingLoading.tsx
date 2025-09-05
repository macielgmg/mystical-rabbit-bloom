"use client";

import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface OnboardingLoadingProps {
  onComplete: () => void;
}

export const OnboardingLoading = ({ onComplete }: OnboardingLoadingProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
    }, 100); // Pequeno atraso inicial para a animação da barra

    const finishLoading = setTimeout(() => {
      onComplete();
    }, 2000); // 2 segundos para carregar

    return () => {
      clearTimeout(timer);
      clearTimeout(finishLoading);
    };
  }, [onComplete]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 p-4 text-center animate-fade-in">
      <div className="relative mb-8">
        <BookOpen className="h-24 w-24 text-primary animate-bounce-slow" /> {/* Animação da Bíblia */}
        <style>{` /* Corrigido: removido o atributo jsx */
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); opacity: 1; }
            50% { transform: translateY(-10px); opacity: 1; }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s infinite ease-in-out;
          }
        `}</style>
      </div>
      <h2 className="text-2xl font-bold text-primary mb-4 animate-fade-in-up animation-delay-100">
        Estamos preparando sua experiência!
      </h2>
      <div className="w-full max-w-xs space-y-2 animate-fade-in-up animation-delay-200">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">Carregando recursos...</p>
      </div>
    </div>
  );
};