import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/contexts/SessionContext';
import { ArrowLeft, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { localStudyContent } from '@/content/salmosContent';
import { localStudies } from '@/content/studyMetadata';
import { showSuccess, showError, showAchievementToast } from '@/utils/toast';
import { checkAndAwardAchievements } from '@/utils/achievements';

interface ChapterDetailData {
  id: string;
  title: string;
  chapter_number: number;
  study_title: string;
  bible_text: string;
  explanation: string;
  application: string;
}

interface LocalChapterMetadata {
  id: string;
  chapter_number: number;
  title: string;
}

const ChapterDetail = () => {
  const { studyId, chapterId } = useParams<{ studyId: string; chapterId: string }>();
  const { session } = useSession();
  const navigate = useNavigate();
  const [chapterData, setChapterData] = useState<ChapterDetailData | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userNotes, setUserNotes] = useState<string>('');
  const [initialNotes, setInitialNotes] = useState<string>('');
  const [allChaptersInStudy, setAllChaptersInStudy] = useState<LocalChapterMetadata[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(-1);
  const [completedChaptersCount, setCompletedChaptersCount] = useState(0);
  const [totalChaptersCount, setTotalChaptersCount] = useState(0);


  const saveChapterProgress = useCallback(async (
    currentChapterId: string,
    userId: string,
    notes: string,
    markAsCompleted: boolean // Explicitamente indica se deve marcar como concluído
  ) => {
    const { data: existingProgress, error: fetchError } = await supabase
      .from('user_progress')
      .select('id, completed_at')
      .eq('user_id', userId)
      .eq('chapter_id', currentChapterId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      showError('Erro ao verificar progresso: ' + fetchError.message);
      console.error('Error fetching existing progress:', fetchError);
      return false;
    }

    const updateData: { notes: string; completed_at?: string | null } = { notes: notes };
    
    // Se markAsCompleted for true, define completed_at para agora.
    // Se markAsCompleted for false, e já existia um completed_at, mantém. Caso contrário, null.
    if (markAsCompleted) {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = existingProgress?.completed_at || null;
    }

    if (existingProgress) {
      const { error: updateError } = await supabase
        .from('user_progress')
        .update(updateData)
        .eq('id', existingProgress.id);

      if (updateError) {
        showError('Erro ao atualizar progresso: ' + updateError.message);
        console.error('Error updating progress:', updateError);
        return false;
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_progress')
        .insert({ 
          user_id: userId, 
          chapter_id: currentChapterId, 
          notes: notes, 
          completed_at: markAsCompleted ? new Date().toISOString() : null 
        });

      if (insertError) {
        showError('Erro ao salvar progresso: ' + insertError.message);
        console.error('Error inserting progress:', insertError);
        return false;
      }
    }
    return true;
  }, []);

  const fetchChapterAndStudyData = useCallback(async () => {
    if (!chapterId || !studyId || !session) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const foundStudy = localStudies.find(s => s.id === studyId);
    if (!foundStudy) {
      console.error('Estudo não encontrado no arquivo local:', studyId);
      setLoading(false);
      return;
    }

    setAllChaptersInStudy(foundStudy.chapters);
    setTotalChaptersCount(foundStudy.chapters.length);

    const chapterIndex = foundStudy.chapters.findIndex(c => c.id === chapterId);
    setCurrentChapterIndex(chapterIndex);

    const chapterDB = foundStudy.chapters[chapterIndex];
    if (!chapterDB) {
      console.error('Capítulo não encontrado no arquivo local:', chapterId);
      setLoading(false);
      return;
    }

    let bible_text = '';
    let explanation = '';
    let application = '';

    const studyKey = foundStudy.title.toLowerCase().replace(/\s/g, '-');
    const localContentForStudy = localStudyContent[studyKey];

    if (localContentForStudy) {
      const localChapter = localContentForStudy.find(
        (c) => c.chapter_number === chapterDB.chapter_number
      );
      if (localChapter) {
        bible_text = localChapter.bible_text;
        explanation = localChapter.explanation;
        application = localChapter.application;
      } else {
        console.warn(`Local content not found for chapter ${chapterDB.chapter_number} in study ${studyKey}`);
      }
    }

    setChapterData({
      id: chapterDB.id,
      title: chapterDB.title,
      chapter_number: chapterDB.chapter_number,
      study_title: foundStudy.title,
      bible_text,
      explanation,
      application,
    });

    // Fetch user progress and notes for current chapter
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('id, notes, completed_at')
      .eq('user_id', session.user.id)
      .eq('chapter_id', chapterId)
      .single();
    
    if (!progressError && progressData) {
      setIsCompleted(!!progressData.completed_at);
      setUserNotes(progressData.notes || '');
      setInitialNotes(progressData.notes || '');
    } else {
      setIsCompleted(false);
      setUserNotes('');
      setInitialNotes('');
    }

    // Fetch overall study progress
    const { data: allProgress, error: allProgressError } = await supabase
      .from('user_progress')
      .select('chapter_id, completed_at')
      .eq('user_id', session.user.id)
      .in('chapter_id', foundStudy.chapters.map(c => c.id));

    if (!allProgressError && allProgress) {
      const completed = allProgress.filter(p => p.completed_at !== null).length;
      setCompletedChaptersCount(completed);
    } else {
      setCompletedChaptersCount(0);
    }

    setLoading(false);
  }, [chapterId, studyId, session]);

  useEffect(() => {
    fetchChapterAndStudyData();
  }, [fetchChapterAndStudyData]);

  const handleAdvance = async () => {
    if (!session || !chapterId || !studyId) return;

    // Always try to mark as completed when advancing
    const success = await saveChapterProgress(chapterId, session.user.id, userNotes, true);

    if (success) {
      // After successful save, update local state and check achievements
      setIsCompleted(true); // Mark as completed locally
      const newAchievements = await checkAndAwardAchievements(session.user.id, studyId);
      newAchievements.forEach((ach, index) => {
        setTimeout(() => showAchievementToast(ach), index * 700);
      });

      if (nextChapter) {
        navigate(`/study/${studyId}/chapter/${nextChapter.id}`);
        showSuccess('Capítulo concluído!');
      } else {
        navigate(`/study/${studyId}`);
        showSuccess('Estudo finalizado!');
      }
    }
  };

  const handleSaveNotes = async () => {
    if (!session || !chapterId) return;

    // Save notes, preserving the current completion status
    const success = await saveChapterProgress(chapterId, session.user.id, userNotes, isCompleted);
    if (success) {
      setInitialNotes(userNotes);
      showSuccess('Anotações salvas com sucesso!');
      fetchChapterAndStudyData(); // Re-fetch to ensure all counts are updated
    }
  };

  const handleCancelNotes = () => {
    setUserNotes(initialNotes);
  };

  const prevChapter = currentChapterIndex > 0 ? allChaptersInStudy[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < allChaptersInStudy.length - 1 ? allChaptersInStudy[currentChapterIndex + 1] : null;
  const progressPercentage = totalChaptersCount > 0 ? (completedChaptersCount / totalChaptersCount) * 100 : 0;


  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chapterData) {
    return <div className="text-center p-8">Capítulo não encontrado.</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="fixed top-0 left-0 right-0 z-10 bg-background p-4 border-b border-border flex justify-around items-center max-w-3xl mx-auto gap-2">
        {/* Botão Voltar (para capítulo anterior) */}
        <Button 
          variant="ghost" 
          onClick={() => prevChapter ? navigate(`/study/${studyId}/chapter/${prevChapter.id}`) : null} 
          disabled={!prevChapter}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        {/* Botão Voltar ao Estudo (para a página de detalhes do estudo) */}
        <Button variant="ghost" onClick={() => navigate(`/study/${studyId}`)} className="flex-1">
            <BookOpen className="mr-2 h-4 w-4" />
            Estudos
        </Button>
        
        {/* Botão Avançar (para próximo capítulo ou finalizar) */}
        <Button 
          onClick={handleAdvance} 
          disabled={!session}
          className="flex-1"
        >
          {nextChapter ? 'Avançar' : 'Finalizar Estudo'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <Card className="mt-20"> {/* Adicionado mt-20 para compensar a barra fixa */}
        <CardHeader>
          <CardTitle className="text-3xl text-primary">{chapterData.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <h3 className="font-bold text-lg text-primary/90">Texto Bíblico</h3>
            <blockquote className="border-l-4 border-primary/50 pl-4 italic">{chapterData.bible_text || 'Conteúdo bíblico não disponível.'}</blockquote>
            
            <h3 className="font-bold text-lg text-primary/90 mt-6">Explicação</h3>
            <p>{chapterData.explanation || 'Explicação não disponível.'}</p>

            <div className="mb-6 space-y-2 pt-4 border-t border-muted-foreground/20 mt-6">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-primary/80">Seu Progresso no Estudo</h4>
                    <span className="text-sm text-muted-foreground">{completedChaptersCount} de {totalChaptersCount} capítulos concluídos</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>

            <h3 className="font-bold text-lg text-primary/90 mt-6">Aplicação Prática</h3>
            <p>{chapterData.application || 'Aplicação prática não disponível.'}</p>
          </div>

          <div className="space-y-4 pt-6 border-t border-muted-foreground/20">
            <h3 className="font-bold text-lg text-primary/90">Minhas Anotações</h3>
            <Textarea
              placeholder="Escreva suas anotações aqui..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={handleCancelNotes} 
                disabled={userNotes === initialNotes}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveNotes} 
                disabled={userNotes === initialNotes}
              >
                Salvar Anotações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChapterDetail;