"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerContent,
} from "@/components/ui/drawer";
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Icon as LucideIcon, Sparkles, BookOpen, GraduationCap, Crown, Flame, TrendingUp, Award, Target, Share2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AchievementDefinition, achievementDefinitions } from '@/utils/achievementDefinitions';

// Mapeamento de nomes de ícones para componentes Lucide
const iconComponents: { [key: string]: typeof LucideIcon } = {
  Sparkles, BookOpen, GraduationCap, Crown, Flame, TrendingUp, Award, Target, Share2, MessageSquare,
};

interface AchievementProgressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userAchievements: {
    id: string;
    name: string;
    description: string;
    icon_name: string;
  }[];
  unlockedAchievementIds: Set<string>;
  conditionData: {
    totalCompletedChapters: number;
    completedStudies: Set<string>; // IDs dos estudos completos
    streakCount: number; // Adicionado para a nova conquista
    totalShares: number; // Adicionado para a nova conquista
    totalJournalEntries: number; // Adicionado para a nova conquista
    isPro: boolean;
  } | null;
}

export const AchievementProgressDrawer = ({
  isOpen,
  onClose,
  userAchievements,
  unlockedAchievementIds,
  conditionData,
}: AchievementProgressDrawerProps) => {

  if (!conditionData) {
    return null; // Ou um estado de carregamento/erro
  }

  // Mapeia as conquistas do DB com suas definições e calcula o progresso
  const achievementsWithProgress = userAchievements.map(dbAch => {
    const definition = achievementDefinitions.find(def => def.name === dbAch.name);
    const isUnlocked = unlockedAchievementIds.has(dbAch.id);
    
    let progress = { current: 0, target: 1, unit: '' };
    if (definition) {
      progress = definition.getProgress(conditionData);
    }

    return {
      ...dbAch,
      isUnlocked,
      progress,
    };
  });

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md text-center">
          <DrawerHeader>
            <DrawerTitle className="text-2xl font-bold text-primary">Progresso das Conquistas</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">
              Acompanhe seu caminho para desbloquear todas as conquistas!
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-4">
              {achievementsWithProgress.map((ach) => {
                const Icon = iconComponents[ach.icon_name] || Target;
                const progressPercentage = Math.min(100, (ach.progress.current / ach.progress.target) * 100);
                const isCompleted = ach.isUnlocked;

                return (
                  <Card key={ach.id} className={cn("flex items-center p-4 shadow-sm transition-all", isCompleted ? "bg-green-50 border-green-200" : "bg-card border-muted")}>
                    <div className={cn("p-3 rounded-full mr-4", isCompleted ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary")}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className={cn("font-semibold text-lg", isCompleted ? "text-green-700" : "text-primary")}>{ach.name}</h3>
                      <p className="text-sm text-muted-foreground">{ach.description}</p>
                      {!isCompleted && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progresso:</span>
                            <span>{ach.progress.current} / {ach.progress.target} {ach.progress.unit}{ach.progress.target > 1 && ach.progress.unit !== '' ? 's' : ''}</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      )}
                      {isCompleted && (
                        <p className="text-xs text-green-600 font-semibold mt-2">Desbloqueada!</p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};