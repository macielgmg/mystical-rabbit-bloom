"use client";

import { BookOpenCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

interface StudyAcquiredToastProps {
  title: string;
  studyId: string; // Adicionado studyId para redirecionamento
}

export const StudyAcquiredToast = ({ title, studyId }: StudyAcquiredToastProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/study/${studyId}`);
  };

  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-lg shadow-lg bg-card border border-primary/20 w-full max-w-sm relative overflow-hidden cursor-pointer"
      onClick={handleClick} // Torna o toast clicável
    >
      {/* Animação de brilho com CSS */}
      <style>
        {`
          @keyframes sparkle {
            0% { transform: scale(0) rotate(0deg); opacity: 0.5; }
            50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
            100% { transform: scale(0) rotate(360deg); opacity: 0.5; }
          }
          .sparkle-study {
            position: absolute;
            width: 8px;
            height: 8px;
            background-color: #a7f3d0; /* emerald-200 */
            border-radius: 50%;
            animation: sparkle 1.5s infinite;
            pointer-events: none;
          }
        `}
      </style>
      <div className="sparkle-study" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
      <div className="sparkle-study" style={{ top: '20%', left: '80%', animationDelay: '0.3s' }}></div>
      <div className="sparkle-study" style={{ top: '70%', left: '10%', animationDelay: '0.6s' }}></div>
      <div className="sparkle-study" style={{ top: '85%', left: '90%', animationDelay: '0.9s' }}></div>

      <div className="p-3 rounded-full bg-green-400/20 text-green-500 z-10">
        <BookOpenCheck className="h-8 w-8" />
      </div>
      <div className="z-10">
        <p className="font-bold text-primary">Estudo Adquirido!</p>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">Comece sua jornada agora.</p>
      </div>
    </div>
  );
};