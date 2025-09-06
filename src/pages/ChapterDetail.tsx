import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/contexts/SessionContext';
import { ArrowLeft, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { showError, showAchievementToast } from '@/utils/toast';
import { checkAndAwardAchievements } from '@/utils/achievements';
import { useQueryClient } from '@tanstack/react-query';

interface ChapterDetailData {
  id: string;
  title: string;
  chapter_number: number;
  study_id: string; // Adicionado study_id
  study_title: string;
  bible_text: string;
  explanation: string;
  application: string;
}

interface ChapterFromDB {
  id: string;
  study_id: string;
  chapter_number: number;
  title: string;
}

const ChapterDetail = () => {
  const { studyId, chapterId } = useParams<{ studyId: string; chapterId: string }>();
  const { session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chapterData, setChapterData] = useState<ChapterDetailData | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userNotes, setUserNotes] = useState<string>('');
  const [initialNotes, setInitialNotes] = useState<string>('');
  const [allChaptersInStudy, setAllChaptersInStudy] = useState<ChapterFromDB[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(-1);
  const [completedChaptersCount, setCompletedChaptersCount] = useState(0);
  const [totalChaptersCount, setTotalChaptersCount] = useState(0);

  const saveChapterProgress = useCallback(async (
    currentChapterId: string,
    currentStudyId: string,
    userId: string,
    notes: string,
    markAsCompleted: boolean
  ) => {
    const { data: existingProgress, error: fetchError } = await supabase
      .from('user_progress')
      .select('id, completed_at')
      .eq('user_id', userId)
      .eq('chapter_id', currentChapterId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      showError('Erro ao verificar progresso: ' + fetchError.message);
      console.error('Error fetching existing progress:', fetchError);
      return false;
    }

    const updateData: { notes: string; completed_at?: string | null; study_id?: string } = { notes: notes };
    
    if (markAsCompleted) {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = existingProgress?.completed_at || null;
    }
    updateData.study_id = currentStudyId;

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
          study_id: currentStudyId,
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

    try {
      // 1. Fetch study details from DB
      const { data: studyData, error: studyError } = await supabase
        .from('studies')
        .select('id, title')
        .eq('id', studyId)
        .single();

      if (studyError) throw studyError;
      if (!studyData) {
        console.error('Estudo não encontrado no banco de dados:', studyId);
        setLoading(false);
        return;
      }

      // 2. Fetch current chapter details from DB, including bible_text, explanation, and application
      const { data: chapterDB, error: chapterError } = await supabase
        .from('chapters')
        .select('*, bible_text, explanation, application') // Explicitly select these columns
        .eq('id', chapterId)
        .eq('study_id', studyId)
        .single();

      if (chapterError) throw chapterError;
      if (!chapterDB) {
        console.error('Capítulo não encontrado no banco de dados:', chapterId);
        setLoading(false);
        return;
      }

      // 3. Fetch all chapters for the study to determine navigation and total count
      const { data: allChaptersData, error: allChaptersError } = await supabase
        .from('chapters')
        .select('id, chapter_number, title')
        .eq('study_id', studyId)
        .order('chapter_number', { ascending: true });

      if (allChaptersError) throw allChaptersError;
      if (!allChaptersData) {
        console.error('Não foi possível carregar todos os capítulos para o estudo:', studyId);
        setAllChaptersInStudy([]);
        setTotalChaptersCount(0);
      } else {
        setAllChaptersInStudy(allChaptersData);
        setTotalChaptersCount(allChaptersData.length);
        const chapterIndex = allChaptersData.findIndex(c => c.id === chapterId);
        setCurrentChapterIndex(chapterIndex);
      }

      // Set chapter data directly from DB
      setChapterData({
        id: chapterDB.id,
        title: chapterDB.title,
        chapter_number: chapterDB.chapter_number,
        study_id: studyData.id,
        study_title: studyData.title,
        bible_text: chapterDB.bible_text || 'Conteúdo bíblico não disponível.',
        explanation: chapterDB.explanation || 'Explicação não disponível.',
        application: chapterDB.application || 'Aplicação prática não disponível.',
      });

      // 5. Fetch user progress and notes for current chapter
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

      // 6. Fetch overall study progress for progress bar
      const { data: allProgress, error: allProgressError } = await supabase
        .from('user_progress')
        .select('chapter_id, completed_at')
        .eq('user_id', session.user.id)
        .eq('study_id', studyId); // Filter by study_id

      if (!allProgressError && allProgress) {
        const completed = allProgress.filter(p => p.completed_at !== null).length;
        setCompletedChaptersCount(completed);
      } else {
        setCompletedChaptersCount(0);
      }

    } catch (error: any) {
      console.error('Error in fetchChapterAndStudyData:', error);
      showError('Erro ao carregar o capítulo: ' + error.message);
      setChapterData(null);
    } finally {
      setLoading(false);
    }
  }, [chapterId, studyId, session]);

  useEffect(() => {
    fetchChapterAndStudyData();
  }, [fetchChapterAndStudyData]);

  const handleAdvance = async () => {
    if (!session || !chapterData) return;

    const success = await saveChapterProgress(chapterData.id, chapterData.study_id, session.user.id, userNotes, true);

    if (success) {
      setIsCompleted(true);
      
      // Check and award achievements
      const newAchievements = await checkAndAwardAchievements(session.user.id);
      newAchievements.forEach((ach, index) => {
        setTimeout(() => showAchievementToast(ach), index * 700);
      });

      queryClient.invalidateQueries({ queryKey: ['profileData', session.user.id] });
      queryClient.invalidateQueries({ queryKey: ['studyProgress', session.user.id, studyId] }); // Invalida o progresso do estudo

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
    if (!session || !chapterData) return;

    const success = await saveChapterProgress(chapterData.id, chapterData.study_id, session.user.id, userNotes, isCompleted);
    if (success) {
      setInitialNotes(userNotes);
      showSuccess('Anotações salvas com sucesso!');
      // No need to refetch all data, just update local state or invalidate specific queries if needed
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

  // ID do estudo "150 Salmos Explicados" para formatação especial
  const SALMOS_STUDY_ID = '8a1b2c3d-4e5f-4678-9012-34567890abcd';

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
      <Card className="mt-20">
        <CardHeader>
          <CardTitle className="text-3xl text-primary">
            {chapterData.study_id === SALMOS_STUDY_ID ? chapterData.title : `Capítulo ${chapterData.chapter_number}: ${chapterData.title}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <h3 className="font-bold text-lg text-primary/90">Texto Bíblico</h3>
            <blockquote className="border-l-4 border-primary/50 pl-4 italic">{chapterData.bible_text}</blockquote>
            
            <h3 className="font-bold text-lg text-primary/90 mt-6">Explicação</h3>
            <p>{chapterData.explanation}</p>

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
            <p>{chapterData.application}</p>
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