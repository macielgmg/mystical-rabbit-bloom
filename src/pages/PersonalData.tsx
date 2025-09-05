import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Camera, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const PersonalData = () => {
  const navigate = useNavigate();
  const { session, avatarUrl, refetchProfile } = useSession();

  const [firstName, setFirstName] = useState('');
  const [initialFirstName, setInitialFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [initialLastName, setInitialLastName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingProfileData, setLoadingProfileData] = useState(true);

  const getInitials = (first: string | null | undefined, last: string | null | undefined, email: string | null | undefined) => {
    if (first && last) {
      return `${first[0]}${last[0]}`.toUpperCase();
    }
    if (first) {
      return first.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // A função calculateAge não é mais necessária, pois a idade virá diretamente de quiz_responses.
  // Mantemos a função formatGender para formatar o valor do quiz_responses.
  const formatGender = (genderValue: string | null): string => {
    if (!genderValue) return 'Não informado';
    switch (genderValue) {
      case 'masculino': return 'Masculino';
      case 'feminino': return 'Feminino';
      case 'nao-informar': return 'Prefiro não informar';
      default: return genderValue;
    }
  };

  const fetchCurrentProfileData = useCallback(async () => {
    if (!session?.user) {
      setLoadingProfileData(false);
      return;
    }
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, quiz_responses') // Simplificado para buscar apenas o necessário
      .eq('id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error('Erro ao carregar perfil para Dados Pessoais:', error);
      showError('Erro ao carregar dados do perfil.');
      setLoadingProfileData(false);
      return;
    } 
    
    if (profile) {
      setFirstName(profile.first_name || '');
      setInitialFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setInitialLastName(profile.last_name || '');

      // Extrair idade e gênero de quiz_responses
      if (profile.quiz_responses) {
        try {
          const parsedQuizResponses = JSON.parse(profile.quiz_responses);
          setAge(parsedQuizResponses.q1_age || null); // Idade diretamente de q1_age
          setGender(formatGender(parsedQuizResponses.q1_gender || null)); // Gênero de q1_gender
        } catch (parseError) {
          console.error('Erro ao analisar quiz_responses para idade e gênero:', parseError);
          setAge(null);
          setGender('Não informado');
        }
      } else {
        setAge(null);
        setGender('Não informado');
      }
    } else {
      // Se o perfil não for encontrado, mas o usuário existe (ex: recém-criado)
      setFirstName(session.user.user_metadata.first_name || '');
      setInitialFirstName(session.user.user_metadata.first_name || '');
      setLastName(session.user.user_metadata.last_name || '');
      setInitialLastName(session.user.user_metadata.last_name || '');
      setAge(null);
      setGender('Não informado');
    }
    setLoadingProfileData(false);
  }, [session]);

  useEffect(() => {
    fetchCurrentProfileData();
  }, [fetchCurrentProfileData]);

  const handleSaveProfile = async () => {
    if (!session?.user) return;
    setSavingProfile(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
      })
      .eq('id', session.user.id);

    if (error) {
      showError("Não foi possível atualizar o perfil.");
      console.error(error);
    } else {
      showSuccess("Perfil atualizado com sucesso!");
      await refetchProfile(); // Atualiza o contexto da sessão
      setInitialFirstName(firstName);
      setInitialLastName(lastName);
    }
    setSavingProfile(false);
  };

  const hasChanges = 
    firstName !== initialFirstName ||
    lastName !== initialLastName;

  if (loadingProfileData) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        <h1 className="text-xl font-bold text-primary">Informações Pessoais</h1>
      </header>

      <Card className="p-6 space-y-6">
        {/* Seção de Avatar e Nome */}
        <div className="flex flex-col items-center space-y-2 pt-2 pb-4">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt="Foto do perfil" />
              <AvatarFallback className="text-3xl bg-secondary">{getInitials(firstName, lastName, session?.user?.email)}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-background">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-center w-full">
            <h2 className="text-2xl font-bold text-primary">
              {[firstName, lastName].filter(Boolean).join(' ') || 'Usuário'}
            </h2>
          </div>
        </div>

        {/* Campos do Formulário */}
        <div className="space-y-4">
          {/* Primeiro Nome */}
          <div>
            <Label htmlFor="firstName">Primeiro Nome</Label>
            <Input
              id="firstName"
              placeholder="Seu primeiro nome"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Sobrenome */}
          <div>
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              placeholder="Seu sobrenome"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ''}
                readOnly
                className="pl-10 bg-muted cursor-not-allowed"
              />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
          </div>

          {/* Idade */}
          <div>
            <Label htmlFor="age">Idade</Label>
            <Input
              id="age"
              value={age !== null ? `${age} anos` : 'Não informado'}
              readOnly
              className="mt-1 bg-muted cursor-not-allowed"
            />
          </div>

          {/* Gênero */}
          <div>
            <Label htmlFor="gender">Gênero</Label>
            <Input
              id="gender"
              value={gender || 'Não informado'}
              readOnly
              className="mt-1 bg-muted cursor-not-allowed"
            />
          </div>
        </div>

        {/* Botão Salvar */}
        <Button
          className="w-full mt-6"
          onClick={handleSaveProfile}
          disabled={savingProfile || !hasChanges}
        >
          {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </Card>
    </div>
  );
};

export default PersonalData;