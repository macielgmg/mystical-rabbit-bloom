// src/utils/achievementDefinitions.ts

import { supabase } from '@/integrations/supabase/client';
import { achievementDefinitions, AchievementDefinition } from './achievementDefinitions'; // Importa as definições

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
}

interface ConditionData {
  totalCompletedChapters: number;
  completedStudies: Set<string>;
  streakCount: number;
  totalShares: number;
  totalJournalEntries: number;
  isPro: boolean;
}

export const checkAndAwardAchievements = async (userId: string): Promise<{ newAchievements: Achievement[], conditionData: ConditionData }> => {
  try {
    // 1. Busca todos os dados necessários do Supabase em paralelo.
    const [
      { data: unlockedAchievementsData, error: unlockedError },
      { data: allAchievementsFromDb, error: allAchievementsError },
      { data: userProgressData, error: userProgressError },
      { data: allStudiesData, error: allStudiesError }, // Fetch all studies
      { data: allChaptersData, error: allChaptersError }, // Fetch all chapters
      { data: profileData, error: profileError }, // Fetch profile data for streak, shares, journal, and pro status
    ] = await Promise.all([
      supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
      supabase.from('achievements').select('*'),
      supabase.from('user_progress').select('chapter_id, study_id').eq('user_id', userId).not('completed_at', 'is', null),
      supabase.from('studies').select('id'), // Only need study IDs
      supabase.from('chapters').select('id, study_id'), // Need chapter IDs and their study_id
      supabase.from('profiles').select('streak_count, is_pro, total_shares, total_journal_entries').eq('id', userId).single(), // Fetch streak count, is_pro, total_shares, total_journal_entries
    ]);

    if (unlockedError) throw unlockedError;
    if (allAchievementsError) throw allAchievementsError;
    if (userProgressError) throw userProgressError;
    if (allStudiesError) throw allStudiesError;
    if (allChaptersError) throw allChaptersError;
    if (profileError && profileError.code !== 'PGRST116') throw profileError; // Allow no profile found

    if (!allAchievementsFromDb) {
      console.error("Não foi possível buscar a lista de conquistas do banco de dados.");
      const emptyConditionData: ConditionData = { totalCompletedChapters: 0, completedStudies: new Set(), streakCount: 0, totalShares: 0, totalJournalEntries: 0, isPro: false };
      return { newAchievements: [], conditionData: emptyConditionData };
    }

    const unlockedIds = new Set(unlockedAchievementsData?.map(a => a.achievement_id) || []);
    const allAchievementsMap = new Map(allAchievementsFromDb.map(ach => [ach.name, ach]));
    const achievementsToAward: Achievement[] = [];

    // Prepara os dados para as condições das conquistas
    const totalCompletedChapters = userProgressData?.length || 0;
    const completedStudies = new Set<string>();
    const streakCount = profileData?.streak_count || 0;
    const totalShares = profileData?.total_shares || 0;
    const totalJournalEntries = profileData?.total_journal_entries || 0;
    const isPro = profileData?.is_pro || false;

    // Mapeia capítulos concluídos por estudo
    const completedChaptersByStudy: { [studyId: string]: number } = {};
    userProgressData?.forEach(progress => {
      if (progress.study_id) {
        completedChaptersByStudy[progress.study_id] = (completedChaptersByStudy[progress.study_id] || 0) + 1;
      }
    });

    // Mapeia total de capítulos por estudo
    const totalChaptersByStudy: { [studyId: string]: number } = {};
    allChaptersData?.forEach(chapter => {
      totalChaptersByStudy[chapter.study_id] = (totalChaptersByStudy[chapter.study_id] || 0) + 1;
    });

    // Verifica quais estudos foram completamente concluídos
    allStudiesData?.forEach(study => {
      const studyId = study.id;
      if (totalChaptersByStudy[studyId] && completedChaptersByStudy[studyId] === totalChaptersByStudy[studyId]) {
        completedStudies.add(studyId);
      }
    });

    const conditionData: ConditionData = {
      totalCompletedChapters,
      completedStudies,
      streakCount,
      totalShares,
      totalJournalEntries,
      isPro,
    };

    // 2. Itera pelas definições de conquistas e verifica as condições.
    for (const definition of achievementDefinitions) {
      const achievementInDb = allAchievementsMap.get(definition.name);

      if (!achievementInDb) {
        console.warn(`Definição de conquista "${definition.name}" não encontrada no banco de dados. Por favor, certifique-se de que ela foi inserida.`);
        continue;
      }

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
        return { newAchievements: [], conditionData };
      }
      
      return { newAchievements: achievementsToAward, conditionData };
    }

    return { newAchievements: [], conditionData };
  } catch (error) {
    console.error("Ocorreu um erro inesperado ao verificar as conquistas:", error);
    const emptyConditionData: ConditionData = { totalCompletedChapters: 0, completedStudies: new Set(), streakCount: 0, totalShares: 0, totalJournalEntries: 0, isPro: false };
    return { newAchievements: [], conditionData: emptyConditionData };
  }
};