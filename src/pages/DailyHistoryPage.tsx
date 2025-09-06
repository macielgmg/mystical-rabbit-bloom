import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle, XCircle, BookOpen, Sparkles, Lightbulb, Heart, Calendar as CalendarIcon } from 'lucide-react';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { AudioPlayer } from '@/components/AudioPlayer';
import { ProAudioPlaceholder } from '@/components/ProAudioPlaceholder';
import { Badge } from '@/components/ui/badge';

// Define interfaces for fetched data
interface DailyContentTemplate {
  id: string;
  content_type: string;
  title: string | null;
  text_content: string;
  reference: string | null;
  auxiliar_text: string | null;
  tags: string[] | null;
  explanation: string | null;
  url_audio: string | null;
}

interface DailyContentForUser {
  id: string;
  verse_of_the_day: string | null;
  daily_study: string | null;
  quick_reflection: string | null;
  inspirational_quotes: string | null;
  my_prayer: string | null;
  content_date: string;
}

interface DailyContentActual {
  verse_of_the_day: { text: string; reference: string; explanation: string | null; url_audio: string | null } | null;
  daily_study: { text: string; title: string | null; auxiliar_text: string | null; tags: string[] | null; url_audio: string | null } | null;
  quick_reflection: { text: string | null; auxiliar_text: string | null; url_audio: string | null } | null;
  inspirational_quotes: { text: string | null; auxiliar_text: string | null; url_audio: string | null } | null; // Adicionado auxiliar_text
  my_prayer: { text: string | null; auxiliar_text: string | null; url_audio: string | null } | null;
}

