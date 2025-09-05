"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AboutAppPage = () => {
  const navigate = useNavigate();

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
        <h1 className="text-xl font-bold text-primary">Sobre o App</h1>
      </header>

      <Card className="p-6 space-y-4">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" /> Informações do Aplicativo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-3 text-muted-foreground">
          <p>
            Bem-vindo ao Raízes da Fé! Nosso aplicativo foi desenvolvido para ajudar você a aprofundar sua fé e conhecimento da Palavra de Deus através de estudos bíblicos interativos e ferramentas de reflexão pessoal.
          </p>
          <p>
            Acreditamos que o estudo diário da Bíblia é fundamental para o crescimento espiritual e buscamos oferecer uma experiência enriquecedora e acessível para todos.
          </p>
          <div className="pt-4 border-t border-muted-foreground/20 space-y-2">
            <p className="text-sm font-semibold text-primary/90">Versão: 1.4.2b</p>
            <p className="text-sm font-semibold text-primary/90">Desenvolvido por: GM Soluções</p>
            <p className="text-sm text-muted-foreground">© 2025 Todos os direitos reservados.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutAppPage;