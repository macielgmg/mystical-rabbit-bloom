import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Logo } from '@/components/Logo';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SignUpForm } from '@/components/SignUpForm';
import { OnboardingLoading } from '@/components/OnboardingLoading';
import { WelcomeScreen } from '@/components/WelcomeScreen';

const Login = () => {
  const { session, loading } = useSession(); // Removido onboardingCompleted daqui
  const navigate = useNavigate();
  
  // O fluxo agora começa com a tela de escolha (Sign In/Sign Up) se o usuário não estiver logado.
  // As telas de onboardingLoading e welcomeScreen são acionadas APENAS após um cadastro bem-sucedido.
  const [currentScreen, setCurrentScreen] = useState<'choice' | 'signIn' | 'signUp' | 'forgotPassword' | 'onboardingLoading' | 'welcomeScreen'>('choice');

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 p-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se o usuário já está logado, o componente Login não deve ser renderizado.
  // O ProtectedRoute se encarregará do redirecionamento para /onboarding-quiz ou /today.
  if (session) {
    return <Navigate to="/today" replace />; // Redireciona para /today, ProtectedRoute fará a verificação do onboarding
  }

  const handleSignUpSuccess = () => {
    // Após o cadastro, vai para a tela de carregamento inicial
    setCurrentScreen('onboardingLoading');
  };

  const handleOnboardingLoadingComplete = () => {
    // Após o carregamento inicial, exibe a WelcomeScreen
    setCurrentScreen('welcomeScreen');
  };

  const handleWelcomeScreenContinue = () => {
    // Após a WelcomeScreen, navega para o quiz
    navigate('/onboarding-quiz');
  };

  const renderAuthComponent = (view: 'sign_in' | 'forgotten_password') => (
    <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg relative animate-fade-in">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 left-4 text-muted-foreground hover:text-primary"
        onClick={() => setCurrentScreen('choice')}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Auth
        supabaseClient={supabase}
        providers={[]}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: 'hsl(95 20% 36%)', // Ajustado para a nova cor primária
                brandAccent: 'hsl(95 25% 31%)', // Ajustado para um tom mais escuro
                brandButtonText: 'hsl(60 90% 98%)',
                inputBackground: 'hsl(var(--input))',
                inputBorder: 'hsl(var(--border))',
                inputText: 'hsl(var(--foreground))',
              },
              radii: {
                borderRadiusButton: '0.5rem',
                inputBorderRadius: '0.5rem',
              },
            },
          },
        }}
        theme="light"
        view={view}
        showLinks={false}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email',
              password_label: 'Senha',
              button_label: 'Entrar',
              email_input_placeholder: 'Seu endereço de email',
              password_input_placeholder: 'Sua senha',
              link_text: 'Esqueceu sua senha?',
            },
            sign_up: { 
              email_label: 'Email',
              password_label: 'Criar Senha',
              password_input_placeholder: 'Sua nova senha',
              button_label: 'Criar Conta',
              email_input_placeholder: 'Seu endereço de email',
              link_text: 'Já tem uma conta? Entrar',
            },
            forgotten_password: {
              email_label: 'Email',
              password_label: 'Sua senha', 
              button_label: 'Enviar instruções de redefinição',
              link_text: 'Esqueceu sua senha?', 
              email_input_placeholder: 'Seu endereço de email',
            },
          },
        }}
      />
      {view === 'sign_in' && (
        <Button 
          variant="link" 
          className="w-full mt-4 text-primary" 
          onClick={() => setCurrentScreen('forgotPassword')}
        >
          Esqueceu sua senha?
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 p-4">
      <div className="mb-8 text-center animate-fade-in-up animation-delay-100">
        <Logo />
        <p className="mt-2 text-muted-foreground">Aprofunde-se na Palavra de Deus.</p>
      </div>

      {currentScreen === 'choice' && (
        <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg flex flex-col items-center space-y-4 animate-fade-in">
          <h2 className="text-2xl font-bold text-primary animate-fade-in-up animation-delay-200">Bem-vindo ao Raízes da Fé</h2>
          <p className="text-muted-foreground text-center mb-4 animate-fade-in-up animation-delay-300">
            Entre com seu email e senha ou crie uma nova conta.
          </p>
          <Button 
            onClick={() => setCurrentScreen('signIn')} 
            className="w-full py-6 text-lg animate-fade-in-up animation-delay-400"
          >
            Entrar na conta existente
          </Button>
          <Button 
            onClick={() => setCurrentScreen('signUp')} 
            variant="outline" 
            className="w-full py-6 text-lg border-primary text-primary hover:bg-primary/10 animate-fade-in-up animation-delay-500"
          >
            Criar nova conta (primeiro acesso)
          </Button>
        </div>
      )}

      {currentScreen === 'signIn' && renderAuthComponent('sign_in')}
      {currentScreen === 'signUp' && (
        <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg relative animate-fade-in">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 left-4 text-muted-foreground hover:text-primary"
            onClick={() => setCurrentScreen('choice')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-primary text-center mb-6 animate-fade-in-up animation-delay-100">Criar Nova Conta</h2>
          <div className="animate-fade-in-up animation-delay-200">
            <SignUpForm onSignUpSuccess={handleSignUpSuccess} />
          </div>
        </div>
      )}
      {currentScreen === 'forgotPassword' && renderAuthComponent('forgotten_password')}
      {currentScreen === 'onboardingLoading' && (
        <OnboardingLoading onComplete={handleOnboardingLoadingComplete} />
      )}
      {currentScreen === 'welcomeScreen' && (
        <WelcomeScreen onContinue={handleWelcomeScreenContinue} />
      )}
    </div>
  );
};

export default Login;