"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sprout, Star } from 'lucide-react'; // Importar Star icon

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen = ({ onContinue }: WelcomeScreenProps) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    onContinue();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/40 p-4 text-center animate-fade-in">
      <Sprout className="h-24 w-24 text-primary mb-8 animate-fade-in-up animation-delay-100" />
      <h1 className="text-4xl font-bold text-primary mb-4 animate-fade-in-up animation-delay-200">
        De cristãos, para cristãos
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8 animate-fade-in-up animation-delay-300">
        Nossa missão é fortalecer sua fé e aprofundar seu conhecimento da Palavra.
      </p>

      {/* Nova seção de prova social (ratings) */}
      <div className="flex items-center justify-center gap-1 mb-8 animate-fade-in-up animation-delay-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-6 w-6 text-yellow-500 fill-yellow-500" />
        ))}
        <p className="text-sm text-muted-foreground ml-2 font-semibold">
          Mais de 10 mil avaliações 5 estrelas!
        </p>
      </div>

      <Button 
        onClick={handleContinue} 
        size="lg" 
        className="px-8 py-6 text-lg animate-pulse-slow" // Removido animate-fade-in-up animation-delay-500
      >
        Continuar
      </Button>
    </div>
  );
};