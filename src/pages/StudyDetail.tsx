import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, PlayCircle, Loader2, Crown, Frown } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from '@/lib/utils';

interface ChapterFromDB {
  id: string;
  study_id: string;
  chapter_number: number;
  title: string;
}

interface Chapter extends ChapterFromDB {
  completed: boolean;
}

interface StudyFromDB {
  id: string;
  title: string;
  description: string;
  is_free: boolean;
  cover_image_url: string;
}

const CHAPTERS_PER_PAGE = 10; // Definindo 10 capítulos por página

const StudyDetail = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const { session, isPro: isUserPro } = useSession();
  const navigate = useNavigate();
  const [study, setStudy] = useState<StudyFromDB | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]); // Todos os capítulos
  const [loading, setLoading] = useState(true);
  const [showProAccessModal, setShowProAccessModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Estado para a página atual

  useEffect(() => {
    const fetchStudyData = async () => {
      if (!studyId || !session) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1. Fetch study details from the database
        const { data: studyData, error: studyError } = await supabase
          .from('studies')
          .select('*')
          .eq('id', studyId)
          .single();

        if (studyError) throw studyError;
        if (!studyData) {
          console.error('Estudo não encontrado no banco de dados:', studyId);
          setLoading(false);
          return;
        }
        setStudy(studyData);

        // Check for Pro access
        if (!studyData.is_free && !isUserPro) {
          setShowProAccessModal(true);
          setLoading(false);
          return;
        }

        // 2. Fetch all chapters for this study from the database
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('study_id', studyId)
          .order('chapter_number', { ascending: true });

        if (chaptersError) throw chaptersError;
        if (!chaptersData) {
          console.error('Capítulos não encontrados para o estudo:', studyId);
          setAllChapters([]);
          setLoading(false);
          return;
        }

        const chapterIds = chaptersData.map(c => c.id);

        // 3. Fetch user progress for these chapters
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('chapter_id, completed_at')
          .eq('user_id', session.user.id)
          .in('chapter_id', chapterIds);

        if (progressError) {
          console.error('Erro ao buscar progresso dos capítulos:', progressError);
          // Proceed with chapters marked as not completed if progress fetch fails
          setAllChapters(chaptersData.map(c => ({ ...c, completed: false })));
          setLoading(false);
          return;
        }

        const completedChapterIds = new Set(
          progressData
            .filter(p => p.completed_at !== null)
            .map(p => p.chapter_id)
        );

        const chaptersWithProgress = chaptersData.map(chapter => ({
          ...chapter,
          completed: completedChapterIds.has(chapter.id),
        }));

        setAllChapters(chaptersWithProgress);

      } catch (error: any) {
        console.error('Error fetching study data:', error);
        setStudy(null);
        setAllChapters([]);
        // Only show error toast if it's not the 'no rows found' error for studyData
        if (error.code !== 'PGRST116') {
          showError('Erro ao carregar detalhes do estudo: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudyData();
  }, [studyId, session, isUserPro]);

  const nextChapter = React.useMemo(() => {
    if (allChapters.length === 0) return null;
    const firstUncompleted = allChapters.find(c => !c.completed);
    if (firstUncompleted) {
      return firstUncompleted;
    }
    return allChapters[allChapters.length - 1];
  }, [allChapters]);

  const handleContinue = () => {
    if (nextChapter) {
      navigate(`/study/${studyId}/chapter/${nextChapter.id}`);
    }
  };

  // Lógica de paginação
  const totalPages = Math.ceil(allChapters.length / CHAPTERS_PER_PAGE);
  const startIndex = (currentPage - 1) * CHAPTERS_PER_PAGE;
  const endIndex = startIndex + CHAPTERS_PER_PAGE;
  const displayedChapters = allChapters.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo ao mudar de página
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5; // Número máximo de páginas visíveis diretamente
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(<PaginationItem key="ellipsis-start"><PaginationEllipsis /></PaginationItem>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={i === currentPage} onClick={() => handlePageChange(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationItem key="ellipsis-end"><PaginationEllipsis /></PaginationItem>);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!study) {
    return <div className="text-center">Estudo não encontrado.</div>;
  }

  if (showProAccessModal) {
    return (
      <AlertDialog open={showProAccessModal} onOpenChange={setShowProAccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <Crown className="h-16 w-16 text-yellow-500 mb-4" />
            <AlertDialogTitle className="text-2xl font-bold text-primary">Acesso Pro Necessário</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              O estudo "{study.title}" é um conteúdo exclusivo para membros Pro.
              Assine o plano Pro para ter acesso ilimitado a este e outros estudos premium!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
            <AlertDialogAction asChild>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => navigate('/library')}
              >
                Voltar para Meus Estudos
              </Button>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Button 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                onClick={() => {
                  setShowProAccessModal(false);
                  navigate('/manage-subscription');
                }}
              >
                Ver Planos Pro
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  const completedChapters = allChapters.filter(c => c.completed).length;
  const totalChapters = allChapters.length;
  const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  // ID do estudo "150 Salmos Explicados"
  const SALMOS_STUDY_ID = '8a1b2c3d-4e5f-4678-9012-34567890abcd';

  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl text-primary">{study.title}</CardTitle>
          <CardDescription>{study.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold">Progresso</h3>
                <span className="text-sm text-muted-foreground">{completedChapters} de {totalChapters} concluídos</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            {nextChapter && (
              <Button onClick={handleContinue} className="w-full">
                <PlayCircle className="mr-2 h-4 w-4" />
                {completedChapters === totalChapters ? 'Revisar último capítulo' : 'Continuar de onde parou'}
              </Button>
            )}
          </div>

          <h3 className="text-xl font-bold mb-4 text-primary">Capítulos</h3>
          <div className="space-y-3">
            {displayedChapters.map((chapter) => (
              <Link
                key={chapter.id}
                to={`/study/${studyId}/chapter/${chapter.id}`}
                className="block p-4 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {chapter.completed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    <span className="font-medium">
                      {study.id === SALMOS_STUDY_ID ? chapter.title : `Capítulo ${chapter.chapter_number}: ${chapter.title}`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent className="flex flex-wrap justify-center gap-1">
                <PaginationItem className="flex-1 sm:flex-none">
                  <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)}>Anterior</PaginationPrevious>
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem className="flex-1 sm:flex-none">
                  <PaginationNext onClick={() => handlePageChange(currentPage + 1)}>Próximo</PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyDetail;