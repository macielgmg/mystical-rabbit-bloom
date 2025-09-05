"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider'; // Importar Slider
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea

interface Question {
  id: string;
  text: string;
  type: 'radio' | 'checkbox' | 'custom_age_gender' | 'textarea';
  options?: { value: string; label: string }[]; // Para radio/checkbox
  minSelections?: number; // Para checkbox
  // Configurações específicas para 'custom_age_gender'
  ageConfig?: { min: number; max: number; step: number; };
  genderConfig?: { options: { value: string; label: string }[]; };
}

const questions: Question[] = [
  {
    id: 'q1',
    text: 'Para personalizar sua experiência, gostaríamos de saber um pouco sobre você.',
    type: 'custom_age_gender',
    ageConfig: { min: 10, max: 90, step: 1 },
    genderConfig: {
      options: [
        { value: 'masculino', label: 'Masculino' },
        { value: 'feminino', label: 'Feminino' },
        { value: 'nao-informar', label: 'Prefiro não informar' },
      ],
    },
  },
  {
    id: 'q2',
    text: 'Há quanto tempo você se considera uma pessoa de fé ou pratica alguma religião?',
    type: 'radio',
    options: [
      { value: 'menos-1-ano', label: 'Menos de 1 ano' },
      { value: '1-5-anos', label: '1 a 5 anos' },
      { value: '6-10-anos', label: '6 a 10 anos' },
      { value: 'mais-10-anos', label: 'Mais de 10 anos' },
      { value: 'desde-infancia', label: 'Desde a infância' },
      { value: 'nao-pratico', label: 'Não tenho prática religiosa' },
    ],
  },
  {
    id: 'q3',
    text: 'Com que frequência você participa de cultos, missas ou reuniões em sua comunidade de fé?',
    type: 'radio',
    options: [
      { value: 'semanalmente', label: 'Semanalmente ou mais' },
      { value: 'varias-vezes-mes', label: 'Algumas vezes por mês' },
      { value: 'mensalmente', label: 'Mensalmente' },
      { value: 'ocasionalmente', label: 'Ocasionalmente' },
      { value: 'raramente-nunca', label: 'Raramente ou nunca' },
    ],
  },
  {
    id: 'q4',
    text: 'Qual período do dia você prefere para se dedicar ao estudo bíblico ou momentos de fé?',
    type: 'radio',
    options: [
      { value: 'manha-cedo', label: 'Manhã (cedo)' },
      { value: 'manha-tarde', label: 'Manhã (tarde)' },
      { value: 'almoco', label: 'Almoço' },
      { value: 'tarde', label: 'Tarde' },
      { value: 'noite', label: 'Noite' },
      { value: 'madrugada', label: 'Madrugada' },
      { value: 'nao-fixo', label: 'Não tenho um horário fixo' },
    ],
  },
  // Pergunta 5 removida
  {
    id: 'q6', // ID ajustado para manter a sequência lógica, mas o conteúdo é o antigo q6
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
  },
  {
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
  },
];

interface OnboardingQuestionsProps {
  onQuizComplete: (answers: Record<string, string | string[] | number>) => void;
  isCompleting: boolean;
}

