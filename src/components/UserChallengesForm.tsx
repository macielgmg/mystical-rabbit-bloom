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

interface UserChallengesFormProps {
  onSaveSuccess: () => void;
  onCancel: () => void;
}

// A pergunta de desafios (copiada de OnboardingQuestions para reuso)
const challengesQuestion = {
  id: 'q6',
  text: 'Quais desafios você mais enfrenta em sua jornada de fé? (Selecione um ou mais)',
  type: 'checkbox',
  minSelections: 1,
  options: [
    { value: 'falta-tempo', label: 'Falta de tempo' },
    { value: 'duvidas-biblicas', label: 'Dúvidas bíblicas ou teológicas' },
    { value: 'falta-motivacao', label: 'Falta de motivação ou disciplina' },
    { value: 'dificuldade-aplicar', label: 'Dificuldade em aplicar a fé no dia a dia' },
    { value: 'solidao', label: 'Solidão na jornada espiritual' },
    { value: 'distracoes', label: 'Distrações do mundo' },
    { value: 'nao-entendo-biblia', label: 'Não consigo entender a Bíblia' },
    { value: 'outros-desafios', label: 'Outros' },
  ],
};

export const UserChallengesForm = ({ onSaveSuccess, onCancel }: UserChallengesFormProps) => {
  const { session, refetchProfile, quizResponses } = useSession();
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [initialChallenges, setInitialChallenges] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    if (quizResponses) {
      try {
        const parsedQuizResponses = JSON.parse(quizResponses);
        const challenges = parsedQuizResponses.q6 || []; // Assumindo que q6 são os desafios
        setSelectedChallenges(challenges);
        setInitialChallenges(challenges);
      } catch (parseError) {
        console.error('Erro ao analisar quizResponses para desafios:', parseError);
      }
    }
    setIsLoading(false);
  }, [session, quizResponses]);

  const handleCheckboxChange = (value: string, checked: boolean) => {
    setSelectedChallenges((prev) => {
      if (checked) {
        return [...prev, value];
      } else {
        return prev.filter((item) => item !== value);
      }
    });
  };

  const handleSave = async () => {
    if (!session?.user) {
      showError("Você precisa estar logado para salvar seus desafios.");
      return;
    }

    if (selectedChallenges.length < (challengesQuestion.minSelections || 0)) {
      showError(`Por favor, selecione pelo menos ${challengesQuestion.minSelections} desafios.`);
      return;
    }

    setIsSaving(true);
    try {
      // Atualizar apenas a parte 'q6' dentro de quiz_responses
      const currentQuizResponses = quizResponses ? JSON.parse(quizResponses) : {};
      const updatedQuizResponses = { ...currentQuizResponses, q6: selectedChallenges };

      const { error } = await supabase
        .from('profiles')
        .update({ quiz_responses: JSON.stringify(updatedQuizResponses) })
        .eq('id', session.user.id);

      if (error) {
        console.error("Erro ao atualizar desafios:", error);
        showError("Não foi possível salvar seus desafios. Tente novamente.");
      } else {
        showSuccess("Desafios salvos com sucesso!");
        await refetchProfile(); // Atualiza o contexto da sessão
        onSaveSuccess();
      }
    } catch (err) {
      console.error("Erro inesperado ao salvar desafios:", err);
      showError("Ocorreu um erro inesperado.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(selectedChallenges.sort()) !== JSON.stringify(initialChallenges.sort());
  const isSaveDisabled = !hasChanges || isSaving || selectedChallenges.length < (challengesQuestion.minSelections || 0);

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
        Seus Desafios na Fé
      </h2>

      <div className="flex-grow space-y-6 mb-8 animate-fade-in">
        <p className="text-lg font-semibold text-primary/90 text-center">{challengesQuestion.text}</p>
        
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {challengesQuestion.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-md bg-secondary/30 hover:bg-secondary/50 cursor-pointer">
              <Checkbox
                id={option.value}
                checked={selectedChallenges.includes(option.value)}
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
              <CheckCircle className="h-4 w-4 mr-2" /> Salvar Desafios
            </>
          )}
        </Button>
      </div>
    </div>
  );
};