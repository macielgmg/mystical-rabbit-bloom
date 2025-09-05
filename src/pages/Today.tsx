import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Flame, Calendar as CalendarIcon } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { SpiritualJournalTask } from '@/components/SpiritualJournalTask';
import { DailyStudyTask } from '@/components/DailyStudyTask';
import WeekCalendar from '@/components/WeekCalendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VerseOfTheDay } from '@/components/VerseOfTheDay';
import { QuickReflectionTask } from '@/components/QuickReflectionTask';
import { InspirationalQuoteTask } from '@/components/InspirationalQuoteTask';
import { MyPrayerTask } from '@/components/MyPrayerTask';
import { format, isSameDay, parseISO, startOfWeek, addDays } from 'date-fns';
import { getVerseOfTheDay } from "@/content/dailyVerses";
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { DailySummaryModal } from '@/components/DailySummaryModal'; // Importar o novo modal
import { showError } from '@/utils/toast'; // Importar showError para feedback ao usuário

// Tipagem para os IDs dos templates armazenados em daily_content_for_users
interface DailyContentTemplateIds {
  id: string;
  verse_of_the_day: string | null;
  daily_study: string | null;
  quick_reflection: string | null;
  inspirational_quotes: string | null;
  my_prayer: string | null;
  updated_at: string;
  content_date: string; // Adicionado para facilitar a verificação de datas
}

// Tipagem para o conteúdo real (texto) a ser exibido
interface DailyContentActual {
  verse_of_the_day: { text: string; reference: string; explanation: string | null; url_audio: string | null } | null;
  daily_study: { text: string; title: string | null; auxiliar_text: string | null; tags: string[] | null; url_audio: string | null } | null;
  quick_reflection: { text: string | null; auxiliar_text: string | null; url_audio: string | null } | null;
  inspirational_quotes: { text: string | null; url_audio: string | null } | null;
  my_prayer: { text: string | null; auxiliar_text: string | null; url_audio: string | null } | null;
}

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

const fetchStreakData = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('streak_count, last_streak_date')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

const fetchContentTemplates = async (contentType: string, userTags: string[]): Promise<DailyContentTemplate[]> => {
  const { data, error } = await supabase
    .from('daily_content_templates')
    .select('*')
    .eq('content_type', contentType);

  if (error) {
    console.error(`Erro ao buscar templates para ${contentType}:`, error);
    return [];
  }

  const matchingTemplates = data.filter(template => 
    template.tags && template.tags.some(tag => userTags.includes(tag))
  );

  return matchingTemplates.length > 0 ? matchingTemplates : data;
};