const DailyHistoryPage = () => {
  const { date } = useParams<{ date: string }>(); // Date in 'yyyy-MM-dd' format
  const navigate = useNavigate();
  const { session, isPro } = useSession();
  const [loading, setLoading] = useState(true);
  const [dailyContentIds, setDailyContentIds] = useState<DailyContentForUser | null>(null);
  const [actualDailyContent, setActualDailyContent] = useState<Partial<DailyContentActual> | null>(null);
  const [dailyTasksProgress, setDailyTasksProgress] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('');

  // States for historical daily progress
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [historyProgressPercentage, setHistoryProgressPercentage] = useState(0);

  const formattedDate = date ? format(parseISO(date), 'dd \'de\' MMMM, yyyy', { locale: ptBR }) : 'Data Inválida';

  const fetchDailyContentAndProgress = useCallback(async () => {
    if (!session?.user || !date) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = session.user.id;

    try {
      // 1. Fetch daily_content_for_users for the specific date
      const { data: contentIds, error: contentIdsError } = await supabase
        .from('daily_content_for_users')
        .select('*')
        .eq('user_id', userId)
        .eq('content_date', date)
        .single();

      if (contentIdsError && contentIdsError.code !== 'PGRST116') {
        throw contentIdsError;
      }

      setDailyContentIds(contentIds);

      const contentMap: Partial<DailyContentActual> = {};
      const templatePromises: Promise<any>[] = [];
      const availableContentIds: string[] = [];

      if (contentIds) {
        const templateFields: Array<keyof DailyContentForUser> = ['verse_of_the_day', 'daily_study', 'quick_reflection', 'inspirational_quotes', 'my_prayer'];

        for (const field of templateFields) {
          const templateId = contentIds[field];
          if (templateId) {
            availableContentIds.push(field);
            templatePromises.push(
              supabase.from('daily_content_templates')
                .select('text_content, reference, title, auxiliar_text, tags, explanation, url_audio')
                .eq('id', templateId)
                .single()
                .then(({ data, error }) => {
                  if (error) console.error(`Error fetching template for ${field}:`, error);
                  if (data) {
                    if (field === 'verse_of_the_day') {
                      contentMap[field] = { text: data.text_content, reference: data.reference || 'Versículo do Dia', explanation: data.explanation || null, url_audio: data.url_audio || null };
                    } else if (field === 'daily_study') {
                      contentMap[field] = { text: data.text_content, title: data.title || null, auxiliar_text: data.auxiliar_text || null, tags: data.tags || null, url_audio: data.url_audio || null };
                    } else if (field === 'quick_reflection') {
                      contentMap[field] = { text: data.text_content, auxiliar_text: data.auxiliar_text || null, url_audio: data.url_audio || null };
                    } else if (field === 'inspirational_quotes') { // Adicionado auxiliar_text para inspirational_quotes
                      contentMap[field] = { text: data.text_content, auxiliar_text: data.auxiliar_text || null, url_audio: data.url_audio || null };
                    } else if (field === 'my_prayer') {
                      contentMap[field] = { text: data.text_content, auxiliar_text: data.auxiliar_text || null, url_audio: data.url_audio || null };
                    }
                  }
                })
            );
          } else {
            contentMap[field] = null;
          }
        }
        await Promise.all(templatePromises);
        setActualDailyContent(contentMap);
        if (availableContentIds.length > 0) {
          setActiveTab(availableContentIds[0]);
        }
      } else {
        setActualDailyContent(null);
      }

      // 2. Fetch daily_tasks_progress for the specific date
      const { data: progressData, error: progressError } = await supabase
        .from('daily_tasks_progress')
        .select('task_name')
        .eq('user_id', userId)
        .eq('task_date', date);

      if (progressError) {
        throw progressError;
      }

      const completedTasksSet = new Set<string>();
      progressData?.forEach(task => completedTasksSet.add(task.task_name));
      
      const allCoreTasks = ['spiritual_journal', 'daily_study', 'quick_reflection', 'inspirational_quotes', 'my_prayer'];
      const currentDayTasksStatus: Record<string, boolean> = {};
      let currentDayCompletedCount = 0;

      currentDayTasksStatus['verse_of_the_day'] = true; 

      allCoreTasks.forEach(taskName => {
        const isCompleted = completedTasksSet.has(taskName);
        currentDayTasksStatus[taskName] = isCompleted;
        if (isCompleted) {
          currentDayCompletedCount++;
        }
      });

      setDailyTasksProgress(currentDayTasksStatus);
      setTotalTasksCount(allCoreTasks.length);
      setCompletedTasksCount(currentDayCompletedCount);
      setHistoryProgressPercentage(allCoreTasks.length > 0 ? (currentDayCompletedCount / allCoreTasks.length) * 100 : 0);

    } catch (error: any) {
      console.error("Error fetching daily history:", error);
      showError("Erro ao carregar o histórico diário: " + error.message);
      setActualDailyContent(null);
      setDailyContentIds(null);
    } finally {
      setLoading(false);
    }
  }, [session, date]);

  useEffect(() => {
    fetchDailyContentAndProgress();
  }, [fetchDailyContentAndProgress]);

  const getTaskCompletionIcon = (taskName: string) => {
    if (taskName === 'verse_of_the_day') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return dailyTasksProgress[taskName] ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dailyContentIds || !actualDailyContent || Object.values(actualDailyContent).every(val => val === null)) {
    return (
      <div className="container mx-auto max-w-2xl p-4">
        <header className="relative flex items-center justify-center py-4 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-primary">Histórico Diário</h1>
        </header>
        <div className="text-center text-muted-foreground py-16">
          <CalendarIcon className="h-24 w-24 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-lg">Nenhum conteúdo encontrado para {formattedDate}.</p>
          <p className="text-sm">Que tal começar uma nova jornada de fé hoje?</p>
          <Button onClick={() => navigate('/today')} className="mt-4">
            Voltar para Hoje
          </Button>
        </div>
      </div>
    );
  }

  const tabsConfig = [
    { id: 'verse_of_the_day', label: 'Versículo', icon: BookOpen, content: actualDailyContent.verse_of_the_day },
    { id: 'daily_study', label: 'Estudo', icon: BookOpen, content: actualDailyContent.daily_study },
    { id: 'quick_reflection', label: 'Reflexão', icon: Lightbulb, content: actualDailyContent.quick_reflection },
    { id: 'inspirational_quotes', label: 'Citação', icon: Sparkles, content: actualDailyContent.inspirational_quotes },
    { id: 'my_prayer', label: 'Oração', icon: Heart, content: actualDailyContent.my_prayer },
  ];

  const availableTabs = tabsConfig.filter(tab => tab.content !== null);

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
        <h1 className="text-xl font-bold text-primary">{formattedDate}</h1>
      </header>

      {/* Indicador de Progresso Diário */}
      <div className="w-full space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-primary/80">Progresso Diário</h3>
          <span className="text-sm text-muted-foreground">
            {completedTasksCount} de {totalTasksCount} tarefas ({historyProgressPercentage.toFixed(0)}%)
          </span>
        </div>
        <Progress value={historyProgressPercentage} className="h-2.5" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1 mb-6 h-auto p-1">
          {availableTabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="flex flex-col items-center gap-1 text-sm sm:text-base h-16 px-2 py-2"
            >
              {getTaskCompletionIcon(tab.id)}
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex-grow overflow-y-auto">
          {availableTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              <Card className="p-4 space-y-2">
                <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <tab.icon className="h-5 w-5 text-primary" /> {tab.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {tab.id === 'verse_of_the_day' && tab.content && (
                    <>
                      <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                        "{tab.content.text}"
                      </p>
                      <p className="text-sm font-semibold text-muted-foreground mt-2">
                        — {tab.content.reference}
                      </p>
                      {tab.content.explanation && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {tab.content.explanation}
                        </p>
                      )}
                      {tab.content.url_audio && (isPro ? (
                        <AudioPlayer src={tab.content.url_audio} className="mt-4" />
                      ) : (
                        <ProAudioPlaceholder className="mt-4" />
                      ))}
                    </>
                  )}
                  {tab.id === 'daily_study' && tab.content && (
                    <>
                      <h3 className="text-xl font-bold text-primary/90 mb-2">{tab.content.title}</h3>
                      <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                        "{tab.content.text}"
                      </p>
                      {tab.content.auxiliar_text && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {tab.content.auxiliar_text}
                        </p>
                      )}
                      {tab.content.tags && tab.content.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {tab.content.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="bg-white/50 text-gray-700 border-none px-2 py-0.5 text-xs font-medium">
                              {tag.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {tab.content.url_audio && (isPro ? (
                        <AudioPlayer src={tab.content.url_audio} className="mt-4" />
                      ) : (
                        <ProAudioPlaceholder className="mt-4" />
                      ))}
                    </>
                  )}
                  {tab.id === 'quick_reflection' && tab.content && (
                    <>
                      <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                        "{tab.content.text}"
                      </p>
                      {tab.content.auxiliar_text && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {tab.content.auxiliar_text}
                        </p>
                      )}
                      {tab.content.url_audio && (isPro ? (
                        <AudioPlayer src={tab.content.url_audio} className="mt-4" />
                      ) : (
                        <ProAudioPlaceholder className="mt-4" />
                      ))}
                    </>
                  )}
                  {tab.id === 'inspirational_quotes' && tab.content && (
                    <>
                      <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                        "{tab.content.text}"
                      </p>
                      {tab.content.auxiliar_text && ( // Adicionado: Exibir auxiliar_text
                        <p className="text-sm text-muted-foreground mt-2">
                          {tab.content.auxiliar_text}
                        </p>
                      )}
                      {tab.content.url_audio && (isPro ? (
                        <AudioPlayer src={tab.content.url_audio} className="mt-4" />
                      ) : (
                        <ProAudioPlaceholder className="mt-4" />
                      ))}
                    </>
                  )}
                  {tab.id === 'my_prayer' && tab.content && (
                    <>
                      <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                        "{tab.content.text}"
                      </p>
                      {tab.content.auxiliar_text && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {tab.content.auxiliar_text}
                        </p>
                      )}
                      {tab.content.url_audio && (isPro ? (
                        <AudioPlayer src={tab.content.url_audio} className="mt-4" />
                      ) : (
                        <ProAudioPlaceholder className="mt-4" />
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

export default DailyHistoryPage;