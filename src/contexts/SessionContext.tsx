import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  isPro: boolean; // Indica se o usuário TEM acesso PRO no momento
  fullName: string | null;
  avatarUrl: string | null;
  hasNewStudyNotification: boolean;
  setNewStudyNotification: (value: boolean) => void;
  refetchProfile: () => Promise<void>;
  onboardingCompleted: boolean;
  quizResponses: string | null;
  preferences: string | null;
  recurrence: number | null;
  currentBillingPeriodStart: string | null;
  proAccessEndAt: string | null; // Novo campo
  paymentStatus: string | null; // Novo campo
  enablePopups: boolean; // Novo campo para controlar pop-ups
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false); // Indica se o usuário TEM acesso PRO no momento
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasNewStudyNotification, setNewStudyNotification] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [quizResponses, setQuizResponses] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<number | null>(null);
  const [currentBillingPeriodStart, setCurrentBillingPeriodStart] = useState<string | null>(null);
  const [proAccessEndAt, setProAccessEndAt] = useState<string | null>(null); // Novo estado
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null); // Novo estado
  const [enablePopups, setEnablePopups] = useState(true); // Novo estado, padrão TRUE

  const fetchProfile = useCallback(async (user: User | null) => {
    if (!user) {
      console.log('fetchProfile: No user, resetting profile states.');
      setIsPro(false);
      setFullName(null);
      setAvatarUrl(null);
      setOnboardingCompleted(false);
      setQuizResponses(null);
      setPreferences(null);
      setRecurrence(null);
      setCurrentBillingPeriodStart(null);
      setProAccessEndAt(null);
      setPaymentStatus(null);
      setEnablePopups(true); // Resetar para padrão
      return;
    }

    console.log('fetchProfile: Fetching profile for user ID:', user.id);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_pro, first_name, last_name, avatar_url, onboarding_completed, quiz_responses, preferences, daily_verse_notifications, study_reminders, achievement_notifications, recurrence, current_billing_period_start, pro_access_end_at, payment_status, enable_popups') // Adicionado pro_access_end_at, payment_status e enable_popups
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('fetchProfile: Error fetching profile:', error);
      setIsPro(false);
      setFullName(null);
      setAvatarUrl(null);
      setOnboardingCompleted(false);
      setQuizResponses(null);
      setPreferences(null);
      setRecurrence(null);
      setCurrentBillingPeriodStart(null);
      setProAccessEndAt(null);
      setPaymentStatus(null);
      setEnablePopups(true); // Resetar para padrão em caso de erro
    } else if (profile) {
      console.log('fetchProfile: Profile data received:', profile);
      
      // Lógica para determinar o status PRO de acesso
      const dbIsPro = profile.is_pro ?? false;
      const dbProAccessEndAt = profile.pro_access_end_at ? new Date(profile.pro_access_end_at) : null;
      const now = new Date();
      
      // isPro no contexto significa "o usuário TEM acesso PRO no momento"
      // Isso é verdade se is_pro no DB for true E (não houver data de fim de acesso OU a data de fim de acesso for no futuro)
      const hasActiveProAccess = dbIsPro && (!dbProAccessEndAt || dbProAccessEndAt > now);
      setIsPro(hasActiveProAccess);

      setFullName([profile.first_name, profile.last_name].filter(Boolean).join(' ') || null);
      setAvatarUrl(profile.avatar_url || null);
      setOnboardingCompleted(profile.onboarding_completed ?? false);
      setQuizResponses(profile.quiz_responses || null);
      setPreferences(profile.preferences || null);
      setRecurrence(profile.recurrence ?? 0);
      setCurrentBillingPeriodStart(profile.current_billing_period_start || null);
      setProAccessEndAt(profile.pro_access_end_at || null); // Definir novo estado
      setPaymentStatus(profile.payment_status || null); // Definir novo estado
      setEnablePopups(profile.enable_popups ?? true); // Definir novo estado, padrão TRUE
      console.log('fetchProfile: Set onboardingCompleted to:', profile.onboarding_completed ?? false);
    } else {
      console.log('fetchProfile: Profile not found for user ID:', user.id, 'Using user_metadata for name.');
      setIsPro(false);
      setFullName(user.user_metadata.first_name || user.user_metadata.last_name ? [user.user_metadata.first_name, user.user_metadata.last_name].filter(Boolean).join(' ') : null);
      setAvatarUrl(user.user_metadata.avatar_url || null);
      setOnboardingCompleted(false);
      setQuizResponses(null);
      setPreferences(null);
      setRecurrence(0);
      setCurrentBillingPeriodStart(null);
      setProAccessEndAt(null);
      setPaymentStatus(null);
      setEnablePopups(true); // Padrão TRUE se perfil não encontrado
      console.log('fetchProfile: Set onboardingCompleted to false (profile not found).');
    }
  }, []);

  const refetchProfile = useCallback(async () => {
    if (session?.user) {
      console.log('refetchProfile: Manually refetching profile for user ID:', session.user.id);
      await fetchProfile(session.user);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    const getSessionAndSetState = async () => {
      if (!isMounted) return;
      setLoading(true);
      console.log('useEffect[initial/visibility]: Attempting to get session.');
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) {
          setSession(currentSession);
          console.log('useEffect[initial/visibility]: Session set:', currentSession ? 'present' : 'null');
        }
      } catch (error) {
        console.error("useEffect[initial/visibility]: Error getting initial session:", error);
        if (isMounted) setSession(null);
      } finally {
      }
    };

    getSessionAndSetState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        console.log('useEffect[initial/visibility]: Page visible, re-getting session.');
        getSessionAndSetState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    console.log('useEffect[onAuthStateChange]: Setting up auth state listener.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        console.log('useEffect[onAuthStateChange]: Auth state changed, new session set:', newSession ? 'present' : 'null', 'Event:', _event);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      console.log('useEffect[onAuthStateChange]: Auth state listener unsubscribed.');
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const updateProfileAndLoading = async () => {
      if (!isMounted) return;
      setLoading(true);
      console.log('useEffect[session]: Session changed, updating profile and loading state. Current session:', session ? 'present' : 'null');
      try {
        await fetchProfile(session?.user ?? null);
      } catch (error) {
        console.error("useEffect[session]: Error updating profile after session change:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    updateProfileAndLoading();
  }, [session, fetchProfile]);

  return (
    <SessionContext.Provider value={{ 
      session, 
      loading, 
      isPro, 
      fullName, 
      avatarUrl, 
      hasNewStudyNotification, 
      setNewStudyNotification, 
      refetchProfile,
      onboardingCompleted,
      quizResponses,
      preferences,
      recurrence,
      currentBillingPeriodStart,
      proAccessEndAt, // Adicionado
      paymentStatus, // Adicionado
      enablePopups, // Adicionado
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};