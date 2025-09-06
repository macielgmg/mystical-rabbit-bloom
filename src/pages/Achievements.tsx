import { useEffect, useState, useRef, forwardRef } from "react"; // Importar useRef e forwardRef
import { useNavigate, useLocation } from "react-router-dom"; // Importar useLocation
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Sparkles, BookOpen, GraduationCap, Crown, Flame, TrendingUp, Award, Target, Icon as LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

// --- Shared components and types ---

const iconComponents: { [key: string]: typeof LucideIcon } = {
  Sparkles,
  BookOpen,
  GraduationCap,
  Crown,
  Flame,
  TrendingUp,
  Award,
  Target, // Fallback
};

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
}

// Modificado para usar forwardRef e aceitar prop isHighlighted
const AchievementCard = forwardRef<HTMLDivElement, { title: string, description: string, iconName: string, isUnlocked: boolean, isHighlighted?: boolean }>(
  ({ title, description, iconName, isUnlocked, isHighlighted }, ref) => {
    const Icon = iconComponents[iconName] || Target;
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Card 
            ref={ref} // Atribuir a ref aqui
            className={cn(
              "flex flex-col items-center justify-center p-4 bg-card text-center h-full transition-all cursor-pointer",
              !isUnlocked && "grayscale opacity-50",
              isHighlighted && "ring-4 ring-primary/50 animate-pulse-once" // Adicionar classe de destaque
            )}
          >
            <div className="p-3 rounded-full bg-primary/10 mb-2">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-xs font-semibold text-primary/90 leading-tight">{title}</p>
          </Card>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm text-center">
            <DrawerHeader>
              <div className="flex flex-col items-center justify-center p-4">
                <div className={cn("p-4 rounded-full bg-primary/10 mb-4", !isUnlocked && "grayscale")}>
                  <Icon className="h-12 w-12 text-primary" />
                </div>
                <DrawerTitle className="text-2xl">{title}</DrawerTitle>
                <DrawerDescription className="mt-2">{description}</DrawerDescription>
                {!isUnlocked && (
                   <p className="text-sm text-muted-foreground mt-4 border-t pt-4 w-full">Continue seus estudos para desbloquear esta conquista!</p>
                )}
              </div>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Fechar</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
);

// --- Achievements Page Component ---

const AchievementsPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para obter a localização atual
  const { session } = useSession();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [highlightedAchievementId, setHighlightedAchievementId] = useState<string | null>(null); // Estado para a conquista a ser destacada

  const achievementRefs = useRef<Map<string, HTMLDivElement | null>>(new Map()); // Mapa para armazenar referências aos cards

  useEffect(() => {
    // Verifica se há um ID de conquista para destacar no estado da localização
    if (location.state?.highlightAchievementId) {
      setHighlightedAchievementId(location.state.highlightAchievementId);
      // Limpa o estado para que o destaque não persista em visitas subsequentes
      navigate(location.pathname, { replace: true, state: {} }); 
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const [allAchievementsPromise, unlockedAchievementsPromise] = [
        supabase.from('achievements').select('*'),
        supabase.from('user_achievements').select('achievement_id').eq('user_id', session.user.id)
      ];

      const [
        { data: allAchievementsData, error: allAchievementsError },
        { data: unlockedAchievementsData, error: unlockedAchievementsError }
      ] = await Promise.all([allAchievementsPromise, unlockedAchievementsPromise]);

      if (allAchievementsError) console.error("Erro ao buscar todas as conquistas:", allAchievementsError);
      if (unlockedAchievementsError) console.error("Erro ao buscar conquistas do usuário:", unlockedAchievementsError);

      if (allAchievementsData) {
        setAllAchievements(allAchievementsData);
      }
      if (unlockedAchievementsData) {
        setUnlockedAchievementIds(new Set(unlockedAchievementsData.map(a => a.achievement_id)));
      }

      setLoading(false);
    };

    fetchData();
  }, [session]);

  // Efeito para rolar até a conquista destacada
  useEffect(() => {
    if (highlightedAchievementId) {
      const node = achievementRefs.current.get(highlightedAchievementId);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Remove o destaque após um tempo
        const timer = setTimeout(() => setHighlightedAchievementId(null), 3000); // Destaque por 3 segundos
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedAchievementId, allAchievements]); // Re-executa se a lista de conquistas mudar

  const unlockedAchievements = allAchievements.filter(ach => unlockedAchievementIds.has(ach.id));

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
        <h1 className="text-xl font-bold text-primary">Todas as Conquistas</h1>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="unlocked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unlocked">Desbloqueadas ({unlockedAchievements.length})</TabsTrigger>
            <TabsTrigger value="all">Todas ({allAchievements.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="unlocked">
            {unlockedAchievements.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-4">
                {unlockedAchievements.map((ach) => (
                  <AchievementCard 
                    key={ach.id} 
                    title={ach.name} 
                    description={ach.description}
                    iconName={ach.icon_name}
                    isUnlocked={true} 
                    isHighlighted={highlightedAchievementId === ach.id}
                    ref={node => achievementRefs.current.set(ach.id, node)} // Atribuir ref
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-lg mt-4">
                <h2 className="text-xl font-semibold text-primary">Nenhuma conquista desbloqueada</h2>
                <p className="text-muted-foreground mt-2">Continue seus estudos para ganhar conquistas!</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="all">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-4">
              {allAchievements.map((ach) => (
                <AchievementCard 
                  key={ach.id} 
                  title={ach.name} 
                  description={ach.description}
                  iconName={ach.icon_name}
                  isUnlocked={unlockedAchievementIds.has(ach.id)} 
                  isHighlighted={highlightedAchievementId === ach.id}
                  ref={node => achievementRefs.current.set(ach.id, node)} // Atribuir ref
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AchievementsPage;