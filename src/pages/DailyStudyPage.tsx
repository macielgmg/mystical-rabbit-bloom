import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, BookOpen, Share2, CheckCircle, Tag, Settings, Info, X } from 'lucide-react'; // Adicionado X
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted, isFirstTaskInSequence, getPreviousTaskPath } from '@/utils/dailyTasksSequence';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ProAudioPlaceholder } from '@/components/ProAudioPlaceholder'; // Importar o novo componente

const DailyStudyPage = () => {
  const navigate = useNavigate();
  const { session, preferences, isPro } = useSession(); // Adicionado isPro
  const queryClient = useQueryClient();
  const [studyContent, setStudyContent] = useState<{ text: string; title: string | null; reflection: string | null; tags: string[] | null; url_audio: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

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

  const currentTaskName = 'daily_study';
  const completionStatus = {
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
  };

  const isLastTask = isLastTaskInSequenceAndAllCompleted(currentTaskName, { ...completionStatus, isDailyStudyTaskCompleted: true });
  const nextTaskPath = getNextIncompleteTaskPath(currentTaskName, { ...completionStatus, isDailyStudyTaskCompleted: true });
  const previousTaskPath = getPreviousTaskPath(currentTaskName);
  const isFirstTask = isFirstTaskInSequence(currentTaskName);

  useEffect(() => {
    const fetchStudy = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const userId = session.user.id;

      const { data: dailyContentData, error: dailyContentError } = await supabase
        .from('daily_content_for_users')
        .select('daily_study')
        .eq('user_id', userId)
        .eq('content_date', todayStr)
        .single();

      if (dailyContentError && dailyContentError.code !== 'PGRST116') {
        console.error("Erro ao buscar ID do estudo diário para o usuário:", dailyContentError);
        showError("Erro ao carregar o estudo diário.");
        setStudyContent(null);
        setLoading(false);
        return;
      }

      const studyTemplateId = dailyContentData?.daily_study;

      if (studyTemplateId) {
        const { data: templateData, error: templateError } = await supabase
          .from('daily_content_templates')
          .select('text_content, title, reflection, tags, url_audio')
          .eq('id', studyTemplateId)
          .single();

        if (templateError) {
          console.error("Erro ao buscar conteúdo do template do estudo:", templateError);
          showError("Erro ao carregar o conteúdo do estudo.");
          setStudyContent(null);
        } else if (templateData) {
          setStudyContent({
            text: templateData.text_content,
            title: templateData.title || 'Estudo Diário',
            reflection: templateData.reflection || null,
            tags: templateData.tags || null,
            url_audio: templateData.url_audio || null,
          });
        } else {
          setStudyContent(null);
        }
      } else {
        setStudyContent(null);
      }
      setLoading(false);
    };
    fetchStudy();
  }, [session, navigate]);

  const handleShare = () => {
    if (navigator.share && studyContent) {
      const shareText = `Estudo Diário: ${studyContent.title || 'Sem Título'}\n\n"${studyContent.text}"\n\n${studyContent.reflection ? `Reflexão: ${studyContent.reflection}\n\n` : ''}Confira o app Raízes da Fé!`;
      navigator.share({
        title: 'Estudo Diário - Raízes da Fé',
        text: shareText,
        url: window.location.href,
      })
      .then(() => showSuccess('Estudo compartilhado com sucesso!'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      const shareText = `Estudo Diário: ${studyContent?.title || 'Sem Título'}\n\n"${studyContent?.text || ''}"\n\n${studyContent?.reflection ? `Reflexion: ${studyContent.reflection}\n\n` : ''}Confira o app Raízes da Fé: ${window.location.href}`;
      navigator.clipboard.writeText(shareText)
        .then(() => showSuccess('Estudo copiado para a área de transferência!'))
        .catch(() => showError('Não foi possível copiar o estudo.'));
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
      
      if (nextTaskPath) {
        navigate(nextTaskPath);
      } else {
        navigate('/today');
      }
    } catch (error: any) {
      showError("Erro ao finalizar o estudo: " + error.message);
      console.error("Erro ao finalizar estudo:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const getUserPreferencesLabels = () => {
    if (!preferences) return [];
    try {
      const parsedPreferences = JSON.parse(preferences);
      const interests = Array.isArray(parsedPreferences) ? parsedPreferences : [];
      
      const interestsQuestionOptions = [
        { value: 'profecias-biblicas', label: 'Profecias Bíblicas' },
        { value: 'personagens-biblicos', label: 'Estudos de Personagens Bíblicos' },
        { value: 'historia-israel', label: 'História do Povo de Israel' },
        { value: 'teologia-sistematica', label: 'Teologia Sistemática' },
        { value: 'apocalipse-escatologia', label: 'Apocalipse e Escatologia' },
        { value: 'vida-jesus', label: 'Vida de Jesus Cristo' },
        { value: 'parabolas-jesus', label: 'Parábolas de Jesus' },
        { value: 'cartas-paulinas', label: 'Cartas Paulinas' },
        { value: 'livros-poeticos', label: 'Livros Poéticos (Salmos, Provérbios)' },
        { value: 'doutrinas-fundamentais', label: 'Doutrinas Fundamentais da Fé' },
        { value: 'arqueologia-biblica', label: 'Arqueologia Bíblica' },
        { value: 'etica-crista', label: 'Ética Cristã e Vida Diária' },
        { value: 'missoes-evangelismo', label: 'Missões e Evangelismo' },
        { value: 'espirito-santo', label: 'O Espírito Santo' },
        { value: 'adoracao-louvor', label: 'Adoração e Louvor' },
      ];

      return interests.map((interestValue: string) => {
        const option = interestsQuestionOptions.find(opt => opt.value === interestValue);
        return option ? option.label : interestValue;
      });

    } catch (error) {
      console.error("Erro ao analisar preferências para interesses:", error);
      return [];
    }
  };

  const userInterests = getUserPreferencesLabels();

  const truncateTag = (tag: string, maxLength: number) => {
    if (tag.length > maxLength) {
      return tag.substring(0, maxLength - 3) + '...';
    }
    return tag;
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
        <h1 className="text-xl font-bold text-primary">Estudo Diário</h1>
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
        {studyContent ? (
          <>
            <Card className="p-6 space-y-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-3xl font-bold text-primary">{studyContent.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {studyContent.tags && studyContent.tags.length > 0 && (
                  <div 
                    className={cn(
                      "relative flex gap-1 mb-4 cursor-pointer items-center",
                      showAllTags ? "flex-wrap" : "flex-nowrap overflow-hidden max-h-[24px]"
                    )}
                    onClick={() => setShowAllTags(!showAllTags)}
                  >
                    {studyContent.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-white/50 text-gray-700 border-none px-2 py-0.5 text-xs font-medium flex-shrink-0 whitespace-nowrap"
                      >
                        <Tag className="h-3 w-3 mr-1" /> {showAllTags ? tag.toUpperCase() : truncateTag(tag.toUpperCase(), 12)}
                      </Badge>
                    ))}
                    {!showAllTags && studyContent.tags.some(tag => tag.length > 12 || studyContent.tags.length > 3) && (
                      <span className="text-primary text-xs font-semibold ml-1">...</span>
                    )}
                  </div>
                )}
                <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                  "{studyContent.text}"
                </p>
                {studyContent.reflection && (
                  <div className="mt-6 pt-4 border-t border-muted-foreground/20 text-left">
                    <h3 className="text-xl font-bold text-primary/90 mb-2">Para Refletir</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {studyContent.reflection}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {studyContent.url_audio && (isPro ? (
              <AudioPlayer src={studyContent.url_audio} className="mb-4" />
            ) : (
              <ProAudioPlaceholder className="mb-4" />
            ))}

            {/* Seção "Por que este estudo?" agora colapsável e menor */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="why-this-study" className="border-none">
                <Card className="p-0 space-y-0 bg-secondary/50">
                  <AccordionTrigger className="flex items-center justify-between rounded-lg p-3 text-base font-semibold text-primary hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" /> Por que este estudo?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                    <div className="space-y-3 text-muted-foreground">
                      <p className="text-sm">
                        Este estudo foi selecionado para você com base nos seus interesses e preferências.
                        Nossa intenção é oferecer conteúdo relevante que o ajude a crescer em sua jornada de fé.
                      </p>
                      {userInterests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="font-semibold text-primary/90 text-xs">Seus interesses:</span>
                          {userInterests.map((interest, index) => (
                            <Badge key={index} variant="outline" className="bg-white/50 text-gray-700 border-primary/20 px-2 py-0.5 text-xs font-medium">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Button asChild variant="link" className="p-0 h-auto text-primary justify-start text-sm">
                        <Link to="/preferences" className="flex items-center gap-1">
                          <Settings className="h-4 w-4" /> Alterar meus interesses
                        </Link>
                      </Button>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
          </>
        ) : (
          <div className="text-center text-muted-foreground flex-grow flex flex-col justify-center items-center">
            <BookOpen className="h-24 w-24 text-muted-foreground/50 mb-4" />
            <p className="text-lg">Nenhum estudo disponível para hoje.</p>
            <p className="text-sm">Tente novamente mais tarde ou verifique sua conexão.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center py-4 gap-2 flex-shrink-0">
        {/* Share Button */}
        <Button 
          variant="outline" 
          onClick={handleShare} 
          size="icon" 
          className="h-10 w-10 flex-shrink-0"
          disabled={!studyContent}
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
          disabled={isCompleting || !studyContent}
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

export default DailyStudyPage;