import { supabase } from '@/integrations/supabase/client';
import { localStudies } from '@/content/studyMetadata';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
}

// A função agora não precisa mais do total de capítulos, ela mesma calcula.
export const checkAndAwardAchievements = async (userId: string, studyId: string): Promise<Achievement[]> => {
  try {
    // 1. Busca todos os dados necessários do Supabase.
    const [
      { data: unlockedAchievementsData },
      { data: allAchievementsData },
      { data: userProgressData }
    ] = await Promise.all([
      supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
      supabase.from('achievements').select('*'),
      supabase.from('user_progress').select('chapter_id').eq('user_id', userId).not('completed_at', 'is', null)
    ]);

    if (!allAchievementsData) {
      console.error("Não foi possível buscar a lista de conquistas.");
      return [];
    }

    // 2. Prepara os dados para verificação.
    const unlockedIds = new Set(unlockedAchievementsData?.map(a => a.achievement_id) || []);
    const allAchievementsMap = new Map(allAchievementsData.map(ach => [ach.name, ach]));
    const achievementsToAward: Achievement[] = [];

    const award = (achievementName: string) => {
      const achievement = allAchievementsMap.get(achievementName);
      if (achievement && !unlockedIds.has(achievement.id) && !achievementsToAward.some(a => a.id === achievement.id)) {
        achievementsToAward.push(achievement);
      }
    };

    // 3. Realiza as verificações.
    
    // A) Conquistas baseadas no NÚMERO TOTAL de capítulos concluídos em TODOS os estudos.
    const totalCompletedChapters = userProgressData?.length || 0;
    if (totalCompletedChapters >= 1) award('Iniciante Fiel');
    if (totalCompletedChapters >= 5) award('Leitor Dedicado'); // NOVA CONQUISTA
    if (totalCompletedChapters >= 10) award('Leitor Assíduo');
    if (totalCompletedChapters >= 50) award('Sábio Estudante');
    if (totalCompletedChapters >= 150) award('Mestre da Palavra');

    // B) Conquistas baseadas na CONCLUSÃO DE ESTUDOS específicos.
    const study = localStudies.find(s => s.id === studyId);
    if (study) {
      const studyChapterIds = new Set(study.chapters.map(c => c.id));
      const completedChapterIdsForThisStudy = userProgressData?.map(p => p.chapter_id).filter(id => studyChapterIds.has(id)) || [];
      
      if (completedChapterIdsForThisStudy.length === study.chapters.length) {
        award('Primeiro Estudo');
      }
    }

    // 4. Insere as novas conquistas no banco de dados, se houver alguma.
    if (achievementsToAward.length > 0) {
      const newAchievementsPayload = achievementsToAward.map(ach => ({
        user_id: userId,
        achievement_id: ach.id,
      }));

      const { error } = await supabase.from('user_achievements').insert(newAchievementsPayload);
      
      if (error) {
        console.error('Erro ao conceder conquistas:', error);
        return [];
      }
      
      return achievementsToAward;
    }

    return [];
  } catch (error) {
    console.error("Ocorreu um erro inesperado ao verificar as conquistas:", error);
    return [];
  }
};