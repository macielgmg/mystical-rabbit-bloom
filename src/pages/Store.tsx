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
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Star } from 'lucide-react'; // Importar Star
import { Input } from '@/components/ui/input';
import { showError, showStudyAcquiredToast } from '@/utils/toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StudyFromDB {
  id: string;
  title: string;
  description: string;
  is_free: boolean;
  cover_image_url: string;
}

interface ChapterFromDB {
  id: string;
  study_id: string;
  chapter_number: number;
  title: string;
}

interface StudyWithProgress extends StudyFromDB {
  imageUrl: string; // Mapeia cover_image_url para imageUrl para compatibilidade
  completedChapters: number;
  totalChapters: number;
  progressPercentage: number;
  isAcquired: boolean;
}

const Store = () => {
  const { session, loading: sessionLoading, isPro: isUserPro, setNewStudyNotification } = useSession();
  const navigate = useNavigate();
  const [storeItemsWithProgress, setStoreItemsWithProgress] = useState<StudyWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'free' | 'pro'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [acquiringStudyId, setAcquiringStudyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudiesAndProgress = async () => {
      if (sessionLoading) return;

      setLoading(true);
      const userId = session?.user?.id;

      try {
        // 1. Fetch all studies from the database
        const { data: studiesData, error: studiesError } = await supabase
          .from('studies')
          .select('*');

        if (studiesError) throw studiesError;

        // 2. Fetch all chapters for all studies
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('id, study_id, chapter_number, title'); // Adicionado chapter_number e title

        if (chaptersError) throw chaptersError;

        const chaptersByStudy: { [studyId: string]: ChapterFromDB[] } = {};
        chaptersData.forEach(chapter => {
          if (!chaptersByStudy[chapter.study_id]) {
            chaptersByStudy[chapter.study_id] = [];
          }
          chaptersByStudy[chapter.study_id].push(chapter);
        });

        // 3. Fetch all user progress (if user is logged in)
        let completedChapterIds = new Set<string>();
        let acquiredStudyIds = new Set<string>();

        if (userId) {
          const { data: allUserProgress, error: progressError } = await supabase
            .from('user_progress')
            .select('chapter_id, completed_at, study_id')
            .eq('user_id', userId);

          if (progressError) {
            console.error('Error fetching all user progress:', progressError);
          } else if (allUserProgress) {
            allUserProgress.forEach(p => {
              if (p.study_id) acquiredStudyIds.add(p.study_id);
              if (p.completed_at !== null) {
                completedChapterIds.add(p.chapter_id);
              }
            });
          }
        }

        const studiesWithCalculatedProgress: StudyWithProgress[] = studiesData.map(study => {
          const studyChapters = chaptersByStudy[study.id] || [];
          const totalChapters = studyChapters.length;
          
          const completedChapters = studyChapters.filter(chapter => completedChapterIds.has(chapter.id)).length;
          const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
          
          return {
            ...study,
            imageUrl: study.cover_image_url,
            completedChapters,
            totalChapters,
            progressPercentage,
            isAcquired: acquiredStudyIds.has(study.id),
          };
        });

        setStoreItemsWithProgress(studiesWithCalculatedProgress);

      } catch (error: any) {
        console.error('Error fetching studies for store:', error);
        showError('Erro ao carregar estudos: ' + error.message);
        setStoreItemsWithProgress([]);
      } finally {
        setLoading(false);
      }
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
      // Fetch the study and its first chapter from the database
      const { data: studyToAcquire, error: studyError } = await supabase
        .from('studies')
        .select('*')
        .eq('id', studyId)
        .single();

      if (studyError) throw studyError;
      if (!studyToAcquire) {
        showError("Estudo não encontrado.");
        return;
      }

      // Fetch all chapters for the study, then pick the first one
      const { data: chapters, error: chapterError } = await supabase
        .from('chapters')
        .select('id')
        .eq('study_id', studyId)
        .order('chapter_number', { ascending: true })
        .limit(1); // Removido .single()

      if (chapterError) throw chapterError;
      
      const firstChapter = chapters && chapters.length > 0 ? chapters[0] : null;

      if (!firstChapter) {
        showError("Capítulos não encontrados para este estudo.");
        return;
      }

      // Insert progress for the first chapter to "acquire" the study
      const { error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: session.user.id,
          study_id: studyId, // Ensure study_id is passed
          chapter_id: firstChapter.id,
          notes: '',
          completed_at: null, // Not complete, just acquired
        });

      if (insertError) {
        if (insertError.code === '23505') { // Duplicate key error (already acquired)
          showError("Você já adquiriu este estudo.");
        } else {
          showError("Erro ao adquirir o estudo: " + insertError.message);
        }
        return;
      }

      showStudyAcquiredToast({ title: studyTitle, studyId: studyId });
      setNewStudyNotification(true);
      
      // Update local state to reflect that the study was acquired
      setStoreItemsWithProgress(prevItems => prevItems.map(item => 
        item.id === studyId ? { ...item, isAcquired: true } : item
      ));
    } catch (error: any) {
      console.error("Erro inesperado ao adquirir estudo:", error);
      showError("Ocorreu um erro inesperado: " + error.message);
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
    <div className="container mx-auto">
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
              <CardFooter className="p-4 pt-0">
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
                    className={cn(
                      "w-full bg-primary hover:bg-primary/90" // Cor do botão de continuar
                    )}
                    disabled={acquiringStudyId === item.id || (!item.is_free && !isUserPro)}
                  >
                    {acquiringStudyId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      !item.is_free && !isUserPro ? (
                        <>
                          Assinar Pro <Star className="h-4 w-4 ml-2 fill-yellow-300 text-yellow-300" /> {/* Estrela amarela */}
                        </>
                      ) : "Adquirir"
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