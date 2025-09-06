"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';

// Funções para buscar o status de cada tarefa
const fetchTaskStatus = async (userId: string, taskName: string) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data, error } = await supabase
    .from('daily_tasks_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('task_name', taskName)
    .eq('task_date', todayStr)
    .single();
  
  if (error) {
    // PGRST116 means "no rows found"
    // We treat this as the task not being completed for the current day.
    if (error.code === 'PGRST116') { // Removido || error.status === 406
      return false;
    }
    throw error; // Re-throw other errors
  }
  return !!data;
};

export const useDailyTasksProgress = () => {
  const { session } = useSession();
  const userId = session?.user?.id;

  const { data: isJournalCompleted, isLoading: loadingJournal } = useQuery({
    queryKey: ['journalStatus', userId],
    queryFn: () => fetchTaskStatus(userId!, 'spiritual_journal'),
    enabled: !!userId,
  });

  // O Versículo do Dia não será mais contado no progresso da "Jornada Diária"
  const { data: isVerseOfTheDayTaskCompleted, isLoading: loadingVerseOfTheDayTask } = useQuery({
    queryKey: ['verseOfTheDayTaskStatus', userId],
    queryFn: () => fetchTaskStatus(userId!, 'verse_of_the_day'),
    enabled: !!userId,
  });

  const { data: isDailyStudyTaskCompleted, isLoading: loadingDailyStudyTask } = useQuery({
    queryKey: ['dailyStudyTaskStatus', userId],
    queryFn: () => fetchTaskStatus(userId!, 'daily_study'),
    enabled: !!userId,
  });

  const { data: isQuickReflectionTaskCompleted, isLoading: loadingQuickReflectionTask } = useQuery({
    queryKey: ['quickReflectionTaskStatus', userId],
    queryFn: () => fetchTaskStatus(userId!, 'quick_reflection'),
    enabled: !!userId,
  });

  const { data: isInspirationalQuoteTaskCompleted, isLoading: loadingInspirationalQuoteTask } = useQuery({
    queryKey: ['inspirationalQuoteTaskStatus', userId],
    queryFn: () => fetchTaskStatus(userId!, 'inspirational_quotes'),
    enabled: !!userId,
  });

  const { data: isMyPrayerTaskCompleted, isLoading: loadingMyPrayerTask } = useQuery({
    queryKey: ['myPrayerTaskStatus', userId],
    queryFn: () => fetchTaskStatus(userId!, 'my_prayer'),
    enabled: !!userId,
  });

  // Agora, totalDailyTasks é 5, excluindo o Versículo do Dia
  const totalDailyTasks = 5; 
  const completedDailyTasksCount = [
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
  ].filter(Boolean).length;

  const dailyProgressPercentage = totalDailyTasks > 0 
    ? (completedDailyTasksCount / totalDailyTasks) * 100 
    : 0;

  // Apenas as tarefas da "Jornada Diária" afetam o estado de carregamento
  const isLoadingAnyDailyTask = loadingJournal || loadingDailyStudyTask || loadingQuickReflectionTask || loadingInspirationalQuoteTask || loadingMyPrayerTask;

  return {
    completedDailyTasksCount,
    totalDailyTasks,
    dailyProgressPercentage,
    isLoadingAnyDailyTask,
    isJournalCompleted,
    isVerseOfTheDayTaskCompleted, // Mantido para que o componente VerseOfTheDayTask possa usá-lo
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
  };
};