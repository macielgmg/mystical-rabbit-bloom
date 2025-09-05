import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Lightbulb, Share2, CheckCircle, X, Save } from 'lucide-react'; // Adicionado Save
import { showError, showSuccess } from '@/utils/toast'; // Adicionado showSuccess
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted, isFirstTaskInSequence, getPreviousTaskPath } from '@/utils/dailyTasksSequence';
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ProAudioPlaceholder } from '@/components/ProAudioPlaceholder'; // Importar o novo componente
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea

const QuickReflectionPage = () => {
  const navigate = useNavigate();
  const { session, isPro } = useSession();
  const queryClient = useQueryClient();
  const [reflectionContent, setReflectionContent] = useState<{ text: string | null; url_audio: string | null } | null>(null);
  const [userNotes, setUserNotes] = useState<string>('');
  const [initialUserNotes, setInitialUserNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false); // Novo estado para salvar anotações

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
  } = useDailyTasksProgress();

  const currentTaskName = 'quick_reflection';
  const completionStatus = {
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
  };

  const isLastTask = isLastTaskInSequenceAndAllCompleted(currentTaskName, { ...completionStatus, isQuickReflectionTaskCompleted: true });
  const nextTaskPath = getNextIncompleteTaskPath(currentTaskName, { ...completionStatus, isQuickReflectionTaskCompleted: true });
  const previousTaskPath = getPreviousTaskPath(currentTaskName);
  const isFirstTask = isFirstTaskInSequence(currentTaskName);

  useEffect(() => {
    const fetchReflectionAndNotes = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
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
        // Fetch template content
        const { data: templateData, error: templateError } = await supabase
          .from('daily_content_templates')
          .select('text_content, url_audio')
          .eq('id', reflectionTemplateId)
          .single();

        if (templateError) {
          console.error("Erro ao buscar conteúdo do template da reflexão:", templateError);
          showError("Erro ao carregar o conteúdo da reflexão.");
          setReflectionContent(null);
        } else if (templateData) {
          setReflectionContent({ text: templateData.text_content, url_audio: templateData.url_audio || null });
        } else {
          setReflectionContent(null);
        }
      } else {
        setReflectionContent(null);
      }

      // Fetch user's existing notes for this task
      const { data: userProgressData, error: userProgressError } = await supabase
        .from('daily_tasks_progress')
        .select('text_value')
        .eq('user_id', userId)
        .eq('task_name', currentTaskName)
        .eq('task_date', todayStr)
        .single();

      if (userProgressError && userProgressError.code !== 'PGRST116') {
        console.error("Erro ao buscar anotações do usuário para reflexão rápida:", userProgressError);
        showError("Erro ao carregar suas anotações.");
        setUserNotes('');
        setInitialUserNotes('');
      } else if (userProgressData) {
        setUserNotes(userProgressData.text_value || '');
        setInitialUserNotes(userProgressData.text_value || '');
      } else {
        setUserNotes('');
        setInitialUserNotes('');
      }

      setLoading(false);
    };
    fetchReflectionAndNotes();
  }, [session, navigate, queryClient]);

  const handleShare = () => {
    if (navigator.share && reflectionContent?.text) {
      navigator.share({
        title: 'Reflexão Rápida - Raízes da Fé',
        text: `Reflexão Rápida: "${reflectionContent.text}"\n\nConfira o app Raízes da Fé!`,
        url: window.location.href,
      })
      .then(() => showSuccess('Reflexão compartilhada com sucesso!'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      const shareText = `Reflexão Rápida: "${reflectionContent?.text || ''}"\n\nConfira o app Raízes da Fé: ${window.location.href}`;
      navigator.clipboard.writeText(shareText)
        .then(() => showSuccess('Reflexão copiada para a área de transferência!'))
        .catch(() => showError('Não foi possível copiar a reflexão.'));
    }
  };

  const handleSaveNotes = async () => {
    if (!session) {
      showError("Você precisa estar logado para salvar suas anotações.");
      return;
    }
    setIsSavingNotes(true);
    const today = new Date().toISOString().split('T')[0];
    const userId = session.user.id;

    try {
      const { error } = await supabase
        .from('daily_tasks_progress')
        .upsert({
          user_id: userId,
          task_name: currentTaskName,
          task_date: today,
          text_value: userNotes, // Salva as anotações
          value: 0, // Não marca como completo, apenas salva as anotações
        }, { onConflict: 'user_id,task_name,task_date' });

      if (error) {
        throw error;
      }
      showSuccess("Anotações salvas com sucesso!");
      setInitialUserNotes(userNotes); // Atualiza o estado inicial das anotações
      queryClient.invalidateQueries({ queryKey: ['quickReflectionTaskStatus', userId] }); // Invalida para atualizar o progresso
    } catch (error: any) {
      showError("Erro ao salvar anotações: " + error.message);
      console.error("Erro ao salvar anotações:", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setUserNotes(initialUserNotes); // Reverte para as anotações iniciais
  };

  const handleCompleteTask = async () => {
    if (!session) {
      showError("Você precisa estar logado para finalizar.");
      return;
    }
    setIsCompleting(true);
    const today = new Date().toISOString().split('T')[0];
    const userId = session.user.id;

    try {
      const { error } = await supabase
        .from('daily_tasks_progress')
        .upsert({
          user_id: userId,
          task_name: currentTaskName,
          task_date: today,
          value: 1, // Marca como completo
          text_value: userNotes, // Salva as anotações junto com a conclusão
        }, { onConflict: 'user_id,task_name,task_date' });

      if (error) {
        throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ['quickReflectionTaskStatus', userId] });
      
      if (nextTaskPath) {
        navigate(nextTaskPath);
      } else {
        navigate('/today');
      }
    } catch (error: any) {
      showError("Erro ao finalizar a reflexão: " + error.message);
      console.error("Erro ao finalizar reflexão:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const hasNotesChanges = userNotes !== initialUserNotes;

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

        {/* Campo de anotações do usuário */}
        <div className="space-y-4 pt-4 border-t border-muted-foreground/20">
          <h3 className="font-bold text-lg text-primary/90">Minhas Anotações</h3>
          <Textarea
            placeholder="Escreva suas anotações aqui..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={handleCancelNotes} 
              disabled={!hasNotesChanges || isSavingNotes}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNotes} 
              disabled={!hasNotesChanges || isSavingNotes}
            >
              {isSavingNotes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Anotações
            </Button>
          </div>
        </div>
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
          {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLastTask ? "Finalizar Jornada" : "Continuar"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuickReflectionPage;