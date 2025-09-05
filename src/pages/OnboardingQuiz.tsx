import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { useState } from "react";
import { OnboardingQuestions } from "@/components/OnboardingQuestions";
import { PersonalizingExperienceLoading } from "@/components/PersonalizingExperienceLoading"; // Importar o novo componente de carregamento

const OnboardingQuiz = () => {
  const navigate = useNavigate();
  const { session, refetchProfile } = useSession();
  const [isCompleting, setIsCompleting] = useState(false);
  // O quiz começa com a introdução
  const [currentScreen, setCurrentScreen] = useState<'quizIntro' | 'questions' | 'personalizingLoading'>('quizIntro');

  const handleCompleteOnboarding = async (answers: Record<string, string | string[] | number>) => {
    if (!session?.user) {
      showError("Você precisa estar logado para completar o onboarding.");
      return;
    }
    setIsCompleting(true);
    setCurrentScreen('personalizingLoading'); // Mover para a nova tela de carregamento

    try {
      const { q7: interests, ...otherResponses } = answers; // Separar a última pergunta (q7)

      const updatePayload: { 
        onboarding_completed: boolean; 
        preferences?: string; 
        quiz_responses?: string; 
      } = {
        onboarding_completed: true,
      };

      if (interests) {
        updatePayload.preferences = JSON.stringify(interests); // Salva os interesses em 'preferences'
      }
      
      if (Object.keys(otherResponses).length > 0) {
        updatePayload.quiz_responses = JSON.stringify(otherResponses); // Salva as outras respostas em 'quiz_responses'
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', session.user.id);

      if (error) {
        console.error("Erro ao marcar onboarding como completo:", error);
        showError("Não foi possível finalizar o onboarding. Tente novamente.");
        setCurrentScreen('questions'); // Voltar para as perguntas em caso de erro
      } else {
        showSuccess("Onboarding concluído! Bem-vindo(a)!");
        await refetchProfile(); // Atualiza o contexto da sessão com o novo status
        // A navegação para /today será feita por PersonalizingExperienceLoading
      }
    } catch (err) {
      console.error("Erro inesperado ao completar onboarding:", err);
      showError("Ocorreu um erro inesperado.");
      setCurrentScreen('questions'); // Voltar para as perguntas em caso de erro
    } finally {
      setIsCompleting(false);
    }
  };

  const handlePersonalizingLoadingComplete = () => {
    navigate('/today'); // Após o carregamento final, navega para a página principal
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 text-center">
      {currentScreen === 'quizIntro' && (
        <>
          <BrainCircuit className="h-24 w-24 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Bem-vindo ao Quiz!</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Responda algumas perguntas para personalizarmos sua jornada de fé.
          </p>
          <Button onClick={() => setCurrentScreen('questions')} size="lg" disabled={isCompleting}>
            {isCompleting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Começar Quiz"}
            {!isCompleting && <ArrowRight className="h-5 w-5 ml-2" />}
          </Button>
          {/* Removido o botão "Pular por enquanto" */}
        </>
      )}
      {currentScreen === 'questions' && (
        <OnboardingQuestions onQuizComplete={handleCompleteOnboarding} isCompleting={isCompleting} />
      )}
      {currentScreen === 'personalizingLoading' && (
        <PersonalizingExperienceLoading onComplete={handlePersonalizingLoadingComplete} />
      )}
    </div>
  );
};

export default OnboardingQuiz;