"use client";

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, HelpCircle, HeartHandshake, Star, Crown, Share2 } from 'lucide-react'; // Adicionado Share2
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

const WHATSAPP_NUMBER = "5531936182392";
const WHATSAPP_MESSAGE = "Olá! Preciso de ajuda com o aplicativo Raízes da Fé.";

const HelpAndSupportPage = () => {
  const navigate = useNavigate();

  const handleWhatsappClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Raízes da Fé - Seu aplicativo de estudo bíblico',
        text: 'Aprofunde sua fé e conhecimento da Palavra de Deus diariamente com o Raízes da Fé!',
        url: window.location.origin, // URL base do PWA
      })
      .then(() => console.log('App compartilhado com sucesso!'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      // Fallback para navegadores que não suportam a Web Share API
      const shareText = `Aprofunde sua fé e conhecimento da Palavra de Deus diariamente com o Raízes da Fé! Acesse: ${window.location.origin}`;
      navigator.clipboard.writeText(shareText)
        .then(() => alert('Link do aplicativo copiado para a área de transferência!'))
        .catch(() => alert('Não foi possível copiar o link do aplicativo.'));
    }
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
        <h1 className="text-xl font-bold text-primary">Ajuda e Suporte</h1>
      </header>

      <Tabs defaultValue="help" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 mb-4">
          <TabsTrigger value="help" className="flex items-center gap-2 text-base py-2">
            <HelpCircle className="h-5 w-5" /> Ajuda
          </TabsTrigger>
          <TabsTrigger value="contribute" className="flex items-center gap-2 text-base py-2">
            <HeartHandshake className="h-5 w-5" /> Contribuir
          </TabsTrigger>
        </TabsList>

        <TabsContent value="help">
          <Card className="p-6 space-y-4 text-center">
            <CardHeader className="p-0 pb-2">
              <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-primary">Precisa de Ajuda?</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <p className="text-lg text-muted-foreground">
                Nossa equipe de suporte está pronta para te ajudar! Entre em contato conosco via WhatsApp para um atendimento rápido.
              </p>
              <Button 
                onClick={handleWhatsappClick} 
                className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageSquare className="h-6 w-6 mr-3" />
                Falar com Suporte via WhatsApp
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Fique à vontade para mandar mensagem, iremos responder o mais rápido possível.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contribute">
          <Card className="p-6 space-y-6 text-center">
            <CardHeader className="p-0 pb-2">
              <HeartHandshake className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-primary">Apoie o Raízes da Fé</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <p className="text-lg text-muted-foreground">
                Se você ama o Raízes da Fé e deseja nos ajudar a continuar crescendo, considere as seguintes formas de contribuição:
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <Crown className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-primary">Assine o Plano Pro</h3>
                    <p className="text-muted-foreground text-sm">
                      Tenha acesso a recursos exclusivos e ajude a manter o desenvolvimento do aplicativo.
                    </p>
                    <Button asChild variant="link" className="p-0 h-auto text-primary justify-start text-sm">
                      <Link to="/manage-subscription">Ver Planos Pro</Link>
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-primary">Envie seu Feedback</h3>
                    <p className="text-muted-foreground text-sm">
                      Suas sugestões são valiosas para melhorarmos! Use o botão de suporte para nos enviar suas ideias.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Share2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" /> {/* Ícone de compartilhamento */}
                  <div>
                    <h3 className="font-semibold text-primary">Compartilhe o App</h3>
                    <p className="text-muted-foreground text-sm">
                      Ajude-nos a alcançar mais pessoas compartilhando o Raízes da Fé com seus amigos e familiares!
                    </p>
                    <Button variant="link" className="p-0 h-auto text-primary justify-start text-sm" onClick={handleShareApp}>
                      Compartilhar Agora
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HelpAndSupportPage;