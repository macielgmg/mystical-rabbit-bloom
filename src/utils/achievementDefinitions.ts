// src/utils/achievementDefinitions.ts

// Interface para a definição de uma conquista, excluindo 'id' que virá do banco de dados
export interface AchievementDefinition {
  name: string;
  description: string;
  icon_name: string;
  // A função checkCondition recebe os dados necessários para verificar a conquista
  checkCondition: (data: {
    totalCompletedChapters: number;
    completedStudies: Set<string>; // IDs dos estudos completos
    streakCount: number; // Adicionado para a nova conquista
    totalShares: number; // Adicionado para a nova conquista
    totalJournalEntries: number; // Adicionado para a nova conquista
    isPro: boolean; // Adicionado para a nova conquista
    // Adicione outros dados aqui se precisar para futuras conquistas (ex: tarefas diárias)
  }) => boolean;
  // Nova função para obter o progresso atual e o objetivo
  getProgress: (data: {
    totalCompletedChapters: number;
    completedStudies: Set<string>;
    streakCount: number;
    totalShares: number;
    totalJournalEntries: number;
    isPro: boolean;
  }) => { current: number; target: number; unit: string; };
}

// Array com todas as definições de conquistas
export const achievementDefinitions: AchievementDefinition[] = [
  {
    name: 'Iniciante Fiel',
    description: 'Conclua seu primeiro capítulo de estudo.',
    icon_name: 'Sparkles',
    checkCondition: (data) => data.totalCompletedChapters >= 1,
    getProgress: (data) => ({ current: data.totalCompletedChapters, target: 1, unit: 'capítulo' }),
  },
  {
    name: 'Leitor Dedicado',
    description: 'Conclua 5 capítulos de estudo.',
    icon_name: 'BookOpen',
    checkCondition: (data) => data.totalCompletedChapters >= 5,
    getProgress: (data) => ({ current: data.totalCompletedChapters, target: 5, unit: 'capítulos' }),
  },
  {
    name: 'Leitor Assíduo',
    description: 'Conclua 10 capítulos de estudo.',
    icon_name: 'GraduationCap',
    checkCondition: (data) => data.totalCompletedChapters >= 10,
    getProgress: (data) => ({ current: data.totalCompletedChapters, target: 10, unit: 'capítulos' }),
  },
  {
    name: 'Sábio Estudante',
    description: 'Conclua 50 capítulos de estudo.',
    icon_name: 'Crown',
    checkCondition: (data) => data.totalCompletedChapters >= 50,
    getProgress: (data) => ({ current: data.totalCompletedChapters, target: 50, unit: 'capítulos' }),
  },
  {
    name: 'Mestre da Palavra',
    description: 'Conclua 150 capítulos de estudo.',
    icon_name: 'Flame',
    checkCondition: (data) => data.totalCompletedChapters >= 150,
    getProgress: (data) => ({ current: data.totalCompletedChapters, target: 150, unit: 'capítulos' }),
  },
  {
    name: 'Primeiro Estudo',
    description: 'Conclua seu primeiro estudo completo.',
    icon_name: 'Award',
    checkCondition: (data) => data.completedStudies.size >= 1,
    getProgress: (data) => ({ current: data.completedStudies.size, target: 1, unit: 'estudo' }),
  },
  {
    name: 'Chama Acesa',
    description: 'Mantenha uma sequência de 7 dias de estudo.',
    icon_name: 'Flame',
    checkCondition: (data) => data.streakCount >= 7,
    getProgress: (data) => ({ current: data.streakCount, target: 7, unit: 'dias' }),
  },
  {
    name: 'Fogo Ardente',
    description: 'Mantenha uma sequência de 30 dias de estudo.',
    icon_name: 'TrendingUp',
    checkCondition: (data) => data.streakCount >= 30,
    getProgress: (data) => ({ current: data.streakCount, target: 30, unit: 'dias' }),
  },
  {
    name: 'Evangelista Digital',
    description: 'Compartilhe 5 conteúdos do aplicativo.',
    icon_name: 'Share2',
    checkCondition: (data) => data.totalShares >= 5,
    getProgress: (data) => ({ current: data.totalShares, target: 5, unit: 'compartilhamentos' }),
  },
  {
    name: 'Reflexão Profunda',
    description: 'Complete 10 entradas no Diário Espiritual.',
    icon_name: 'MessageSquare',
    checkCondition: (data) => data.totalJournalEntries >= 10,
    getProgress: (data) => ({ current: data.totalJournalEntries, target: 10, unit: 'entradas' }),
  },
  {
    name: 'Discípulo Pro',
    description: 'Assine o plano Raízes da Fé Pro.',
    icon_name: 'Crown',
    checkCondition: (data) => data.isPro === true,
    getProgress: (data) => ({ current: data.isPro ? 1 : 0, target: 1, unit: 'assinatura' }),
  },
];