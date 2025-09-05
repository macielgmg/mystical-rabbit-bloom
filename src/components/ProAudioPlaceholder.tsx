"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ProAudioPlaceholderProps {
  className?: string;
}

export const ProAudioPlaceholder = ({ className }: ProAudioPlaceholderProps) => {
  const navigate = useNavigate();

  return (
    <div className={cn("w-full flex flex-col items-center justify-center p-4 rounded-lg bg-yellow-100/30 border border-yellow-500/30 text-yellow-800 text-center space-y-3", className)}>
      <Crown className="h-8 w-8 text-yellow-600" />
      <p className="font-semibold text-sm">Recurso Pro: Áudio Exclusivo</p>
      <p className="text-xs text-yellow-700">Ouça este conteúdo com o plano Raízes da Fé Pro.</p>
      <Button 
        variant="secondary" 
        size="sm" 
        className="bg-yellow-500 hover:bg-yellow-600 text-white"
        onClick={() => navigate('/manage-subscription')}
      >
        <Headphones className="h-4 w-4 mr-2" /> Assinar Pro
      </Button>
    </div>
  );
};