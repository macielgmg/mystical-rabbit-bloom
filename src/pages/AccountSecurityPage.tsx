import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Loader2, Mail, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Esquema de validação para mudança de senha
const passwordSchema = z.object({
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres."),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmNewPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const AccountSecurityPage = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(session?.user?.email || '');

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const handleUpdateEmail = async () => {
    if (!session?.user || !newEmail) {
      showError("Email inválido ou usuário não logado.");
      return;
    }
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        throw error;
      }
      showSuccess("Email de verificação enviado! Por favor, verifique sua caixa de entrada para confirmar a mudança.");
    } catch (error: any) {
      showError("Erro ao atualizar email: " + error.message);
      console.error("Erro ao atualizar email:", error);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (values: PasswordFormValues) => {
    if (!session?.user) {
      showError("Usuário não logado.");
      return;
    }
    passwordForm.clearErrors(); // Limpa erros anteriores
    try {
      const { error } = await supabase.auth.updateUser({ password: values.newPassword });
      if (error) {
        throw error;
      }
      showSuccess("Senha atualizada com sucesso!");
      passwordForm.reset(); // Limpa o formulário
    } catch (error: any) {
      showError("Erro ao atualizar senha: " + error.message);
      console.error("Erro ao atualizar senha:", error);
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
        <h1 className="text-xl font-bold text-primary">Segurança da Conta</h1>
      </header>

      <div className="space-y-6">
        {/* Alterar Email */}
        <Card className="p-6 space-y-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Alterar Email
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div>
              <Label htmlFor="current-email">Email Atual</Label>
              <Input
                id="current-email"
                type="email"
                value={session?.user?.email || ''}
                readOnly
                className="mt-1 bg-muted cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="new-email">Novo Email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="Digite seu novo email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleUpdateEmail} 
              disabled={isUpdatingEmail || newEmail === session?.user?.email || !newEmail} 
              className="w-full"
            >
              {isUpdatingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Atualizar Email
            </Button>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card className="p-6 space-y-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua nova senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirme sua nova senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={passwordForm.formState.isSubmitting || !passwordForm.formState.isValid} 
                  className="w-full"
                >
                  {passwordForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Atualizar Senha
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSecurityPage;