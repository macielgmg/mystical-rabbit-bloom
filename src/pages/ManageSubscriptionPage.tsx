import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Crown, XCircle, Gem, BookOpen, Sparkles, TrendingUp, Frown, Headphones } from "lucide-react"; // Adicionado Headphones
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "@/contexts/SessionContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

const ManageSubscriptionPage = () => {
  const navigate = useNavigate();
  const { isPro, recurrence, currentBillingPeriodStart, proAccessEndAt, paymentStatus } = useSession(); // Obtendo os novos campos da sessão
  const [isCancelling, setIsCancelling] = useState(false);

  const proBenefits = [
    { icon: BookOpen, text: "Acesso ilimitado a todos os estudos premium." },
    { icon: Headphones, text: "Conteúdo diário exclusivo e personalizado, incluindo áudios." }, // Atualizado para incluir áudio
    { icon: TrendingUp, text: "Ferramentas avançadas de acompanhamento de progresso." },
    { icon: Gem, text: "Novos recursos e estudos adicionados mensalmente." },
  ];

  let nextBillingDate: string | null = null;
  let accessEndDate: string | null = null;
  const now = new Date();

  // Calcular a próxima data de cobrança se o status for 'pagando'
  if (paymentStatus === 'pagando' && currentBillingPeriodStart && recurrence !== null && recurrence > 0) {
    try {
      const currentPeriodStart = new Date(currentBillingPeriodStart);
      const nextDate = addMonths(currentPeriodStart, recurrence);
      nextBillingDate = format(nextDate, 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      console.error("Erro ao calcular a próxima data de recorrência:", e);
    }
  }

  // Formatar a data de término do acesso se existir e for no futuro
  if (proAccessEndAt) {
    const endDate = new Date(proAccessEndAt);
    if (endDate > now) {
      accessEndDate = format(endDate, 'dd/MM/yyyy', { locale: ptBR });
    }
  }

  const handleConfirmCancel = () => {
    // Lógica real de cancelamento da assinatura aqui
    alert("Assinatura cancelada com sucesso! (Funcionalidade real em breve)");
    setIsCancelling(false);
    // Poderia redirecionar ou atualizar o estado do usuário
  };

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
        <h1 className="text-xl font-bold text-primary">Gerenciar Assinatura</h1>
      </header>

      {isPro ? ( // isPro agora reflete se o usuário TEM acesso PRO
        <Card className="p-6 space-y-6 text-center bg-gradient-to-br from-green-100 to-blue-100 border-primary/30 shadow-lg">
          <CardHeader className="p-0 pb-4">
            <Crown className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-primary">Você é um Membro Pro!</CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Obrigado por apoiar nossa missão. Você tem acesso ilimitado a todos os recursos premium.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {paymentStatus === 'cancelado' && accessEndDate ? (
              <p className="text-destructive font-semibold">
                Sua assinatura foi cancelada. Você terá acesso Pro até: <span className="font-bold">{accessEndDate}</span>
              </p>
            ) : (
              <p className="text-foreground font-semibold">Sua assinatura está ativa.</p>
            )}
            
            {nextBillingDate && paymentStatus === 'pagando' && (
              <p className="text-sm text-muted-foreground">
                Próxima cobrança em: <span className="font-semibold text-primary">{nextBillingDate}</span>
              </p>
            )}
            
            <AlertDialog open={isCancelling} onOpenChange={setIsCancelling}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                >
                  Cancelar Assinatura
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader className="flex flex-col items-center text-center">
                  <Frown className="h-16 w-16 text-destructive mb-4" />
                  <AlertDialogTitle className="text-2xl font-bold text-primary">Poxa, você quer mesmo cancelar?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Sentiremos sua falta! Ao cancelar, você perderá o acesso aos recursos Pro no final do seu ciclo de faturamento atual.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
                  <AlertDialogCancel asChild>
                    <Button variant="outline" className="w-full sm:w-auto">Mudei de Ideia</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button variant="destructive" className="w-full sm:w-auto" onClick={handleConfirmCancel}>Continuar Cancelamento</Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              variant="outline" 
              className="w-full border-primary text-primary hover:bg-primary/10"
              onClick={() => navigate('/profile')}
            >
              Voltar ao Perfil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 space-y-6 bg-gradient-to-br from-primary/10 to-primary/20 border-primary/30 shadow-lg">
          <CardHeader className="p-0 pb-4 text-center">
            <Gem className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-primary">Desbloqueie o Raízes da Fé Pro</CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Leve sua jornada de fé para o próximo nível com recursos exclusivos.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <div className="space-y-4">
              {proBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <p className="text-lg text-foreground">{benefit.text}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4 pt-4 border-t border-primary/20">
              <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <input type="radio" id="monthly" name="plan" className="h-5 w-5 text-primary focus:ring-primary" defaultChecked />
                  <label htmlFor="monthly" className="text-lg font-semibold text-foreground">Mensal</label>
                </div>
                <span className="text-lg font-bold text-primary">R$19,90/mês</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm border-2 border-primary">
                <div className="flex items-center gap-3">
                  <input type="radio" id="annual" name="plan" className="h-5 w-5 text-primary focus:ring-primary" />
                  <label htmlFor="annual" className="text-lg font-semibold text-primary">Anual</label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">R$199,00/ano</span>
                  <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                </div>
              </div>
            </div>
            <Button 
              className="w-full py-6 text-lg bg-primary hover:bg-primary/90"
              onClick={() => alert("Funcionalidade de assinatura em breve!")} // Placeholder
            >
              Assinar Agora
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManageSubscriptionPage;