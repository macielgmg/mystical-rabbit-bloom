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
import { VerseOfTheDay } from '@/components/VerseOfTheDay';
import { DailyStudyCard } from '@/components/DailyStudyCard';
import { QuickReflectionCard } from '@/components/QuickReflectionCard';
import { InspirationalQuoteCard } from '@/components/InspirationalQuoteCard';
import { MyPrayerCard } from '@/components/MyPrayerCard';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress'; // Reusing the hook for completion status

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

interface DailyTaskProgress {
  task_name: string;
  value: number | null;
  text_value: string | null;
}

const DailyHistoryPage = () => {
  const { date } = useParams<{ date: string }>(); // Date in 'yyyy-MM-dd' format
  const navigate = useNavigate();
  const { session, isPro } = useSession();
  const [loading, setLoading] = useState(true);
  const [dailyContentIds, setDailyContentIds] = useState<DailyContentForUser | null>(null);
  const [actualDailyContent, setActualDailyContent] = useState<{
    verse_of_the_day: { text: string; reference: string; explanation: string | null; url_audio: string | null } | null;
    daily_study: { text: string; title: string | null; auxiliar_text: string | null; tags: string[] | null; url_audio: string | null } | null;
    quick_reflection: { text: string | null; auxiliar_text: string | null; url_audio: string | null } | null;
    inspirational_quotes: { text: string | null; url_audio: string | null } | null;
    my_prayer: { text: string | null; auxiliar_text: string | null; url_audio: string | null } | null;
  } | null>(null);
  const [dailyTasksProgress, setDailyTasksProgress] = useState<Record<string, boolean>>({});

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

      if (contentIds) {
        const contentMap: Partial<typeof actualDailyContent> = {};
        const templatePromises: Promise<any>[] = [];

        const templateFields: Array<keyof DailyContentForUser> = ['verse_of_the_day', 'daily_study', 'quick_reflection', 'inspirational_quotes', 'my_prayer'];

        for (const field of templateFields) {
          const templateId = contentIds[field];
          if (templateId) {
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
                    } else if (['quick_reflection', 'inspirational_quotes', 'my_prayer'].includes(field)) {
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
        setActualDailyContent(contentMap as typeof actualDailyContent);
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

      const completedTasks = new Set<string>();
      progressData?.forEach(task => completedTasks.add(task.task_name));
      setDailyTasksProgress(Object.fromEntries(
        ['spiritual_journal', 'verse_of_the_day', 'daily_study', 'quick_reflection', 'inspirational_quotes', 'my_prayer']
        .map(taskName => [taskName, completedTasks.has(taskName)])
      ));

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dailyContentIds || !actualDailyContent) {
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
          <p className="text-sm">Parece que você não teve uma jornada de fé neste dia.</p>
          <Button onClick={() => navigate('/today')} className="mt-4">
            Voltar para Hoje
          </Button>
        </div>
      </div>
    );
  }

  const getTaskCompletionIcon = (taskName: string) => {
    return dailyTasksProgress[taskName] ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

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
        <h1 className="text-xl font-bold text-primary">Jornada em {formattedDate}</h1>
      </header>

      <div className="flex-grow flex flex-col space-y-4 overflow-y-auto pb-4">
        {/* Verse of the Day */}
        {actualDailyContent.verse_of_the_day && (
          <Card className="p-4 space-y-2">
            <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Versículo do Dia
              </CardTitle>
              {getTaskCompletionIcon('verse_of_the_day')}
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                "{actualDailyContent.verse_of_the_day.text}"
              </p>
              <p className="text-sm font-semibold text-muted-foreground mt-2">
                — {actualDailyContent.verse_of_the_day.reference}
              </p>
              {actualDailyContent.verse_of_the_day.explanation && (
                <p className="text-sm text-muted-foreground mt-2">
                  {actualDailyContent.verse_of_the_day.explanation}
                </p>
              )}
              {actualDailyContent.verse_of_the_day.url_audio && (isPro ? (
                <AudioPlayer src={actualDailyContent.verse_of_the_day.url_audio} className="mt-4" />
              ) : (
                <ProAudioPlaceholder className="mt-4" />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Daily Study */}
        {actualDailyContent.daily_study && (
          <Card className="p-4 space-y-2">
            <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Estudo Diário
              </CardTitle>
              {getTaskCompletionIcon('daily_study')}
            </CardHeader>
            <CardContent className="p-0">
              <h3 className="text-xl font-bold text-primary/90 mb-2">{actualDailyContent.daily_study.title}</h3>
              <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                "{actualDailyContent.daily_study.text}"
              </p>
              {actualDailyContent.daily_study.auxiliar_text && (
                <p className="text-sm text-muted-foreground mt-2">
                  {actualDailyContent.daily_study.auxiliar_text}
                </p>
              )}
              {actualDailyContent.daily_study.tags && actualDailyContent.daily_study.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {actualDailyContent.daily_study.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-white/50 text-gray-700 border-none px-2 py-0.5 text-xs font-medium">
                      {tag.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              )}
              {actualDailyContent.daily_study.url_audio && (isPro ? (
                <AudioPlayer src={actualDailyContent.daily_study.url_audio} className="mt-4" />
              ) : (
                <ProAudioPlaceholder className="mt-4" />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Reflection */}
        {actualDailyContent.quick_reflection && (
          <Card className="p-4 space-y-2">
            <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" /> Reflexão Rápida
              </CardTitle>
              {getTaskCompletionIcon('quick_reflection')}
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                "{actualDailyContent.quick_reflection.text}"
              </p>
              {actualDailyContent.quick_reflection.auxiliar_text && (
                <p className="text-sm text-muted-foreground mt-2">
                  {actualDailyContent.quick_reflection.auxiliar_text}
                </p>
              )}
              {actualDailyContent.quick_reflection.url_audio && (isPro ? (
                <AudioPlayer src={actualDailyContent.quick_reflection.url_audio} className="mt-4" />
              ) : (
                <ProAudioPlaceholder className="mt-4" />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Inspirational Quote */}
        {actualDailyContent.inspirational_quotes && (
          <Card className="p-4 space-y-2">
            <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Citação Inspiradora
              </CardTitle>
              {getTaskCompletionIcon('inspirational_quotes')}
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                "{actualDailyContent.inspirational_quotes.text}"
              </p>
              {actualDailyContent.inspirational_quotes.url_audio && (isPro ? (
                <AudioPlayer src={actualDailyContent.inspirational_quotes.url_audio} className="mt-4" />
              ) : (
                <ProAudioPlaceholder className="mt-4" />
              ))}
            </CardContent>
          </Card>
        )}

        {/* My Prayer */}
        {actualDailyContent.my_prayer && (
          <Card className="p-4 space-y-2">
            <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" /> Oração do Dia
              </CardTitle>
              {getTaskCompletionIcon('my_prayer')}
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                "{actualDailyContent.my_prayer.text}"
              </p>
              {actualDailyContent.my_prayer.auxiliar_text && (
                <p className="text-sm text-muted-foreground mt-2">
                  {actualDailyContent.my_prayer.auxiliar_text}
                </p>
              )}
              {actualDailyContent.my_prayer.url_audio && (isPro ? (
                <AudioPlayer src={actualDailyContent.my_prayer.url_audio} className="mt-4" />
              ) : (
                <ProAudioPlaceholder className="mt-4" />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-center py-4 flex-shrink-0">
        <Button onClick={() => navigate('/today')} className="w-full">
          Voltar para Hoje
        </Button>
      </div>
    </div>
  );
};

export default DailyHistoryPage;