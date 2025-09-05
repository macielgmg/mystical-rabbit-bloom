"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
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

interface ProAudioPlaceholderProps {
  className?: string;
}

export const ProAudioPlaceholder = ({ className }: ProAudioPlaceholderProps) => {
  const navigate = useNavigate();
  const [showProModal, setShowProModal] = useState(false);

  const handleSubscribeClick = () => {
    setShowProModal(false); // Fecha o modal antes de navegar
    navigate('/manage-subscription');
  };

  return (
    <div className={cn("w-full", className)}>
      <AlertDialog open={showProModal} onOpenChange={setShowProModal}>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full"
          >
            <Headphones className="h-4 w-4 mr-2" /> Ouvir Áudio
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <Crown className="h-16 w-16 text-yellow-500 mb-4" />
            <AlertDialogTitle className="text-2xl font-bold text-primary">Recurso Pro: Áudio Exclusivo</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Ouça este conteúdo com o plano Raízes da Fé Pro. Assine para ter acesso ilimitado a todos os recursos premium!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="w-full sm:w-auto">Fechar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                onClick={handleSubscribeClick}
              >
                Assinar Pro
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};