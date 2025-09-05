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
import { localStudies } from '@/content/studyMetadata';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, Search, Crown } from 'lucide-react'; // Adicionado Crown para o modal
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

interface StudyWithProgress {
  id: string;
  title: string;
  description: string;
  is_free: boolean;
  imageUrl: string;
  completedChapters: number;
  totalChapters: number;
  progressPercentage: number;
  isAcquired: boolean;
}

const StudyLibrary = () => {
  const { session, loading: sessionLoading, isPro: isUserPro, setNewStudyNotification } = useSession();
  const navigate = useNavigate();
  const [studiesWithProgress, setStudiesWithProgress] = useState<StudyWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProAccessModal, setShowProAccessModal] = useState(false);
  const [modalStudyTitle, setModalStudyTitle] = useState('');

  useEffect(() => {
    const fetchStudiesAndProgress = async () => {
      if (sessionLoading || !session?.user) {
        setStudiesWithProgress([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      const { data: allUserProgress, error: progressError } = await supabase
        .from('user_progress')
        .select('chapter_id, completed_at')
        .eq('user_id', session.user.id);

      if (progressError) {
        console.error('Error fetching user progress:', progressError);
        setLoading(false);
        return;
      }

      const studiesData: StudyWithProgress[] = [];

      if (allUserProgress && allUserProgress.length > 0) {
        const userChapterIds = new Set(allUserProgress.map(p => p.chapter_id));
        const startedStudies = localStudies.filter(study =>
          study.chapters.some(chapter => userChapterIds.has(chapter.id))
        );

        for (const study of startedStudies) {
          const totalChapters = study.chapters.length;
          const chapterIdsInStudy = new Set(study.chapters.map(c => c.id));
          const completedChapters = allUserProgress.filter(p =>
            chapterIdsInStudy.has(p.chapter_id) && p.completed_at !== null
          ).length;
          const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

          studiesData.push({
            ...study,
            completedChapters,
            totalChapters,
            progressPercentage,
          });
        }
      }

      setStudiesWithProgress(studiesData);
      setLoading(false);
    };

    fetchStudiesAndProgress();
  }, [session, sessionLoading]);

  const handleProStudyAccessAttempt = (studyTitle: string) => {
    setModalStudyTitle(studyTitle);
    setShowProAccessModal(true);
  };

  const filteredStudies = studiesWithProgress.filter(study => {
    const query = searchQuery.toLowerCase();
    return (
      study.title.toLowerCase().includes(query) ||
      study.description.toLowerCase().includes(query)
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
      <h1 className="text-3xl font-bold mb-2 text-primary">Meus Estudos</h1>
      <p className="text-muted-foreground mb-6">Continue de onde parou ou comece uma nova jornada.</p>
      
      {studiesWithProgress.length > 0 && (
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar em meus estudos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {studiesWithProgress.length > 0 ? (
        filteredStudies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudies.map((study) => (
              <Card key={study.id} className="flex flex-col overflow-hidden">
                <img
                  src={study.imageUrl}
                  alt={`Capa do estudo ${study.title}`}
                  className="w-full h-32 object-cover"
                />
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold leading-tight">{study.title}</CardTitle>
                    {!study.is_free && <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-500/80 text-white">Pro</Badge>}
                  </div>
                  <CardDescription className="text-sm mt-1">{study.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 p-4">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Progresso:</span>
                    <span>{study.completedChapters} de {study.totalChapters}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${study.progressPercentage}%` }}></div>
                  </div>
                </CardContent>
                <CardFooter className="p-4">
                  {!study.is_free && !isUserPro ? (
                    <Button
                      onClick={() => handleProStudyAccessAttempt(study.title)}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Acessar (Pro)
                    </Button>
                  ) : (
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link to={`/study/${study.id}`}>
                        {study.completedChapters === 0
                          ? "Começar Estudo"
                          : study.completedChapters === study.totalChapters
                            ? "Revisar Estudo"
                            : "Continuar Estudo"}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold text-primary">Nenhum resultado encontrado</h2>
            <p className="text-muted-foreground mt-2">Tente pesquisar com outros termos.</p>
          </div>
        )
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold text-primary">Nenhum estudo iniciado</h2>
            <p className="text-muted-foreground mt-2">Vá para a aba "Descobrir" para começar uma nova jornada de fé.</p>
            <Button asChild className="mt-4">
                <Link to="/store">Descobrir Estudos</Link>
            </Button>
        </div>
      )}

      {/* Modal de Aviso de Acesso Pro */}
      <AlertDialog open={showProAccessModal} onOpenChange={setShowProAccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <Crown className="h-16 w-16 text-yellow-500 mb-4" />
            <AlertDialogTitle className="text-2xl font-bold text-primary">Acesso Pro Necessário</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              O estudo "{modalStudyTitle}" é um conteúdo exclusivo para membros Pro.
              Assine o plano Pro para ter acesso ilimitado a este e outros estudos premium!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="w-full sm:w-auto">Fechar</Button>
            </AlertDialogCancel>
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
    </div>
  );
};

export default StudyLibrary;