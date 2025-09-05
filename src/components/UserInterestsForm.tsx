"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';

interface UserInterestsFormProps {
  onSaveSuccess: () => void;
  onCancel: () => void;
}

// A pergunta de interesses (copiada de OnboardingQuestions para reuso)
const interestsQuestion = {
  id: 'q7',
  text: 'Quais tópicos bíblicos mais te interessam? (Selecione pelo menos 3)',
  type: 'checkbox',
  minSelections: 3,
  options: [
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
  ],
};

export const UserInterestsForm = ({ onSaveSuccess, onCancel }: UserInterestsFormProps) => {
  const { session, refetchProfile } = useSession();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [initialInterests, setInitialInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar preferências:', error);
        showError('Erro ao carregar suas preferências.');
      } else if (profile?.preferences) {
        try {
          const parsedPreferences = JSON.parse(profile.preferences);
          setSelectedInterests(parsedPreferences);
          setInitialInterests(parsedPreferences);
        } catch (parseError) {
          console.error('Erro ao analisar preferências JSON:', parseError);
        }
      }
      setIsLoading(false);
    };

    fetchPreferences();
  }, [session]);

  const handleCheckboxChange = (value: string, checked: boolean) => {
    setSelectedInterests((prev) => {
      if (checked) {
        return [...prev, value];
      } else {
        return prev.filter((item) => item !== value);
      }
    });
  };

  const handleSave = async () => {
    if (!session?.user) {
      showError("Você precisa estar logado para salvar suas preferências.");
      return;
    }

    if (selectedInterests.length < (interestsQuestion.minSelections || 0)) {
      showError(`Por favor, selecione pelo menos ${interestsQuestion.minSelections} tópicos.`);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: JSON.stringify(selectedInterests) })
        .eq('id', session.user.id);

      if (error) {
        console.error("Erro ao atualizar preferências:", error);
        showError("Não foi possível salvar suas preferências. Tente novamente.");
      } else {
        showSuccess("Preferências salvas com sucesso!");
        await refetchProfile(); // Atualiza o contexto da sessão
        onSaveSuccess();
      }
    } catch (err) {
      console.error("Erro inesperado ao salvar preferências:", err);
      showError("Ocorreu um erro inesperado.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(selectedInterests.sort()) !== JSON.stringify(initialInterests.sort());
  const isSaveDisabled = !hasChanges || isSaving || selectedInterests.length < (interestsQuestion.minSelections || 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg flex flex-col animate-fade-in">
      <h2 className="text-2xl font-bold text-primary text-center mb-6">
        Seus Interesses Bíblicos
      </h2>

      <div className="flex-grow space-y-6 mb-8 animate-fade-in">
        <p className="text-lg font-semibold text-primary/90 text-center">{interestsQuestion.text}</p>
        
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {interestsQuestion.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-md bg-secondary/30 hover:bg-secondary/50 cursor-pointer">
              <Checkbox
                id={option.value}
                checked={selectedInterests.includes(option.value)}
                onCheckedChange={(checked) => handleCheckboxChange(option.value, checked as boolean)}
              />
              <Label htmlFor={option.value} className="flex-grow cursor-pointer text-base font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-4 mt-auto">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="flex-1"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" /> Salvar Interesses
            </>
          )}
        </Button>
      </div>
    </div>
  );
};