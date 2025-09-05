import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();
  const { session } = useSession();

  // Se já estiver logado, redireciona para a página principal
  if (session) {
    return <Navigate to="/today" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center max-w-screen-xl w-full gap-8">
        {/* Conteúdo principal (esquerda) */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-md space-y-6 md:flex-1">
          <Logo size="lg" />
          <h1 className="text-4xl font-bold text-primary animate-fade-in-up animation-delay-100">
            Cresça na fé diariamente
          </h1>
          <p className="text-lg text-muted-foreground animate-fade-in-up animation-delay-200">
            Um caminho transformador através do estudo bíblico e reflexão pessoal.
          </p>
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            className="px-8 py-6 text-lg animate-fade-in-up animation-delay-300"
          >
            Comece Agora
          </Button>
        </div>

        {/* Imagem ilustrativa (direita) - só aparece em telas maiores */}
        <div className="hidden md:block md:flex-1 md:max-w-sm lg:max-w-md animate-fade-in animation-delay-400">
          <img
            src="/placeholder.svg"
            alt="Pessoa estudando a Bíblia"
            className="rounded-lg shadow-xl w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}