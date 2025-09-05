import { supabase } from '@/integrations/supabase/client';
import { localStudies } from '@/content/studyMetadata';
import { achievementDefinitions, AchievementDefinition } from './achievementDefinitions'; // Importa as definições

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
}

export const checkAndAwardAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    // 1. Busca todos os dados necessários do Supabase em paralelo.
    const [
      { data: unlockedAchievementsData, error: unlockedError },
      { data: allAchievementsFromDb, error: allAchievementsError },
      { data: userProgressData, error: userProgressError }
    ] = await Promise.all([
      supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
      supabase.from('achievements').select('*'), // Busca as definições de conquistas do DB (com IDs)
      supabase.from('user_progress').select('chapter_id, study_id').eq('user_id', userId).not('completed_at', 'is', null)
    ]);

    if (unlockedError) throw unlockedError;
    if (allAchievementsError) throw allAchievementsError;
    if (userProgressError) throw userProgressError;

    if (!allAchievementsFromDb) {
      console.error("Não foi possível buscar a lista de conquistas do banco de dados.");
      return [];
    }

    const unlockedIds = new Set(unlockedAchievementsData?.map(a => a.achievement_id) || []);
    const allAchievementsMap = new Map(allAchievementsFromDb.map(ach => [ach.name, ach]));
    const achievementsToAward: Achievement[] = [];

    // Prepara os dados para as condições das conquistas
    const totalCompletedChapters = userProgressData?.length || 0;
    const completedStudies = new Set<string>();
    
    // Mapeia capítulos concluídos por estudo para verificar estudos completos
    const completedChaptersByStudy: { [studyId: string]: number } = {};
    userProgressData?.forEach(progress => {
      if (progress.study_id) {
        completedChaptersByStudy[progress.study_id] = (completedChaptersByStudy[progress.study_id] || 0) + 1;
      }
    });

    // Verifica quais estudos foram completamente concluídos
    localStudies.forEach(study => {
      if (completedChaptersByStudy[study.id] === study.chapters.length) {
        completedStudies.add(study.id);
      }
    });

    const conditionData = {
      totalCompletedChapters,
      completedStudies,
      // Adicione outros dados aqui se precisar para futuras condições de conquistas
    };

    // 2. Itera pelas definições de conquistas e verifica as condições.
    for (const definition of achievementDefinitions) {
      const achievementInDb = allAchievementsMap.get(definition.name);

      if (!achievementInDb) {
        console.warn(`Definição de conquista "${definition.name}" não encontrada no banco de dados. Por favor, certifique-se de que ela foi inserida.`);
        continue; // Pula se a conquista não estiver no DB
      }

      // Se a conquista não foi desbloqueada e a condição é atendida, adiciona para ser concedida
      if (!unlockedIds.has(achievementInDb.id) && definition.checkCondition(conditionData)) {
        achievementsToAward.push(achievementInDb);
      }
    }

    // 3. Insere as novas conquistas no banco de dados, se houver alguma.
    if (achievementsToAward.length > 0) {
      const newAchievementsPayload = achievementsToAward.map(ach => ({
        user_id: userId,
        achievement_id: ach.id,
        unlocked_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase.from('user_achievements').insert(newAchievementsPayload);
      
      if (insertError) {
        console.error('Erro ao conceder conquistas:', insertError);
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