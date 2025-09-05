import { useSession } from '@/contexts/SessionContext';
import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading, onboardingCompleted } = useSession();
  const location = useLocation(); // Hook para obter a localização atual

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Autenticando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // Se não há sessão, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  // Se há sessão, o usuário está logado.
  // Agora, verificamos o status do onboarding.

  // Caso 1: Onboarding NÃO foi concluído
  if (!onboardingCompleted) {
    // Se a rota atual JÁ É a página do quiz, permite que o usuário continue o quiz.
    if (location.pathname === '/onboarding-quiz') {
      return children;
    } else {
      // Se o usuário está em outra rota protegida, mas precisa fazer o onboarding, redireciona para o quiz.
      return <Navigate to="/onboarding-quiz" replace />;
    }
  } 
  // Caso 2: Onboarding JÁ foi concluído
  else {
    // Se o usuário já concluiu o onboarding e tenta acessar a página do quiz, redireciona para /today.
    if (location.pathname === '/onboarding-quiz') {
      return <Navigate to="/today" replace />;
    } else {
      // Se o usuário já concluiu o onboarding e está em uma rota protegida válida, permite o acesso.
      return children;
    }
  }
};

export default ProtectedRoute;