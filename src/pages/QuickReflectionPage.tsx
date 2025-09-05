import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Lightbulb, Share2, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted } from '@/utils/dailyTasksSequence';
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/AudioPlayer'; // Importar AudioPlayer

const QuickReflectionPage = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [reflectionContent, setReflectionContent] = useState<{ text: string | null; url_audio: string | null } | null>(null);
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

  useEffect(() => {
    const fetchReflection = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const userId = session.user.id;

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
      setLoading(false);
    };
    fetchReflection();
  }, [session, navigate]);

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
          value: 1,
        }, { onConflict: 'user_id,task_name,task_date' });

      if (error) {
        throw error;
      }
      showSuccess("Reflexão rápida finalizada!");
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
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Nenhuma reflexão disponível para hoje.</p>
            <p className="text-sm">Tente novamente mais tarde ou verifique sua conexão.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center py-4 gap-4">
        {reflectionContent?.url_audio && (
          <AudioPlayer src={reflectionContent.url_audio} className="flex-1" />
        )}
        <Button 
          variant="outline" 
          onClick={handleShare} 
          size="sm"
          className={cn("w-fit px-3", !reflectionContent?.url_audio && "flex-1")}
          disabled={!reflectionContent?.text}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button 
          onClick={handleCompleteTask} 
          className={cn("flex-1", reflectionContent?.url_audio && "ml-auto")}
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