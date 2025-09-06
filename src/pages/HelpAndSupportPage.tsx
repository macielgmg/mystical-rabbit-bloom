"use client";

import React from 'react';
import { useNavigate } => 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, HelpCircle } from 'lucide-react'; // Alterado Whatsapp para MessageSquare
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const WHATSAPP_NUMBER = "5511999999999"; // Substitua pelo número de WhatsApp real
const WHATSAPP_MESSAGE = "Olá! Preciso de ajuda com o aplicativo Raízes da Fé.";

const HelpAndSupportPage = () => {
  const navigate = useNavigate();

  const handleWhatsappClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
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
            <MessageSquare className="h-6 w-6 mr-3" /> {/* Alterado Whatsapp para MessageSquare */}
            Falar com Suporte via WhatsApp
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Horário de atendimento: Segunda a Sexta, das 9h às 18h.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpAndSupportPage;