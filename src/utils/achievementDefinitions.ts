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
}

// Array com todas as definições de conquistas
export const achievementDefinitions: AchievementDefinition[] = [
  {
    name: 'Iniciante Fiel',
    description: 'Conclua seu primeiro capítulo de estudo.',
    icon_name: 'Sparkles',
    checkCondition: (data) => data.totalCompletedChapters >= 1, // Alterado para >= 1
  },
  {
    name: 'Leitor Dedicado',
    description: 'Conclua 5 capítulos de estudo.',
    icon_name: 'BookOpen',
    checkCondition: (data) => data.totalCompletedChapters >= 5,
  },
  {
    name: 'Leitor Assíduo',
    description: 'Conclua 10 capítulos de estudo.',
    icon_name: 'GraduationCap',
    checkCondition: (data) => data.totalCompletedChapters >= 10,
  },
  {
    name: 'Sábio Estudante',
    description: 'Conclua 50 capítulos de estudo.',
    icon_name: 'Crown',
    checkCondition: (data) => data.totalCompletedChapters >= 50,
  },
  {
    name: 'Mestre da Palavra',
    description: 'Conclua 150 capítulos de estudo.',
    icon_name: 'Flame',
    checkCondition: (data) => data.totalCompletedChapters >= 150,
  },
  {
    name: 'Primeiro Estudo',
    description: 'Conclua seu primeiro estudo completo.',
    icon_name: 'Award',
    checkCondition: (data) => data.completedStudies.size >= 1,
  },
  {
    name: 'Chama Acesa',
    description: 'Mantenha uma sequência de 7 dias de estudo.',
    icon_name: 'Flame', // Usando o ícone Flame, como na imagem
    checkCondition: (data) => data.streakCount >= 7,
  },
  {
    name: 'Fogo Ardente',
    description: 'Mantenha uma sequência de 30 dias de estudo.',
    icon_name: 'TrendingUp', // Usando TrendingUp para indicar crescimento contínuo
    checkCondition: (data) => data.streakCount >= 30,
  },
  {
    name: 'Evangelista Digital',
    description: 'Compartilhe 5 conteúdos do aplicativo.',
    icon_name: 'Share2',
    checkCondition: (data) => data.totalShares >= 5,
  },
  {
    name: 'Reflexão Profunda',
    description: 'Complete 10 entradas no Diário Espiritual.',
    icon_name: 'MessageSquare',
    checkCondition: (data) => data.totalJournalEntries >= 10,
  },
  {
    name: 'Discípulo Pro',
    description: 'Assine o plano Raízes da Fé Pro.',
    icon_name: 'Crown',
    checkCondition: (data) => data.isPro === true,
  },
];