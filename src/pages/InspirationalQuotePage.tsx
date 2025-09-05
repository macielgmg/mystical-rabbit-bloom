import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles, Share2, CheckCircle, Headphones } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted } from '@/utils/dailyTasksSequence';
import { cn } from '@/lib/utils';

const InspirationalQuotePage = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [quoteContent, setQuoteContent] = useState<{ text: string | null; url_audio: string | null } | null>(null);
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

  const currentTaskName = 'inspirational_quotes';
  const completionStatus = {
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
  };

  const isLastTask = isLastTaskInSequenceAndAllCompleted(currentTaskName, { ...completionStatus, isInspirationalQuoteTaskCompleted: true });
  const nextTaskPath = getNextIncompleteTaskPath(currentTaskName, { ...completionStatus, isInspirationalQuoteTaskCompleted: true });

  useEffect(() => {
    const fetchQuote = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const userId = session.user.id;

      const { data: dailyContentData, error: dailyContentError } = await supabase
        .from('daily_content_for_users')
        .select('inspirational_quotes')
        .eq('user_id', userId)
        .eq('content_date', todayStr)
        .single();

      if (dailyContentError && dailyContentError.code !== 'PGRST116') {
        console.error("Erro ao buscar ID da citação inspiradora para o usuário:", dailyContentError);
        showError("Erro ao carregar a citação inspiradora.");
        setQuoteContent(null);
        setLoading(false);
        return;
      }

      const quoteTemplateId = dailyContentData?.inspirational_quotes;

      if (quoteTemplateId) {
        const { data: templateData, error: templateError } = await supabase
          .from('daily_content_templates')
          .select('text_content, url_audio')
          .eq('id', quoteTemplateId)
          .single();

        if (templateError) {
          console.error("Erro ao buscar conteúdo do template da citação:", templateError);
          showError("Erro ao carregar o conteúdo da citação.");
          setQuoteContent(null);
        } else if (templateData) {
          setQuoteContent({ text: templateData.text_content, url_audio: templateData.url_audio || null });
        } else {
          setQuoteContent(null);
        }
      } else {
        setQuoteContent(null);
      }
      setLoading(false);
    };
    fetchQuote();
  }, [session, navigate]);

  const handleShare = () => {
    if (navigator.share && quoteContent?.text) {
      navigator.share({
        title: 'Citação Inspiradora - Raízes da Fé',
        text: `Citação Inspiradora: "${quoteContent.text}"\n\nConfira o app Raízes da Fé!`,
        url: window.location.href,
      })
      .then(() => showSuccess('Citação compartilhada com sucesso!'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      const shareText = `Citação Inspiradora: "${quoteContent?.text || ''}"\n\nConfira o app Raízes da Fé: ${window.location.href}`;
      navigator.clipboard.writeText(shareText)
        .then(() => showSuccess('Citação copiada para a área de transferência!'))
        .catch(() => showError('Não foi possível copiar a citação.'));
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
      showSuccess("Citação inspiradora finalizada!");
      queryClient.invalidateQueries({ queryKey: ['inspirationalQuoteTaskStatus', userId] });
      
      if (nextTaskPath) {
        navigate(nextTaskPath);
      } else {
        navigate('/today');
      }
    } catch (error: any) {
      showError("Erro ao finalizar a citação: " + error.message);
      console.error("Erro ao finalizar citação:", error);
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
        <h1 className="text-xl font-bold text-primary">Citação Inspiradora</h1>
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
        {quoteContent?.text ? (
          <Card className="p-6 space-y-4 w-full">
            <CardHeader className="p-0 pb-2">
              <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-primary">Sua Citação de Hoje</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                "{quoteContent.text}"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Nenhuma citação disponível para hoje.</p>
            <p className="text-sm">Tente novamente mais tarde ou verifique sua conexão.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center py-4 gap-4">
        {quoteContent?.url_audio && (
          <Button 
            variant="outline" 
            onClick={() => window.open(quoteContent.url_audio!, '_blank')} 
            size="sm"
            className="w-fit px-3"
          >
            <Headphones className="h-4 w-4 mr-2" /> Ouvir
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={handleShare} 
          size="sm"
          className={cn("w-fit px-3", !quoteContent?.url_audio && "flex-1")}
          disabled={!quoteContent?.text}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button 
          onClick={handleCompleteTask} 
          className={cn("flex-1", quoteContent?.url_audio && "ml-auto")}
          disabled={isCompleting || !quoteContent?.text}
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

export default InspirationalQuotePage;