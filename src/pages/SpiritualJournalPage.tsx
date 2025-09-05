import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Loader2, CheckCircle, X } from 'lucide-react'; // Adicionado X
import { showError } from '@/utils/toast';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { format } from 'date-fns';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted } from '@/utils/dailyTasksSequence';

const sliderLabels = [
  "Completamente desconectado", "Distante", "Indiferente",
  "Buscando", "Conectado", "Próximo", "Completamente Abraçado"
];

const SpiritualJournalPage = () => {
  const navigate = useNavigate();
  const { session } = useSession();
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
  } = useDailyTasksProgress();

  const currentTaskName = 'spiritual_journal';
  const completionStatus = {
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
  };

  const isLastTask = isLastTaskInSequenceAndAllCompleted(currentTaskName, { ...completionStatus, isJournalCompleted: true });
  const nextTaskPath = getNextIncompleteTaskPath(currentTaskName, { ...completionStatus, isJournalCompleted: true });

  useEffect(() => {
    const fetchInitialState = async () => {
      if (!session) {
        setLoading(false);
        return;
      }
      const todayStr = format(new Date(), 'yyyy-MM-dd');
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
    if (!session) {
      showError("Você precisa estar logado para salvar.");
      return;
    }
    setIsSaving(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const newValue = spiritualState[0];

    try {
      const { error } = await supabase
        .from('daily_tasks_progress')
        .upsert({
          user_id: session.user.id,
          task_name: currentTaskName,
          task_date: today,
          value: newValue,
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
      showError("Erro ao salvar seu progresso: " + error.message);
      console.error("Erro ao salvar progresso:", error);
    } finally {
      setIsSaving(false);
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

      <div className="pt-4">
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
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

export default SpiritualJournalPage;