import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HeartHandshake, BookOpen, ShieldQuestion } from "lucide-react"; // Adicionado ShieldQuestion
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserInterestsForm } from '@/components/UserInterestsForm';
import { UserChallengesForm } from '@/components/UserChallengesForm'; // Importar o novo componente
import { useSession } from '@/contexts/SessionContext';

const PreferencesPage = () => {
  const navigate = useNavigate();
  // Usar 'preferences' para interesses e 'quizResponses' para desafios
  const { preferences, quizResponses } = useSession(); 
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [isEditingChallenges, setIsEditingChallenges] = useState(false); // Novo estado para desafios

  const getInterestsLabels = () => {
    // Os interesses são armazenados diretamente no campo 'preferences' como um array de strings.
    if (!preferences) return [];
    try {
      const parsedPreferences = JSON.parse(preferences);
      // Garantir que é um array, mesmo que esteja vazio ou mal formatado
      const interests = Array.isArray(parsedPreferences) ? parsedPreferences : [];
      
      const interestsQuestionOptions = [
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
      ];

      return interests.map((interestValue: string) => {
        const option = interestsQuestionOptions.find(opt => opt.value === interestValue);
        return option ? option.label : interestValue;
      });

    } catch (error) {
      console.error("Erro ao analisar preferências para interesses:", error);
      return [];
    }
  };

  const getChallengesLabels = () => {
    // Os desafios são armazenados dentro de 'quizResponses' na chave 'q6'.
    if (!quizResponses) return [];
    try {
      const parsedQuizResponses = JSON.parse(quizResponses);
      // Garantir que é um array, mesmo que esteja vazio ou mal formatado
      const challenges = Array.isArray(parsedQuizResponses.q6) ? parsedQuizResponses.q6 : []; 
      
      const challengesQuestionOptions = [
        { value: 'falta-tempo', label: 'Falta de tempo' },
        { value: 'duvidas-biblicas', label: 'Dúvidas bíblicas ou teológicas' },
        { value: 'falta-motivacao', label: 'Falta de motivação ou disciplina' },
        { value: 'dificuldade-aplicar', label: 'Dificuldade em aplicar a fé no dia a dia' },
        { value: 'solidao', label: 'Solidão na jornada espiritual' },
        { value: 'distracoes', label: 'Distrações do mundo' },
        { value: 'nao-entendo-biblia', label: 'Não consigo entender a Bíblia' },
        { value: 'outros-desafios', label: 'Outros' },
      ];

      return challenges.map((challengeValue: string) => {
        const option = challengesQuestionOptions.find(opt => opt.value === challengeValue);
        return option ? option.label : challengeValue;
      });

    } catch (error) {
      console.error("Erro ao analisar quizResponses para desafios:", error);
      return [];
    }
  };

  const currentInterests = getInterestsLabels();
  const currentChallenges = getChallengesLabels();

  if (isEditingInterests) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/40 p-4">
        <UserInterestsForm 
          onSaveSuccess={() => setIsEditingInterests(false)}
          onCancel={() => setIsEditingInterests(false)}
        />
      </div>
    );
  }

  if (isEditingChallenges) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/40 p-4">
        <UserChallengesForm 
          onSaveSuccess={() => setIsEditingChallenges(false)}
          onCancel={() => setIsEditingChallenges(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <header className="relative flex items-center justify-center py-4 mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary">Interesses e Preferências</h1>
      </header>

      <div className="space-y-4">
        {/* Interesses Bíblicos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Interesses Bíblicos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {currentInterests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentInterests.map((interest, index) => (
                  <span key={index} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum interesse selecionado ainda.</p>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => setIsEditingInterests(true)}
            >
              <HeartHandshake className="h-4 w-4 mr-2" /> Editar Interesses
            </Button>
          </CardContent>
        </Card>

        {/* Principais Desafios na Fé */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <ShieldQuestion className="h-5 w-5 text-primary" /> {/* Ícone de escudo com interrogação */}
              <CardTitle className="text-lg font-semibold">Principais Desafios na Fé</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {currentChallenges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentChallenges.map((challenge, index) => (
                  <span key={index} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {challenge}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum desafio selecionado ainda.</p>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => setIsEditingChallenges(true)}
            >
              <HeartHandshake className="h-4 w-4 mr-2" /> Editar Desafios
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreferencesPage;