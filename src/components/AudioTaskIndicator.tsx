"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Headphones, Crown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AudioPlayer } from '@/components/AudioPlayer';
import { ProAudioPlaceholder } from '@/components/ProAudioPlaceholder';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AudioTaskIndicatorProps {
  audioUrl: string | null;
  isProUser: boolean;
  className?: string;
}

export const AudioTaskIndicator = ({ audioUrl, isProUser, className }: AudioTaskIndicatorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  if (!audioUrl) {
    return null; // Não renderiza nada se não houver URL de áudio
  }

  const handleSubscribeClick = () => {
    setIsModalOpen(false); // Fecha o modal antes de navegar
    navigate('/manage-subscription');
  };

  return (
    <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-8 w-8 text-black/70 hover:bg-white/50", className)}
          onClick={(e) => e.stopPropagation()} // Impede que o clique no botão feche o card pai
        >
          <Headphones className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center text-center">
          {isProUser ? (
            <Headphones className="h-16 w-16 text-primary mb-4" />
          ) : (
            <Crown className="h-16 w-16 text-yellow-500 mb-4" />
          )}
          <AlertDialogTitle className="text-2xl font-bold text-primary">
            {isProUser ? "Ouvir Conteúdo" : "Recurso Pro: Áudio Exclusivo"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {isProUser ? "Reproduza o áudio deste conteúdo." : "Ouça este conteúdo com o plano Raízes da Fé Pro. Assine para ter acesso ilimitado a todos os recursos premium!"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-4 py-2">
          {isProUser ? (
            <AudioPlayer src={audioUrl} />
          ) : (
            <ProAudioPlaceholder />
          )}
        </div>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
          <AlertDialogCancel asChild>
            <Button variant="outline" className="w-full sm:w-auto">Fechar</Button>
          </AlertDialogCancel>
          {!isProUser && (
            <AlertDialogAction asChild>
              <Button 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                onClick={handleSubscribeClick}
              >
                Assinar Pro
              </Button>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};