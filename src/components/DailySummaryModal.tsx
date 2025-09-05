import React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, CheckCircle, Circle, BookOpen, Lightbulb, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailySummaryModalProps {
  date: Date | null;
  onClose: () => void;
}

// Define types for fetched data
interface DailyContentTemplateIds {
  verse_of_the_day: string | null;
  daily_study: string | null;
  quick_reflection: string | null;
  inspirational_quotes: string | null;
  my_prayer: string | null;
  completed_tasks: string[]; // Nova coluna
}

interface DailyContentActual {
  verse_of_the_day: { text: string; reference: string; explanation: string | null; url_audio: string | null } | null;
  daily_study: { text: string; title: string | null; auxiliar_text: string | null; tags: string[] | null; url_audio: string | null } | null;
  quick_reflection: { text: string | null; auxiliar_text: string | null; url_audio: string | null } | null;
  inspirational_quotes: { text: string | null; url_audio: string | null } | null;
  my_prayer: { text: string | null; auxiliar_text: string | null; url_audio: string | null } | null;
}

// Fetch function for daily content and tasks
const fetchDailySummary = async (userId: string, date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');

  // Fetch content template IDs and completed_tasks for the day
  const { data: dailyContentData, error: dailyContentError } = await supabase
    .from('daily_content_for_users')
    .select('verse_of_the_day, daily_study, quick_reflection, inspirational_quotes, my_prayer, completed_tasks') // Incluindo completed_tasks
    .eq('user_id', userId)
    .eq('content_date', dateStr)
    .single();

  if (dailyContentError && dailyContentError.code !== 'PGRST116') {
    throw dailyContentError;
  }

  const contentPromises = [];
  const actualContent: Partial<DailyContentActual> = {};
  const completedTasks: string[] = dailyContentData?.completed_tasks || [];

  if (dailyContentData) {
    const templateTypes = {
      verse_of_the_day: dailyContentData.verse_of_the_day,
      daily_study: dailyContentData.daily_study,
      quick_reflection: dailyContentData.quick_reflection,
      inspirational_quotes: dailyContentData.inspirational_quotes,
      my_prayer: dailyContentData.my_prayer,
    };

    for (const [key, templateId] of Object.entries(templateTypes)) {
      if (templateId) {
        contentPromises.push(
          supabase.from('daily_content_templates')
            .select('text_content, reference, title, auxiliar_text, tags, explanation, url_audio')
            .eq('id', templateId)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error(`Error fetching template for ${key} (ID: ${templateId}):`, error);
                return null;
              }
              if (key === 'verse_of_the_day' && data) {
                return { text: data.text_content, reference: data.reference || 'Versículo do Dia', explanation: data.explanation || null, url_audio: data.url_audio || null };
              }
              if (key === 'daily_study' && data) {
                  return { text: data.text_content, title: data.title || null, auxiliar_text: data.auxiliar_text || null, tags: data.tags || null, url_audio: data.url_audio || null };
              }
              if (['quick_reflection', 'inspirational_quotes', 'my_prayer'].includes(key) && data) {
                  return { text: data.text_content, auxiliar_text: data.auxiliar_text || null, url_audio: data.url_audio || null };
              }
              return null;
            })
            .then(content => {
              actualContent[key as keyof DailyContentActual] = content;
            })
        );
      } else {
        actualContent[key as keyof DailyContentActual] = null;
      }
    }
  }

  await Promise.all(contentPromises); // Wait for all content fetches to complete

  return {
    actualContent: actualContent as DailyContentActual,
    completedTasks, // Retorna a lista de tarefas concluídas
  };
};

export const DailySummaryModal = ({ date, onClose }: DailySummaryModalProps) => {
  const { session } = useSession();
  const formattedDate = date ? format(date, 'dd \'de\' MMMM, yyyy', { locale: ptBR }) : '';
  const dateStr = date ? format(date, 'yyyy-MM-dd') : '';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dailySummary', session?.user?.id, dateStr],
    queryFn: () => fetchDailySummary(session!.user!.id, date!),
    enabled: !!session?.user && !!date,
  });

  if (!date) return null;

  // Lista de tarefas que devem aparecer no resumo de progresso (excluindo o Versículo do Dia)
  const taskNamesForProgressSummary = [
    { key: 'spiritual_journal', label: 'Diário Espiritual' },
    { key: 'daily_study', label: 'Estudo Diário' },
    { key: 'quick_reflection', label: 'Reflexão Rápida' },
    { key: 'inspirational_quotes', label: 'Citação Inspiradora' },
    { key: 'my_prayer', label: 'Oração do Dia' },
  ];

  return (
    <Drawer open={!!date} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md text-center">
          <DrawerHeader>
            <DrawerTitle className="text-2xl text-primary">Resumo do Dia</DrawerTitle>
            <DrawerDescription className="text-lg font-semibold text-muted-foreground">
              {formattedDate}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-destructive text-center">
                Erro ao carregar resumo: {error?.message || 'Erro desconhecido.'}
              </div>
            ) : (
              <>
                {/* Daily Content Summary */}
                <h3 className="text-xl font-bold text-primary text-left mb-2">Conteúdo do Dia</h3>
                <div className="space-y-2">
                  {data?.actualContent?.verse_of_the_day && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        Versículo: "{data.actualContent.verse_of_the_day.text}" ({data.actualContent.verse_of_the_day.reference})
                      </p>
                    </div>
                  )}
                  {data?.actualContent?.daily_study && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        Estudo: {data.actualContent.daily_study.title}
                      </p>
                    </div>
                  )}
                  {data?.actualContent?.quick_reflection && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        Reflexão: "{data.actualContent.quick_reflection.text}"
                      </p>
                    </div>
                  )}
                  {data?.actualContent?.inspirational_quotes && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        Citação: "{data.actualContent.inspirational_quotes.text}"
                      </p>
                    </div>
                  )}
                  {data?.actualContent?.my_prayer && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30">
                      <Heart className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        Oração: "{data.actualContent.my_prayer.text}"
                      </p>
                    </div>
                  )}
                  {!Object.values(data?.actualContent || {}).some(Boolean) && (
                    <p className="text-sm text-muted-foreground text-center">Nenhum conteúdo diário gerado para esta data.</p>
                  )}
                </div>

                {/* Daily Tasks Progress Summary (usando a nova coluna) */}
                <h3 className="text-xl font-bold text-primary text-left mt-6 mb-2">Progresso das Tarefas</h3>
                <div className="space-y-2">
                  {taskNamesForProgressSummary.map(task => {
                    const isCompleted = data?.completedTasks.includes(task.key);
                    return (
                      <div key={task.key} className="flex items-center gap-3 p-3 rounded-md bg-secondary/30">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium text-foreground">{task.label}</p>
                      </div>
                    );
                  })}
                  {taskNamesForProgressSummary.every(task => !data?.completedTasks.includes(task.key)) && (
                    <p className="text-sm text-muted-foreground text-center">Nenhum progresso de tarefa registrado para esta data.</p>
                  )}
                </div>
              </>
            )}
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