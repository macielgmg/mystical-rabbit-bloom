import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

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

  useEffect(() => {
    const fetchInitialState = async () => {
      if (!session) {
        setLoading(false);
        return;
      }
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_tasks_progress')
        .select('value')
        .eq('user_id', session.user.id)
        .eq('task_name', 'spiritual_journal')
        .eq('task_date', todayStr)
        .single();

      if (data?.value) {
        setSpiritualState([data.value]);
      }
      setLoading(false);
    };
    fetchInitialState();
  }, [session]);

  const handleSave = async () => {
    if (!session) {
      showError("Você precisa estar logado para salvar.");
      return;
    }
    setIsSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const newValue = spiritualState[0];

    const { error } = await supabase
      .from('daily_tasks_progress')
      .upsert({
        user_id: session.user.id,
        task_name: 'spiritual_journal',
        task_date: today,
        value: newValue,
      }, { onConflict: 'user_id,task_name,task_date' });

    if (error) {
      showError("Erro ao salvar seu progresso.");
      console.error(error);
      setIsSaving(false);
    } else {
      showSuccess("Progresso salvo!");
      navigate('/today');
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
    <div className="container mx-auto max-w-2xl flex flex-col h-screen p-4"> {/* Adicionado p-4 de volta para padding geral */}
      <header className="relative flex items-center justify-center pb-4"> {/* Removido py-4 e mb-4, mantido pb-4 para espaçamento */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary">Diário Espiritual</h1>
      </header>

      <div className="flex-1 flex flex-col justify-center items-center text-center gap-6"> {/* Usando gap-6 para espaçamento interno */}
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

      <div className="pt-4"> {/* Removido py-4, adicionado pt-4 para espaçamento */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar e Concluir"}
        </Button>
      </div>
    </div>
  );
};

export default SpiritualJournalPage;