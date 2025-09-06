import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, BookOpen, Share2, CheckCircle, X, ArrowRight } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/AudioPlayer';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted, isFirstTaskInSequence, getPreviousTaskPath, getCompletionStatusKey } from '@/utils/dailyTasksSequence'; // Importar getCompletionStatusKey
import { ProAudioPlaceholder } from '@/components/ProAudioPlaceholder';
import { getLocalDateString } from '@/lib/utils'; // Importar a nova função
import { checkAndAwardAchievements } from '@/utils/achievements'; // Importar a função de verificação de conquistas
import { showAchievementToast } from '@/utils/toast'; // Importar o toast de conquista

const VerseOfTheDayPage = () => {
  const navigate = useNavigate();
  const { session, isPro, refetchProfile } = useSession(); // Adicionado refetchProfile
  const queryClient = useQueryClient();
  const [verseContent, setVerseContent] = useState<{ text: string; reference: string; explanation: string | null; url_audio: string | null } | null>(null); // Adicionado explanation
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

  const currentTaskName = 'verse_of_the_day';
  const completionStatus = {
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
    isVerseOfTheDayTaskCompleted, // Adicionado aqui
  };

  const isLastTask = isLastTaskInSequenceAndAllCompleted(currentTaskName, { ...completionStatus, isVerseOfTheDayTaskCompleted: true });
  const nextTaskPath = getNextIncompleteTaskPath(currentTaskName, { ...completionStatus, isVerseOfTheDayTaskCompleted: true });
  const previousTaskPath = getPreviousTaskPath(currentTaskName);
  const isFirstTask = isFirstTaskInSequence(currentTaskName);

  useEffect(() => {
    const fetchVerse = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const todayStr = getLocalDateString(new Date()); // Usar getLocalDateString
      const userId = session.user.id;

      // 1. Buscar o ID do template do versículo do dia para o usuário e data atual
      const { data: dailyContentData, error: dailyContentError } = await supabase
        .from('daily_content_for_users')
        .select('verse_of_the_day')
        .eq('user_id', userId)
        .eq('content_date', todayStr)
        .single();

      if (dailyContentError && dailyContentError.code !== 'PGRST116') {
        console.error("Erro ao buscar ID do versículo do dia para o usuário:", dailyContentError);
        showError("Erro ao carregar o versículo do dia.");
        setVerseContent(null);
        setLoading(false);
        return;
      }

      const verseTemplateId = dailyContentData?.verse_of_the_day;

      if (verseTemplateId) {
        // 2. Usar o ID do template para buscar o conteúdo real do template
        const { data: templateData, error: templateError } = await supabase
          .from('daily_content_templates')
          .select('text_content, reference, explanation, url_audio') // Adicionado explanation
          .eq('id', verseTemplateId)
          .single();

        if (templateError) {
          console.error("Erro ao buscar conteúdo do template do versículo:", templateError);
          showError("Erro ao carregar o conteúdo do versículo.");
          setVerseContent(null);
        } else if (templateData) {
          setVerseContent({
            text: templateData.text_content,
            reference: templateData.reference || 'Versículo do Dia',
            explanation: templateData.explanation || null, // Definir explanation
            url_audio: templateData.url_audio || null,
          });
        } else {
          setVerseContent(null); // Template não encontrado
        }
      } else {
        setVerseContent(null); // Nenhum ID de versículo encontrado para o dia
      }
      setLoading(false);
    };
    fetchVerse();
  }, [session, navigate]);

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

    if (navigator.share && verseContent) {
      let shareText = `"${verseContent.text}" — ${verseContent.reference}\n\n`;
      if (verseContent.explanation) {
        shareText += `Explicação: ${verseContent.explanation}\n\n`;
      }
      shareText += `Confira o app Raízes da Fé!`;

      navigator.share({
        title: 'Versículo do Dia - Raízes da Fé',
        text: shareText,
        url: window.location.href,
      })
      .then(() => showSuccess('Versículo compartilhado com sucesso!'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      // Fallback para navegadores que não suportam a Web Share API
      let shareText = `"${verseContent?.text || ''}" — ${verseContent?.reference || 'Versículo do Dia'}\n\n`;
      if (verseContent?.explanation) {
        shareText += `Explicação: ${verseContent.explanation}\n\n`;
      }
      shareText += `Confira o app Raízes da Fé: ${window.location.href}`;

      navigator.clipboard.writeText(shareText)
        .then(() => showSuccess('Versículo copiado para a área de transferência!'))
        .catch(() => showError('Não foi possível copiar o versículo.'));
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
          value: 1,
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
      showError("Erro ao finalizar o versículo: " + error.message);
      console.error("Erro ao finalizar versículo:", error);
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
        <h1 className="text-xl font-bold text-primary">Versículo do Dia</h1>
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

      <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4">
        {verseContent ? (
          <div className="space-y-4">
            <BookOpen className="h-20 w-20 text-primary mx-auto" />
            <p className="text-2xl font-serif italic text-primary/90 leading-relaxed">
              "{verseContent.text}"
            </p>
            <p className="text-lg font-semibold text-muted-foreground">
              — {verseContent.reference}
            </p>
            {verseContent.explanation && ( // Exibir explicação se disponível
              <div className="mt-6 pt-4 border-t border-muted-foreground/20 text-left">
                <h3 className="text-xl font-bold text-primary/90 mb-2">Explicação</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {verseContent.explanation}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Nenhum versículo disponível para hoje.</p>
            <p className="text-sm">Tente novamente mais tarde ou verifique sua conexão.</p>
          </div>
        )}
      </div>

      {verseContent?.url_audio && (isPro ? (
        <AudioPlayer src={verseContent.url_audio} className="mb-4" />
      ) : (
        <ProAudioPlaceholder className="mb-4" />
      ))}

      <div className="flex justify-between items-center py-4 gap-2 flex-shrink-0">
        {/* Share Button */}
        <Button 
          variant="outline" 
          onClick={handleShare} 
          size="icon" 
          className="h-10 w-10 flex-shrink-0"
          disabled={!verseContent}
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
          disabled={isCompleting || !verseContent}
        >
          {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
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

export default VerseOfTheDayPage;