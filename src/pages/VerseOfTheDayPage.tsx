import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, BookOpen, Share2, CheckCircle, X } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/AudioPlayer';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted, isFirstTaskInSequence, getPreviousTaskPath } from '@/utils/dailyTasksSequence';
import { ProAudioPlaceholder } from '@/components/ProAudioPlaceholder';

const VerseOfTheDayPage = () => {
  const navigate = useNavigate();
  const { session, isPro } = useSession();
  const queryClient = useQueryClient();
  const [verseContent, setVerseContent] = useState<{ text: string; reference: string; url_audio: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  // isCompleting não é mais necessário para o Versículo do Dia, mas mantido para consistência de UI se o botão for reusado.
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
    isMyPrayerTaskCompleted, // Corrigido para isMyPrayerTaskCompleted
  } = useDailyTasksProgress();

  const currentTaskName = 'verse_of_the_day'; // Mantido para referência, mas não é uma tarefa na sequência
  const completionStatus = {
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
  };

  // A lógica de isLastTask e nextTaskPath agora se baseia na `dailyTaskSequence` sem o versículo.
  // Para o Versículo do Dia, o "próximo" é a primeira tarefa real da sequência.
  const firstRealTaskPath = getNextIncompleteTaskPath('start_of_day', completionStatus); // 'start_of_day' é um placeholder
  const nextPath = firstRealTaskPath || '/today'; // Se não houver tarefas, volta para /today

  // O Versículo do Dia não é uma tarefa na sequência, então não tem "anterior" ou "última tarefa" no mesmo sentido.
  // O botão "Voltar" deve ir para a página "Hoje".
  const previousTaskPath = '/today'; 
  const isFirstTask = true; // Consideramos o Versículo do Dia como o "primeiro" item do dia, mas não uma tarefa.

  useEffect(() => {
    const fetchVerse = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
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
          .select('text_content, reference, url_audio')
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

  const handleShare = () => {
    if (navigator.share && verseContent) {
      navigator.share({
        title: 'Versículo do Dia - Raízes da Fé',
        text: `"${verseContent.text}" — ${verseContent.reference}\n\nConfira o app Raízes da Fé!`,
        url: window.location.href,
      })
      .then(() => showSuccess('Versículo compartilhado com sucesso!'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      // Fallback para navegadores que não suportam a Web Share API
      const shareText = `"${verseContent?.text || ''}" — ${verseContent?.reference || 'Versículo do Dia'}\n\nConfira o app Raízes da Fé: ${window.location.href}`;
      navigator.clipboard.writeText(shareText)
        .then(() => showSuccess('Versículo copiado para a área de transferência!'))
        .catch(() => showError('Não foi possível copiar o versículo.'));
    }
  };

  const handleContinue = () => {
    // O Versículo do Dia não é uma tarefa, então apenas navega para a próxima etapa.
    navigate(nextPath);
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

      {/* Indicador de Progresso Diário (ainda exibido, mas o Versículo não contribui para ele) */}
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

        {/* Back Button (sempre volta para /today, pois não faz parte da sequência de tarefas) */}
        <Button 
          variant="outline" 
          onClick={() => navigate('/today')} 
          className="flex-1"
          disabled={isCompleting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        {/* Continue Button (agora apenas navega) */}
        <Button 
          onClick={handleContinue} 
          className="flex-1"
          disabled={isCompleting || !verseContent}
        >
          {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
            <>
              Continuar <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VerseOfTheDayPage;