import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, BookOpen, Share2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/AudioPlayer'; // Importar AudioPlayer

const VerseOfTheDayPage = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [verseContent, setVerseContent] = useState<{ text: string; reference: string; url_audio: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  // Removido isCompleting, pois esta tarefa não tem botão de finalizar

  const { completedDailyTasksCount, totalDailyTasks, dailyProgressPercentage, isLoadingAnyDailyTask } = useDailyTasksProgress();

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
        url: window.location.href, // Ou um link mais genérico para o app
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

  // Removido handleCompleteVerse, pois esta tarefa não tem botão de finalizar

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
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Nenhum versículo disponível para hoje.</p>
            <p className="text-sm">Tente novamente mais tarde ou verifique sua conexão.</p>
          </div>
        )}
      </div>

      <div className="flex justify-center items-center py-4 gap-4">
        {verseContent?.url_audio && (
          <AudioPlayer src={verseContent.url_audio} className="flex-1" />
        )}
        <Button 
          variant="outline" 
          onClick={handleShare} 
          size="sm"
          className={cn("w-fit px-3", !verseContent?.url_audio && "flex-1")}
          disabled={!verseContent}
        >
          <Share2 className="h-4 w-4 mr-2" /> Compartilhar
        </Button>
        <Button 
          onClick={() => navigate('/today')} 
          className={cn("flex-1", verseContent?.url_audio && "ml-auto")}
        >
          Voltar para Hoje
        </Button>
      </div>
    </div>
  );
};

export default VerseOfTheDayPage;