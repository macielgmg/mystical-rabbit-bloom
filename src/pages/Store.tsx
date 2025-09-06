import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/contexts/SessionContext";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localStudies } from '@/content/studyMetadata';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { showError, showStudyAcquiredToast } from '@/utils/toast';
import { cn } from '@/lib/utils'; // Importar cn para combinar classes

interface StudyWithProgress {
  id: string;
  title: string;
  description: string;
  is_free: boolean;
  imageUrl: string;
  completedChapters: number;
  totalChapters: number;
  progressPercentage: number;
  isAcquired: boolean; // Adicionado: indica se o estudo já foi adquirido (tem algum progresso)
}

const Store = () => {
  const { session, loading: sessionLoading, isPro: isUserPro, setNewStudyNotification } = useSession();
  const navigate = useNavigate();
  const [storeItemsWithProgress, setStoreItemsWithProgress] = useState<StudyWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'free' | 'pro'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [acquiringStudyId, setAcquiringStudyId] = useState<string | null>(null); // Estado para o botão de adquirir

  useEffect(() => {
    const fetchStudiesAndProgress = async () => {
      if (sessionLoading) return;

      setLoading(true);

      let completedChapterIds = new Set<string>();
      let acquiredChapterIds = new Set<string>(); // Novo conjunto para rastrear todos os capítulos com algum progresso

      if (session?.user) {
        const { data: allProgress, error } = await supabase
          .from('user_progress')
          .select('chapter_id, completed_at')
          .eq('user_id', session.user.id);

        if (error) {
          console.error('Error fetching all user progress:', error);
        } else if (allProgress) {
          allProgress.forEach(p => {
            acquiredChapterIds.add(p.chapter_id); // Adiciona todos os capítulos com qualquer entrada de progresso
            if (p.completed_at !== null) {
              completedChapterIds.add(p.chapter_id); // Adiciona apenas se estiver realmente concluído
            }
          });
        }
      }

      const studiesData = localStudies.map(study => {
        const totalChapters = study.chapters.length;
        const chapterIdsInStudy = study.chapters.map(c => c.id);
        
        const completedChapters = chapterIdsInStudy.filter(id => completedChapterIds.has(id)).length;
        // Um estudo é considerado adquirido se pelo menos um de seus capítulos tiver uma entrada em user_progress
        const isAcquired = chapterIdsInStudy.some(id => acquiredChapterIds.has(id));
        
        const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

        return {
          ...study,
          completedChapters,
          totalChapters,
          progressPercentage,
          isAcquired, // Inclui a nova flag
        };
      });

      setStoreItemsWithProgress(studiesData);
      setLoading(false);
    };

    fetchStudiesAndProgress();
  }, [session, sessionLoading]);

  const handleAcquireStudy = async (studyId: string, studyTitle: string) => {
    if (!session?.user) {
      showError("Você precisa estar logado para adquirir um estudo.");
      return;
    }

    setAcquiringStudyId(studyId);

    try {
      const studyToAcquire = localStudies.find(s => s.id === studyId);
      if (!studyToAcquire || studyToAcquire.chapters.length === 0) {
        showError("Estudo ou capítulos não encontrados.");
        return;
      }

      // Inserir progresso para o primeiro capítulo para "adquirir" o estudo
      const firstChapterId = studyToAcquire.chapters[0].id;
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: session.user.id,
          chapter_id: firstChapterId,
          notes: '',
          completed_at: null, // Não está completo, apenas adquirido
        });

      if (error) {
        if (error.code === '23505') { // Duplicate key error (already acquired)
          showError("Você já adquiriu este estudo.");
        } else {
          showError("Erro ao adquirir o estudo: " + error.message);
        }
        return;
      }

      showStudyAcquiredToast({ title: studyTitle, studyId: studyId }); // Passa studyId aqui
      setNewStudyNotification(true); // Ativa a notificação na aba "Estudos"
      
      // Atualiza o estado local para refletir que o estudo foi adquirido
      setStoreItemsWithProgress(prevItems => prevItems.map(item => 
        item.id === studyId ? { ...item, isAcquired: true } : item
      ));
    } catch (error) {
      console.error("Erro inesperado ao adquirir estudo:", error);
      showError("Ocorreu um erro inesperado.");
    } finally {
      setAcquiringStudyId(null);
    }
  };

  const filteredItems = storeItemsWithProgress
    .filter(item => {
      if (filterType === 'all') return true;
      if (filterType === 'free') return item.is_free;
      if (filterType === 'pro') return !item.is_free;
      return true;
    })
    .filter(item => {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto"> {/* Removido pt-6 daqui */}
      <h1 className="text-3xl font-bold mb-2 text-primary">Descobrir</h1>
      <p className="text-muted-foreground mb-6">Aprofunde suas raízes na fé com novos módulos.</p>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar livros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex justify-center">
          <ToggleGroup type="single" value={filterType} onValueChange={(value: 'all' | 'free' | 'pro') => setFilterType(value)} className="bg-card rounded-md shadow-sm">
            <ToggleGroupItem value="all" aria-label="Mostrar todos" className="px-4 py-2 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Todos
            </ToggleGroupItem>
            <ToggleGroupItem value="free" aria-label="Mostrar gratuitos" className="px-4 py-2 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Gratuitos
            </ToggleGroupItem>
            <ToggleGroupItem value="pro" aria-label="Mostrar Pro" className="px-4 py-2 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Pro
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="flex flex-col overflow-hidden">
              <img
                src={item.imageUrl}
                alt={`Capa do estudo ${item.title}`}
                className="w-full h-32 object-cover"
              />
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold leading-tight">{item.title}</CardTitle>
                  {!item.is_free ? (
                    <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-500/80 text-white">Pro</Badge>
                  ) : (
                    <Badge variant="secondary">Gratuito</Badge>
                  )}
                </div>
                <CardDescription className="text-sm mt-1">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className={cn("space-y-2", item.completedChapters > 0 ? "p-4" : "px-4 py-2")}>
                {item.completedChapters > 0 && (
                  <>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Progresso:</span>
                      <span>{item.completedChapters} de {item.totalChapters}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${item.progressPercentage}%` }}></div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0"> {/* Alterado de pt-2 para pt-0 */}
                {item.isAcquired ? (
                  <Button
                    asChild
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  >
                    <Link to={`/study/${item.id}`}>Nos Meus Estudos</Link>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAcquireStudy(item.id, item.title)}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={acquiringStudyId === item.id || (!item.is_free && !isUserPro)}
                  >
                    {acquiringStudyId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      !item.is_free && !isUserPro ? "Assinar Pro" : "Adquirir"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold text-primary">Nenhum estudo encontrado</h2>
          <p className="text-muted-foreground mt-2">Não encontramos estudos que correspondam à sua busca.</p>
        </div>
      )}
    </div>
  );
};

export default Store;