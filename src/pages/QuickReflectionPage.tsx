import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Lightbulb, Share2, CheckCircle, X, ArrowRight } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted, isFirstTaskInSequence, getPreviousTaskPath, getCompletionStatusKey } from '@/utils/dailyTasksSequence'; // Importar getCompletionStatusKey
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ProAudioPlaceholder } from '@/components/ProAudioPlaceholder';
import { getLocalDateString } from '@/lib/utils'; // Importar a nova função
import { checkAndAwardAchievements } from '@/utils/achievements'; // Importar a função de verificação de conquistas
import { showAchievementToast } from '@/utils/toast'; // Importar o toast de conquista

const QuickReflectionPage = () => {
  const navigate = useNavigate();
  const { session, isPro, refetchProfile } = useSession(); // Adicionado refetchProfile
  const queryClient = useQueryClient();
  const [reflectionContent, setReflectionContent] = useState<{ text: string | null; auxiliar_text: string | null; url_audio: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const { 
    completedDailyTasksCount, 
    totalDailyTasks, 
    dailyProgressPercentage, 
    isLoadingAnyDailyTask,
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
    isVerseOfTheDayTaskCompleted, // Adicionado aqui
  } = useDailyTasksProgress();

  const currentTaskName = 'quick_reflection';
  const completionStatus = {
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
    isVerseOfTheDayTaskCompleted, // Adicionado aqui
  };

  // isFirstTask e previousTaskPath podem ser calculados fora do handleCompleteTask
  const isFirstTask = isFirstTaskInSequence(currentTaskName);
  const previousTaskPath = getPreviousTaskPath(currentTaskName);

  useEffect(() => {
    const fetchReflection = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const todayStr = getLocalDateString(new Date()); // Usar getLocalDateString
      const userId = session.user.id;

      // Fetch daily content template ID
      const { data: dailyContentData, error: dailyContentError } = await supabase
        .from('daily_content_for_users')
        .select('quick_reflection')
        .eq('user_id', userId)
        .eq('content_date', todayStr)
        .single();

      if (dailyContentError && dailyContentError.code !== 'PGRST116') {
        console.error("Erro ao buscar ID da reflexão rápida para o usuário:", dailyContentError);
        showError("Erro ao carregar a reflexão rápida.");
        setReflectionContent(null);
        setLoading(false);
        return;
      }

      const reflectionTemplateId = dailyContentData?.quick_reflection;

      if (reflectionTemplateId) {
        // Fetch template content, including 'auxiliar_text' field
        const { data: templateData, error: templateError } = await supabase
          .from('daily_content_templates')
          .select('text_content, auxiliar_text, url_audio')
          .eq('id', reflectionTemplateId)
          .single();

        if (templateError) {
          console.error("Erro ao buscar conteúdo do template da reflexão:", templateError);
          showError("Erro ao carregar o conteúdo da reflexão.");
          setReflectionContent(null);
        } else if (templateData) {
          setReflectionContent({ 
            text: templateData.text_content, 
            auxiliar_text: templateData.auxiliar_text || null,
            url_audio: templateData.url_audio || null 
          });
        } else {
          setReflectionContent(null);
        }
      } else {
        setReflectionContent(null);
      }

      setLoading(false);
    };
    fetchReflection();
  }, [session, navigate, queryClient]);

  const handleShare = async () => {
    if (!session?.user) {
      showError("Você precisa estar logado para compartilhar.");
      return;
    }

    // Increment total_shares in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .rpc('increment_total_shares', { user_id: session.user.id }); // Usar RPC para incrementar

    if (updateError) {
      console.error("Erro ao incrementar total_shares:", updateError);
      showError("Erro ao registrar o compartilhamento.");
      return;
    }
    await refetchProfile(); // Atualiza o contexto da sessão para refletir o novo total_shares

    // Check and award achievements after sharing
    const newAchievements = await checkAndAwardAchievements(session.user.id);
    newAchievements.forEach((ach, index) => {
      setTimeout(() => showAchievementToast(ach), index * 700);
    });

    if (navigator.share && reflectionContent?.text) {
      const shareText = `Reflexão Rápida: "${reflectionContent.text}"\n\n${reflectionContent.auxiliar_text ? `Para Refletir: ${reflectionContent.auxiliar_text}\n\n` : ''}Confira o app Raízes da Fé!`;
      navigator.share({
        title: 'Reflexão Rápida - Raízes da Fé',
        text: shareText,
        url: window.location.href,
      })
      .then(() => showSuccess('Reflexão compartilhada com sucesso!'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      const shareText = `Reflexão Rápida: "${reflectionContent?.text || ''}"\n\n${reflectionContent?.auxiliar_text ? `Para Refletir: ${reflectionContent.auxiliar_text}\n\n` : ''}Confira o app Raízes da Fé: ${window.location.href}`;
      navigator.clipboard.writeText(shareText)
        .then(() => showSuccess('Reflexão copiada para a área de transferência!'))
        .catch(() => showError('Não foi possível copiar a reflexão.'));
    }
  };

  const handleCompleteTask = async () => {
    if (!session?.user) {
      showError("Você precisa estar logado para finalizar.");
      return;
    }
    setIsCompleting(true);
    const today = getLocalDateString(new Date()); // Usar getLocalDateString
    const userId = session.user.id;

    try {
      const { error } = await supabase
        .from('daily_tasks_progress')
        .upsert({
          user_id: userId,
          task_name: currentTaskName,
          task_date: today,
          value: 1, // Marca como completo
          text_value: null, // Remove o campo de anotações do usuário
        }, { onConflict: 'user_id,task_name,task_date' });

      if (error) {
        throw error;
      }
      
      // Simula o status de conclusão da tarefa atual para a lógica de navegação
      const simulatedCompletionStatus = {
        ...completionStatus,
        [getCompletionStatusKey(currentTaskName)]: true,
      };

      const isLastTaskAfterCompletion = isLastTaskInSequenceAndAllCompleted(currentTaskName, simulatedCompletionStatus);
      const nextTaskPathAfterCompletion = getNextIncompleteTaskPath(currentTaskName, simulatedCompletionStatus);

      // Invalida todas as queries de progresso diário para garantir a atualização
      queryClient.invalidateQueries({ queryKey: ['journalStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['verseOfTheDayTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyStudyTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['quickReflectionTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['inspirationalQuoteTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['myPrayerTaskStatus', userId] });
      
      if (nextTaskPathAfterCompletion) {
        navigate(nextTaskPathAfterCompletion);
      } else if (isLastTaskAfterCompletion) {
        navigate('/today');
      } else {
        navigate('/today'); // Fallback
      }
    } catch (error: any) {
      showError("Erro ao finalizar a reflexão: " + error.message);
      console.error("Erro ao finalizar reflexão:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  // O cálculo de isLastTask para o botão deve usar o estado atual, não o simulado
  const isLastTaskForButton = isLastTaskInSequenceAndAllCompleted(currentTaskName, completionStatus);

  if (loading || isLoadingAnyDailyTask) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl flex flex-col h-screen p-4">
      <header className="relative flex items-center justify-center py-4 mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary">Reflexão Rápida</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0"
          onClick={() => navigate('/today')}
        >
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* Indicador de Progresso Diário */}
      <div className="w-full space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-primary/80">Progresso Diário</h3>
          <span className="text-sm text-muted-foreground">
            {completedDailyTasksCount} de {totalDailyTasks} tarefas ({dailyProgressPercentage.toFixed(0)}%)
          </span>
        </div>
        <Progress value={dailyProgressPercentage} className="h-2.5" />
      </div>

      <div className="flex-grow flex flex-col space-y-6 overflow-y-auto pb-4">
        {reflectionContent?.text ? (
          <Card className="p-6 space-y-4 w-full">
            <CardHeader className="p-0 pb-2">
              <Lightbulb className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-primary">Sua Reflexão de Hoje</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                "{reflectionContent.text}"
              </p>
              {reflectionContent.auxiliar_text && (
                <div className="mt-6 pt-4 border-t border-muted-foreground/20 text-left">
                  <h3 className="text-xl font-bold text-primary/90 mb-2">Para Refletir</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {reflectionContent.auxiliar_text}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center text-muted-foreground flex-grow flex flex-col justify-center items-center">
            <Lightbulb className="h-24 w-24 text-muted-foreground/50 mb-4" />
            <p className="text-lg">Nenhuma reflexão disponível para hoje.</p>
            <p className="text-sm">Tente novamente mais tarde ou verifique sua conexão.</p>
          </div>
        )}

        {reflectionContent?.url_audio && (isPro ? (
          <AudioPlayer src={reflectionContent.url_audio} className="mb-4" />
        ) : (
          <ProAudioPlaceholder className="mb-4" />
        ))}
      </div>

      <div className="flex justify-between items-center py-4 gap-2 flex-shrink-0">
        {/* Share Button */}
        <Button 
          variant="outline" 
          onClick={handleShare} 
          size="icon" 
          className="h-10 w-10 flex-shrink-0"
          disabled={!reflectionContent?.text}
        >
          <Share2 className="h-4 w-4" />
        </Button>

        {/* Back Button (conditional) */}
        {!isFirstTask && previousTaskPath && (
          <Button 
            variant="outline" 
            onClick={() => navigate(previousTaskPath)} 
            className="flex-1"
            disabled={isCompleting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        )}

        {/* Continue/Finalize Button */}
        <Button 
          onClick={handleCompleteTask} 
          className={cn("flex-1", isFirstTask ? "w-full" : "")}
          disabled={isCompleting || !reflectionContent?.text}
        >
          {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            isLastTaskForButton ? ( // Usar isLastTaskForButton aqui
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Jornada
              </>
            ) : (
              <ArrowRight className="h-4 w-4" />
            )
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuickReflectionPage;