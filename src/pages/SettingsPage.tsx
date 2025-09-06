"use client";

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, Palette, Lock, ChevronRight, Sun, Moon, Loader2, Info, BellRing } from 'lucide-react'; // Adicionado Info e BellRing
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/utils/toast';

interface NotificationSettings {
  daily_verse_notifications: boolean;
  study_reminders: boolean;
  achievement_notifications: boolean;
}

interface UserSettings extends NotificationSettings {
  enable_popups: boolean; // Adicionado para buscar também a preferência de pop-ups
}

const fetchUserSettings = async (userId: string): Promise<UserSettings> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('daily_verse_notifications, study_reminders, achievement_notifications, enable_popups')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return {
    daily_verse_notifications: data?.daily_verse_notifications ?? true, // Default to true
    study_reminders: data?.study_reminders ?? true, // Default to true
    achievement_notifications: data?.achievement_notifications ?? true, // Default to true
    enable_popups: data?.enable_popups ?? true, // Default to true
  };
};

const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
  const { error } = await supabase
    .from('profiles')
    .update(settings)
    .eq('id', userId);

  if (error) {
    throw error;
  }
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { session, refetchProfile } = useSession(); // Adicionado refetchProfile
  const queryClient = useQueryClient();

  const { data: userSettings, isLoading: isLoadingSettings, isError: isErrorSettings, error: settingsError } = useQuery<UserSettings, Error>({
    queryKey: ['userSettings', session?.user?.id],
    queryFn: () => fetchUserSettings(session!.user!.id),
    enabled: !!session?.user,
  });

  const settingsMutation = useMutation<void, Error, Partial<UserSettings>>({
    mutationFn: (newSettings) => updateUserSettings(session!.user!.id, newSettings),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['userSettings', session?.user?.id] });
      await refetchProfile(); // Refetch o perfil para atualizar o contexto da sessão
      showSuccess('Preferências salvas!');
    },
    onError: (err) => {
      showError('Erro ao salvar preferências: ' + err.message);
      console.error('Erro ao salvar preferências:', err);
    },
  });

  const handleAllNotificationsToggle = (checked: boolean) => {
    if (userSettings) {
      settingsMutation.mutate({
        daily_verse_notifications: checked,
        study_reminders: checked,
        achievement_notifications: checked,
      });
    }
  };

  const handlePopupsToggle = (checked: boolean) => {
    if (userSettings) {
      settingsMutation.mutate({ enable_popups: checked });
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  // O estado do switch mestre de notificações será 'true' se *qualquer* uma das notificações estiver ativada.
  // Se todas estiverem desativadas, o switch mestre será 'false'.
  const masterNotificationState = userSettings
    ? (userSettings.daily_verse_notifications || userSettings.study_reminders || userSettings.achievement_notifications)
    : true; // Default para true enquanto carrega ou se não houver settings

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
        <h1 className="text-xl font-bold text-primary">Configurações</h1>
      </header>

      <Card className="p-6 space-y-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-semibold">Ajuste suas preferências</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-5">
          {/* Receber Notificações */}
          {isLoadingSettings ? (
            <div className="flex items-center justify-between py-2">
              <Label className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Receber Notificações
              </Label>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : isErrorSettings ? (
            <div className="text-destructive">Erro ao carregar notificações: {settingsError?.message}</div>
          ) : (
            <div className="flex items-center justify-between">
              <Label htmlFor="all-notifications-toggle" className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Receber Notificações
                <p className="text-sm text-muted-foreground">Ative ou desative todas as notificações do aplicativo.</p>
              </Label>
              <Switch
                id="all-notifications-toggle"
                checked={masterNotificationState}
                onCheckedChange={handleAllNotificationsToggle}
                disabled={settingsMutation.isPending}
              />
            </div>
          )}

          {/* Receber Pop-ups no App */}
          {isLoadingSettings ? (
            <div className="flex items-center justify-between py-2">
              <Label className="text-base flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Receber Pop-ups no App
              </Label>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : isErrorSettings ? (
            <div className="text-destructive">Erro ao carregar preferências de pop-up: {settingsError?.message}</div>
          ) : (
            <div className="flex items-center justify-between">
              <Label htmlFor="popups-toggle" className="text-base flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Receber Pop-ups no App
                <p className="text-sm text-muted-foreground">Ative ou desative pop-ups e mensagens importantes no aplicativo.</p>
              </Label>
              <Switch
                id="popups-toggle"
                checked={userSettings.enable_popups}
                onCheckedChange={handlePopupsToggle}
                disabled={settingsMutation.isPending}
              />
            </div>
          )}

          {/* Tema do Aplicativo (Modo Escuro) */}
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode-toggle" className="text-base flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Modo Escuro
              <p className="text-sm text-muted-foreground">Ative o modo escuro para uma experiência mais confortável à noite.</p>
            </Label>
            <Switch
              id="dark-mode-toggle"
              checked={theme === 'dark'}
              onCheckedChange={handleThemeToggle}
            />
          </div>

          {/* Sobre o App */}
          <Link 
            to="/about-app" 
            className="flex items-center justify-between rounded-lg bg-secondary/30 p-4 shadow-sm transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-primary/10">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium text-foreground">Sobre o App</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;