export const OnboardingQuestions = ({ onQuizComplete, isCompleting }: OnboardingQuestionsProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});

  const currentQuestion = questions[currentQuestionIndex];

  // Funções auxiliares para gerenciar o estado das respostas
  const getAnswer = (key: string) => answers[key];
  const setAnswer = (key: string, value: string | string[] | number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Lógica de validação para a pergunta atual
  let isAnswerValid = false;
  if (currentQuestion.type === 'radio') {
    isAnswerValid = !!getAnswer(currentQuestion.id);
  } else if (currentQuestion.type === 'checkbox') {
    const selected = getAnswer(currentQuestion.id) as string[] || [];
    isAnswerValid = selected.length >= (currentQuestion.minSelections || 0);
  } else if (currentQuestion.type === 'custom_age_gender') {
    isAnswerValid = !!getAnswer('q1_age') && !!getAnswer('q1_gender');
  } else if (currentQuestion.type === 'textarea') {
    isAnswerValid = (getAnswer(currentQuestion.id) as string || '').trim().length > 0;
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      onQuizComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg flex flex-col animate-fade-in">
      <h2 className="text-2xl font-bold text-primary text-center mb-6">
        {isLastQuestion ? 'Quase lá!' : `Pergunta ${currentQuestionIndex + 1} de ${questions.length}`}
      </h2>

      {/* Conteúdo da pergunta com animação de fade */}
      <div key={currentQuestion.id} className="flex-grow space-y-6 mb-8 animate-fade-in">
        <p className="text-lg font-semibold text-primary/90 text-center">{currentQuestion.text}</p>
        
        {currentQuestion.type === 'radio' && currentQuestion.options && (
          <RadioGroup
            value={getAnswer(currentQuestion.id) as string}
            onValueChange={(value) => setAnswer(currentQuestion.id, value)}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-md bg-secondary/30 hover:bg-secondary/50 cursor-pointer">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-grow cursor-pointer text-base font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {currentQuestion.type === 'checkbox' && currentQuestion.options && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {currentQuestion.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-md bg-secondary/30 hover:bg-secondary/50 cursor-pointer">
                <Checkbox
                  id={option.value}
                  checked={(getAnswer(currentQuestion.id) as string[] || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentSelections = getAnswer(currentQuestion.id) as string[] || [];
                    if (checked) {
                      setAnswer(currentQuestion.id, [...currentSelections, option.value]);
                    } else {
                      setAnswer(currentQuestion.id, currentSelections.filter((item) => item !== option.value));
                    }
                  }}
                />
                <Label htmlFor={option.value} className="flex-grow cursor-pointer text-base font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        )}

        {currentQuestion.type === 'custom_age_gender' && currentQuestion.ageConfig && currentQuestion.genderConfig && (
          <div className="space-y-8">
            {/* Idade */}
            <div className="space-y-4">
              <Label htmlFor="age-slider" className="text-base font-medium text-primary/90 block text-center">
                Sua idade: <span className="font-bold text-xl">{getAnswer('q1_age') || currentQuestion.ageConfig.min}</span> anos
              </Label>
              <Slider
                id="age-slider"
                value={[getAnswer('q1_age') as number || currentQuestion.ageConfig.min]}
                min={currentQuestion.ageConfig.min}
                max={currentQuestion.ageConfig.max}
                step={currentQuestion.ageConfig.step}
                onValueChange={(value) => setAnswer('q1_age', value[0])}
                className="w-full"
              />
            </div>

            {/* Gênero */}
            <div className="space-y-4">
              <Label className="text-base font-medium text-primary/90 block text-center">Seu gênero:</Label>
              <RadioGroup
                value={getAnswer('q1_gender') as string}
                onValueChange={(value) => setAnswer('q1_gender', value)}
                className="flex justify-center gap-4"
              >
                {currentQuestion.genderConfig.options.map((option) => (
                  <div key={option.value} className="flex flex-col items-center space-y-2">
                    <RadioGroupItem value={option.value} id={`gender-${option.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`gender-${option.value}`}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="text-sm font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {currentQuestion.type === 'textarea' && (
          <Textarea
            placeholder="Descreva suas metas aqui..."
            value={getAnswer(currentQuestion.id) as string || ''}
            onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
            className="min-h-[150px]"
          />
        )}
      </div>

      <div className="flex justify-between gap-4 mt-auto">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isCompleting}
          className={cn(currentQuestionIndex === 0 && "invisible")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isAnswerValid || isCompleting}
          className="flex-1"
        >
          {isCompleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isLastQuestion ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" /> Finalizar Quiz
            </>
          ) : (
            <>
              Próxima <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};