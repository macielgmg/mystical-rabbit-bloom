import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, BookOpen, Share2, CheckCircle } from 'lucide-react'; // Adicionado Share2 e CheckCircle
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query'; // Importar useQueryClient

const VerseOfTheDayPage = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const queryClient = useQueryClient(); // Inicializar useQueryClient
  const [verseContent, setVerseContent] = useState<{ text: string; reference: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

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
          .select('text_content, reference')
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

  const handleCompleteVerse = async () => {
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
          task_name: 'verse_of_the_day',
          task_date: today,
          value: 1, // Indica que a tarefa foi concluída
        }, { onConflict: 'user_id,task_name,task_date' });

      if (error) {
        throw error;
      }
      showSuccess("Versículo do dia finalizado!");
      queryClient.invalidateQueries({ queryKey: ['verseOfTheDayTaskStatus', userId] }); // Invalida a query para atualizar o status na página Today
      navigate('/today');
    } catch (error: any) {
      showError("Erro ao finalizar o versículo: " + error.message);
      console.error("Erro ao finalizar versículo:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
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

      <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4"> {/* Ajustado space-y */}
        {verseContent ? (
          <div className="space-y-4">
            <BookOpen className="h-20 w-20 text-primary mx-auto" /> {/* Ícone um pouco menor */}
            <p className="text-2xl font-serif italic text-primary/90 leading-relaxed"> {/* Texto menor */}
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

      <div className="flex justify-between items-center py-4 gap-4"> {/* Botões na parte inferior */}
        <Button 
          variant="outline" 
          onClick={handleShare} 
          className="flex-1 max-w-[150px]" // Botão de compartilhar menor
          disabled={!verseContent}
        >
          <Share2 className="h-4 w-4 mr-2" /> Compartilhar
        </Button>
        <Button 
          onClick={handleCompleteVerse} 
          className="flex-1" // Botão de finalizar maior
          disabled={isCompleting || !verseContent}
        >
          {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          Finalizar Estudo
        </Button>
      </div>
    </div>
  );
};

export default VerseOfTheDayPage;