const Today = () => {
  const { session, fullName, avatarUrl, preferences, quizResponses } = useSession();
  const queryClient = useQueryClient();
  const [actualDailyContent, setActualDailyContent] = useState<DailyContentActual | null>(null);
  const [loadingDailyContent, setLoadingDailyContent] = useState(true);
  const [datesWithDailyContent, setDatesWithDailyContent] = useState<Set<string>>(new Set()); // Novo estado
  const [selectedDateForSummary, setSelectedDateForSummary] = useState<Date | null>(null); // Estado para a data clicada no calendário

  // Usar o novo hook para o progresso das tarefas diárias
  const { 
    completedDailyTasksCount, 
    totalDailyTasks, 
    dailyProgressPercentage, 
    isLoadingAnyDailyTask,
    isJournalCompleted,
    isVerseOfTheDayTaskCompleted, // Mantido para o componente VerseOfTheDayTask, mas não para o progresso geral
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
  } = useDailyTasksProgress();

  const { data: streakData, isLoading: loadingStreak } = useQuery({
    queryKey: ['streakData', session?.user?.id],
    queryFn: () => fetchStreakData(session!.user!.id),
    enabled: !!session?.user,
  });

  const updateStreakMutation = useMutation({
    mutationFn: async (newStreakData: { streak_count: number, last_streak_date: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update(newStreakData)
        .eq('id', session!.user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streakData', session?.user?.id] });
    },
    onError: (error) => {
      console.error("Error updating streak:", error);
    }
  });

  const populateAndFetchDailyContent = async () => {
    if (!session?.user) {
      setLoadingDailyContent(false);
      setActualDailyContent(null);
      setDatesWithDailyContent(new Set()); // Limpa o estado
      return;
    }

    setLoadingDailyContent(true);
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const userId = session.user.id;

    // --- Lógica para buscar conteúdo da semana para o calendário ---
    const weekStartsOn = 0; // 0 para Domingo
    const startOfWeekDate = startOfWeek(today, { weekStartsOn });
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      weekDates.push(format(addDays(startOfWeekDate, i), 'yyyy-MM-dd'));
    }

    const { data: weekContentData, error: weekContentError } = await supabase
      .from('daily_content_for_users')
      .select('content_date')
      .eq('user_id', userId)
      .in('content_date', weekDates);

    if (weekContentError) {
      console.error("Erro ao buscar conteúdo da semana para o calendário:", weekContentError);
    } else if (weekContentData) {
      const dates = new Set(weekContentData.map(item => item.content_date));
      setDatesWithDailyContent(dates);
    }
    // --- Fim da lógica para buscar conteúdo da semana ---


    let currentDailyContentIds: DailyContentTemplateIds | null = null;

    const { data: existingContentIds, error: fetchError } = await supabase
      .from('daily_content_for_users')
      .select('*')
      .eq('user_id', userId)
      .eq('content_date', todayStr)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Erro ao buscar IDs de conteúdo diário:", fetchError);
      setActualDailyContent({
        verse_of_the_day: { text: "Erro ao carregar versículo do dia.", reference: "Erro", explanation: null, url_audio: null },
        daily_study: { text: "Erro ao carregar estudo diário.", title: null, auxiliar_text: null, tags: null, url_audio: null },
        quick_reflection: { text: "Erro ao carregar reflexão.", auxiliar_text: null, url_audio: null },
        inspirational_quotes: { text: "Erro ao carregar citação.", url_audio: null },
        my_prayer: { text: "Erro ao carregar oração.", auxiliar_text: null, url_audio: null },
      });
      setLoadingDailyContent(false);
      return;
    }

    let needsUpdate = true;
    if (existingContentIds && existingContentIds.updated_at) {
      const lastUpdateDate = parseISO(existingContentIds.updated_at);
      if (isSameDay(lastUpdateDate, today)) {
        needsUpdate = false;
        currentDailyContentIds = existingContentIds;
      }
    }

    if (needsUpdate) {
      let userTags: string[] = [];
      try {
        if (preferences) {
          const parsedPreferences = JSON.parse(preferences);
          if (Array.isArray(parsedPreferences)) userTags = [...userTags, ...parsedPreferences];
        }
        if (quizResponses) {
          const parsedQuizResponses = JSON.parse(quizResponses);
          if (Array.isArray(parsedQuizResponses.q6)) userTags = [...userTags, ...parsedQuizResponses.q6];
        }
      } catch (e) {
        console.error("Erro ao analisar preferências/quizResponses:", e);
      }
      
      const contentTypes = ['verse_of_the_day', 'daily_study', 'quick_reflection', 'inspirational_quotes', 'my_prayer'];
      const newDailyContentIds: Partial<DailyContentTemplateIds> = {};

      for (const type of contentTypes) {
        const templates = await fetchContentTemplates(type, userTags);
        if (templates.length > 0) {
          const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
          newDailyContentIds[type as keyof DailyContentTemplateIds] = selectedTemplate.id;
        }
      }

      const { data: upsertedContentIds, error: upsertError } = await supabase
        .from('daily_content_for_users')
        .upsert({
          user_id: userId,
          content_date: todayStr,
          ...newDailyContentIds,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,content_date' })
        .select('*')
        .single();

      if (upsertError) {
        console.error("Erro ao upsert conteúdo diário personalizado:", upsertError);
        setActualDailyContent({
          verse_of_the_day: { text: "Erro ao carregar versículo do dia.", reference: "Erro", explanation: null, url_audio: null },
          daily_study: { text: "Erro ao carregar estudo diário.", title: null, auxiliar_text: null, tags: null, url_audio: null },
          quick_reflection: { text: "Erro ao carregar reflexão.", auxiliar_text: null, url_audio: null },
          inspirational_quotes: { text: "Erro ao carregar citação.", url_audio: null },
          my_prayer: { text: "Erro ao carregar oração.", auxiliar_text: null, url_audio: null },
        });
        setLoadingDailyContent(false);
        return;
      }
      currentDailyContentIds = upsertedContentIds;
    }

    if (currentDailyContentIds) {
      const contentPromises = [];
      const contentMap: Partial<DailyContentActual> = {};

      const templateTypes = {
        verse_of_the_day: currentDailyContentIds.verse_of_the_day,
        daily_study: currentDailyContentIds.daily_study,
        quick_reflection: currentDailyContentIds.quick_reflection,
        inspirational_quotes: currentDailyContentIds.inspirational_quotes,
        my_prayer: currentDailyContentIds.my_prayer,
      };

      for (const [key, templateId] of Object.entries(templateTypes)) {
        if (templateId) {
          contentPromises.push(
            supabase.from('daily_content_templates')
              .select('text_content, reference, title, auxiliar_text, tags, explanation, url_audio')
              .eq('id', templateId)
              .single()
              .then(({ data, error }) => {
                if (error) {
                  console.error(`Erro ao buscar template para ${key} (ID: ${templateId}):`, error);
                  return null;
                }
                if (key === 'verse_of_the_day' && data) {
                  return { text: data.text_content, reference: data.reference || 'Versículo do Dia', explanation: data.explanation || null, url_audio: data.url_audio || null };
                }
                if (key === 'daily_study' && data) {
                    return { text: data.text_content, title: data.title || null, auxiliar_text: data.auxiliar_text || null, tags: data.tags || null, url_audio: data.url_audio || null };
                }
                // Para quick_reflection, inspirational_quotes, my_prayer, retornamos um objeto com text_content e url_audio
                if (['quick_reflection', 'inspirational_quotes', 'my_prayer'].includes(key) && data) {
                    return { text: data.text_content, auxiliar_text: data.auxiliar_text || null, url_audio: data.url_audio || null };
                }
                return null; // Fallback
              })
              .then(content => {
                contentMap[key as keyof DailyContentActual] = content;
              })
          );
        } else {
          contentMap[key as keyof DailyContentActual] = null;
        }
      }

      await Promise.all(contentPromises);
      setActualDailyContent(contentMap as DailyContentActual);
    } else {
      const localVerse = getVerseOfTheDay();
      setActualDailyContent({
        verse_of_the_day: { ...localVerse, explanation: "Este é um versículo padrão. Uma explicação mais detalhada estaria disponível com conteúdo dinâmico.", url_audio: null },
        daily_study: null,
        quick_reflection: null,
        inspirational_quotes: null,
        my_prayer: null,
      });
    }
    setLoadingDailyContent(false);
  };

  useEffect(() => {
    populateAndFetchDailyContent();
  }, [session, preferences, quizResponses]);

  useEffect(() => {
    if (streakData && session?.user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastDateStr = streakData.last_streak_date;
      const lastDate = lastDateStr ? new Date(new Date(lastDateStr).toLocaleString("en-US", { timeZone: "UTC" })) : null;
      if (lastDate) {
        lastDate.setHours(0, 0, 0, 0);
      }

      let newStreak = streakData.streak_count || 0;
      let needsUpdate = false;

      if (lastDate) {
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak++;
          needsUpdate = true;
        } else if (diffDays > 1) {
          newStreak = 1;
          needsUpdate = true;
        }
      } else {
        newStreak = 1;
        needsUpdate = true;
      }

      if (needsUpdate) {
        updateStreakMutation.mutate({
          streak_count: newStreak,
          last_streak_date: today.toISOString().split('T')[0],
        });
      }
    }
  }, [streakData, session, updateStreakMutation]);

  const getInitials = (name: string | null | undefined) => {
    if (name) {
      const names = name.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleDayClick = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    if (datesWithDailyContent.has(formattedDate)) {
      setSelectedDateForSummary(date);
    } else {
      showError("Nenhum conteúdo diário disponível para esta data.");
    }
  };

  const handleCloseSummaryModal = () => {
    setSelectedDateForSummary(null);
  };

  const isLoadingAny = isLoadingAnyDailyTask || loadingStreak || loadingDailyContent;

  return (
    <div className="container mx-auto max-w-2xl h-full flex flex-col space-y-4">
      <Card className="flex-shrink-0">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-gradient-to-br from-green-200 to-blue-200">
                <AvatarImage src={avatarUrl || undefined} alt="Foto do perfil" />
                <AvatarFallback className="text-lg font-bold text-primary bg-transparent">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-primary">Jornada de Hoje</h1>
                <p className="text-sm text-muted-foreground">O amor de Deus em detalhes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-primary font-bold">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{isLoadingAny ? <Loader2 className="h-4 w-4 animate-spin" /> : (streakData?.streak_count || 0)}</span>
              </div>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <WeekCalendar datesWithDailyContent={datesWithDailyContent} onDayClick={handleDayClick} /> {/* Passa o novo prop e handler */}
          {/* Indicador de Progresso Diário */}
          <div className="w-full space-y-2 pt-3 border-t border-muted-foreground/20">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-primary/80">Progresso Diário</h3>
              <span className="text-sm text-muted-foreground">
                {completedDailyTasksCount} de {totalDailyTasks} tarefas ({dailyProgressPercentage.toFixed(0)}%)
              </span>
            </div>
            <Progress value={dailyProgressPercentage} className="h-2.5" />
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
        {isLoadingAny ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <VerseOfTheDay verseContent={actualDailyContent?.verse_of_the_day} loading={loadingDailyContent} className="flex-shrink-0" />
            
            <div>
              <h2 className="text-xl font-bold text-primary pb-2">Sua Jornada Diária</h2>
              
              <SpiritualJournalTask 
                initialIsCompleted={isJournalCompleted || false}
                className="mb-4" 
              />
              <DailyStudyTask
                initialIsCompleted={isDailyStudyTaskCompleted || false}
                tags={actualDailyContent?.daily_study?.tags || null}
                className="mb-4"
              />
              <QuickReflectionTask
                initialIsCompleted={isQuickReflectionTaskCompleted || false}
                contentSnippet={actualDailyContent?.quick_reflection?.text || null}
                className="mb-4"
              />
              <InspirationalQuoteTask
                initialIsCompleted={isInspirationalQuoteTaskCompleted || false}
                contentSnippet={actualDailyContent?.inspirational_quotes?.text || null}
                className="mb-4"
              />
              <MyPrayerTask
                initialIsCompleted={isMyPrayerTaskCompleted || false}
                contentSnippet={actualDailyContent?.my_prayer?.text || null}
                className="mb-4"
              />
            </div>
          </>
        )}
      </div>

      {/* Renderiza o modal de resumo diário se uma data for selecionada */}
      <DailySummaryModal date={selectedDateForSummary} onClose={handleCloseSummaryModal} />
    </div>
  );
};

export default Today;