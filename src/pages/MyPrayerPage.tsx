import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Heart, Share2, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted } from '@/utils/dailyTasksSequence'; // Importar utilitários

const MyPrayerPage = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [prayerContent, setPrayerContent] = useState<string | null>(null);
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

  const currentTaskName = 'my_prayer';
  const completionStatus = {
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
  };

  const isLastTask = isLastTaskInSequenceAndAllCompleted(currentTaskName, { ...completionStatus, isMyPrayerTaskCompleted: true });
  const nextTaskPath = getNextIncompleteTaskPath(currentTaskName, { ...completionStatus, isMyPrayerTaskCompleted: true });

  useEffect(() => {
    const fetchPrayer = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const userId = session.user.id;

      const { data: dailyContentData, error: dailyContentError } = await supabase
        .from('daily_content_for_users')
        .select('my_prayer')
        .eq('user_id', userId)
        .eq('content_date', todayStr)
        .single();

      if (dailyContentError && dailyContentError.code !== 'PGRST116') {
        console.error("Erro ao buscar ID da oração do dia para o usuário:", dailyContentError);
        showError("Erro ao carregar a oração do dia.");
        setPrayerContent(null);
        setLoading(false);
        return;
      }

      const prayerTemplateId = dailyContentData?.my_prayer;

      if (prayerTemplateId) {
        const { data: templateData, error: templateError } = await supabase
          .from('daily_content_templates')
          .select('text_content')
          .eq('id', prayerTemplateId)
          .single();

        if (templateError) {
          console.error("Erro ao buscar conteúdo do template da oração:", templateError);
          showError("Erro ao carregar o conteúdo da oração.");
          setPrayerContent(null);
        } else if (templateData) {
          setPrayerContent(templateData.text_content);
        } else {
          setPrayerContent(null);
        }
      } else {
        setPrayerContent(null);
      }
      setLoading(false);
    };
    fetchPrayer();
  }, [session, navigate]);

  const handleShare = () => {
    if (navigator.share && prayerContent) {
      navigator.share({
        title: 'Oração do Dia - Raízes da Fé',
        text: `Oração do Dia: "${prayerContent}"\n\nConfira o app Raízes da Fé!`,
        url: window.location.href,
      })
      .then(() => showSuccess('Oração compartilhada com sucesso!'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      const shareText = `Oração do Dia: "${prayerContent || ''}"\n\nConfira o app Raízes da Fé: ${window.location.href}`;
      navigator.clipboard.writeText(shareText)
        .then(() => showSuccess('Oração copiada para a área de transferência!'))
        .catch(() => showError('Não foi possível copiar a oração.'));
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
      showSuccess("Oração do dia finalizada!");
      queryClient.invalidateQueries({ queryKey: ['myPrayerTaskStatus', userId] });
      
      if (nextTaskPath) {
        navigate(nextTaskPath);
      } else {
        navigate('/today');
      }
    } catch (error: any) {
      showError("Erro ao finalizar a oração: " + error.message);
      console.error("Erro ao finalizar oração:", error);
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
        <h1 className="text-xl font-bold text-primary">Oração do Dia</h1>
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
        {prayerContent ? (
          <Card className="p-6 space-y-4 w-full">
            <CardHeader className="p-0 pb-2">
              <Heart className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-primary">Sua Oração de Hoje</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                "{prayerContent}"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Nenhuma oração disponível para hoje.</p>
            <p className="text-sm">Tente novamente mais tarde ou verifique sua conexão.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center py-4 gap-4">
        <Button 
          variant="outline" 
          onClick={handleShare} 
          size="sm"
          className="w-fit px-3"
          disabled={!prayerContent}
        >
          <Share2 className="h-4 w-4 mr-2" />
        </Button>
        <Button 
          onClick={handleCompleteTask} 
          className="flex-1"
          disabled={isCompleting || !prayerContent}
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

export default MyPrayerPage;