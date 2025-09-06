import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Loader2, CheckCircle, X, ArrowRight } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { format } from 'date-fns';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted, isFirstTaskInSequence, getPreviousTaskPath, getCompletionStatusKey } from '@/utils/dailyTasksSequence'; // Importar getCompletionStatusKey
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { getLocalDateString } from '@/lib/utils'; // Importar a nova função
import { checkAndAwardAchievements } from '@/utils/achievements'; // Importar a função de verificação de conquistas
import { showAchievementToast } from '@/utils/toast'; // Importar o toast de conquista

const sliderLabels = [
  "Completamente desconectado", "Distante", "Indiferente",
  "Buscando", "Conectado", "Próximo", "Completamente Abraçado"
];

const SpiritualJournalPage = () => {
  const navigate = useNavigate();
  const { session, refetchProfile } = useSession(); // Adicionado refetchProfile
  const queryClient = useQueryClient();
  const [spiritualState, setSpiritualState] = useState([4]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    isVerseOfTheDayTaskCompleted, // Adicionado aqui
  } = useDailyTasksProgress();

  const currentTaskName = 'spiritual_journal';
  const completionStatus = {
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
    isVerseOfTheDayTaskCompleted, // Adicionado aqui
  };

  // isFirstTask pode ser calculado fora do handleSave, pois não depende do estado de conclusão atual
  const isFirstTask = isFirstTaskInSequence(currentTaskName);

  useEffect(() => {
    const fetchInitialState = async () => {
      if (!session) {
        setLoading(false);
        return;
      }
      const todayStr = getLocalDateString(new Date()); // Usar getLocalDateString
      const { data, error } = await supabase
        .from('daily_tasks_progress')
        .select('value')
        .eq('user_id', session.user.id)
        .eq('task_name', currentTaskName)
        .eq('task_date', todayStr)
        .single();

      if (data?.value) {
        setSpiritualState([data.value]);
      }
      setLoading(false);
    };
    fetchInitialState();
  }, [session, currentTaskName]);

  const handleSave = async () => {
    if (!session?.user) {
      showError("Você precisa estar logado para salvar.");
      return;
    }
    setIsSaving(true);
    const today = getLocalDateString(new Date()); // Usar getLocalDateString
    const newValue = spiritualState[0];
    const userId = session.user.id;

    try {
      const { error } = await supabase
        .from('daily_tasks_progress')
        .upsert({
          user_id: userId,
          task_name: currentTaskName,
          task_date: today,
          value: newValue,
        }, { onConflict: 'user_id,task_name,task_date' });

      if (error) {
        throw error;
      }

      // Increment total_journal_entries in profiles table
      const { error: updateProfileError } = await supabase
        .rpc('increment_total_journal_entries', { user_id: userId }); // CORRIGIDO: Chamada direta a supabase.rpc

      if (updateProfileError) {
        console.error("Erro ao incrementar total_journal_entries:", updateProfileError);
        showError("Erro ao registrar a entrada do diário.");
        setIsSaving(false);
        return;
      }
      await refetchProfile(); // Atualiza o contexto da sessão para refletir o novo total_journal_entries
      
      // Check and award achievements after saving
      const { newAchievements } = await checkAndAwardAchievements(userId); // Corrigido aqui
      newAchievements.forEach((ach, index) => {
        setTimeout(() => showAchievementToast(ach), index * 700);
      });
      
      // Simula o status de conclusão da tarefa atual para a lógica de navegação
      const simulatedCompletionStatus = {
        ...completionStatus,
        [getCompletionStatusKey(currentTaskName)]: true,
      };

      const isLastTaskAfterCompletion = isLastTaskInSequenceAndAllCompleted(currentTaskName, simulatedCompletionStatus);
      const nextTaskPathAfterCompletion = getNextIncompleteTaskPath(currentTaskName, simulatedCompletionStatus);

      // Invalida todas as queries de progresso diário para garantir a atualização
      queryClient.invalidateQueries({ queryKey: ['journalStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['verseOfTheDayTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyStudyTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['quickReflectionTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['inspirationalQuoteTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['myPrayerTaskStatus', userId] });

      if (nextTaskPathAfterCompletion) {
        navigate(nextTaskPathAfterCompletion);
      } else if (isLastTaskAfterCompletion) {
        navigate('/today');
      } else {
        navigate('/today'); // Fallback caso algo inesperado aconteça
      }
    } catch (error: any) {
      showError("Erro ao salvar seu progresso: " + error.message);
      console.error("Erro ao salvar progresso:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // O cálculo de isLastTask para o botão deve usar o estado atual, não o simulado
  const isLastTaskForButton = isLastTaskInSequenceAndAllCompleted(currentTaskName, completionStatus);


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
        <h1 className="text-xl font-bold text-primary">Diário Espiritual</h1>
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

      <div className="flex-1 flex flex-col justify-center items-center text-center gap-6">
        <p className="text-2xl font-semibold text-primary/90">Como está seu relacionamento com Deus hoje?</p>
        <div className="w-full max-w-sm space-y-6">
          <Slider
            value={spiritualState}
            min={1}
            max={7}
            step={1}
            onValueChange={setSpiritualState}
          />
          <p className="text-center text-primary font-medium text-lg">
            {sliderLabels[spiritualState[0] - 1]}
          </p>
        </div>
      </div>

      <div className="flex justify-end items-center py-4 gap-2 flex-shrink-0">
        <Button 
          onClick={handleSave} 
          className="flex-1 w-full"
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            isLastTaskForButton ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Jornada
              </>
            ) : (
              <ArrowRight className="h-4 w-4" />
            )
          )}
        </Button>
      </div>
    </div>
  );
};

export default SpiritualJournalPage;