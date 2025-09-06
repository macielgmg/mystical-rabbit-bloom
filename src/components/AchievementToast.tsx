"use client";

import { Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import React, { useEffect, useRef } from 'react'; // Importar useEffect e useRef

interface AchievementToastProps {
  id: string; // Adicionado ID para navegação
  name: string;
  description: string;
}

export const AchievementToast = ({ id, name, description }: AchievementToastProps) => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null); // Referência para o elemento de áudio

  useEffect(() => {
    // Toca o som quando o componente é montado
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Erro ao tocar som de conquista:", e));
    }
  }, []);

  const handleClick = () => {
    navigate('/achievements', { state: { highlightAchievementId: id } });
  };

  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-lg shadow-lg bg-card border border-primary/20 w-full max-w-sm relative overflow-hidden cursor-pointer"
      onClick={handleClick} // Adicionado o handler de clique
    >
      {/* Elemento de áudio para o som de 'ding' */}
      <audio ref={audioRef} src="/sounds/ding.mp3" preload="auto" />

      {/* Animação de brilho com CSS */}
      <style>
        {`
          @keyframes sparkle {
            0% { transform: scale(0) rotate(0deg); opacity: 0.5; }
            50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
            100% { transform: scale(0) rotate(360deg); opacity: 0.5; }
          }
          .sparkle {
            position: absolute;
            width: 8px;
            height: 8px;
            background-color: #fde047; /* yellow-300 */
            border-radius: 50%;
            animation: sparkle 1.5s infinite;
            pointer-events: none;
          }
        `}
      </style>
      <div className="sparkle" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
      <div className="sparkle" style={{ top: '20%', left: '80%', animationDelay: '0.3s' }}></div>
      <div className="sparkle" style={{ top: '70%', left: '10%', animationDelay: '0.6s' }}></div>
      <div className="sparkle" style={{ top: '85%', left: '90%', animationDelay: '0.9s' }}></div>

      <div className="p-3 rounded-full bg-yellow-400/20 text-yellow-500 z-10">
        <Award className="h-8 w-8" />
      </div>
      <div className="z-10">
        <p className="font-bold text-primary">Conquista Desbloqueada!</p>
        <p className="font-semibold text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};