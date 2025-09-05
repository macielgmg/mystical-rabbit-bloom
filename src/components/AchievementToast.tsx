import { Award } from 'lucide-react';

interface AchievementToastProps {
  name: string;
  description: string;
}

export const AchievementToast = ({ name, description }: AchievementToastProps) => {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg shadow-lg bg-card border border-primary/20 w-full max-w-sm relative overflow-hidden">
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