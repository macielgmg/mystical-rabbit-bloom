// src/utils/dailyTasksSequence.ts

export const dailyTaskSequence = [
  { name: 'spiritual_journal', path: '/today/spiritual-journal' },
  { name: 'daily_study', path: '/today/daily-study' },
  { name: 'quick_reflection', path: '/today/quick-reflection' },
  { name: 'inspirational_quotes', path: '/today/inspirational-quote' },
  { name: 'my_prayer', path: '/today/my-prayer' },
];

interface TaskCompletionStatus {
  isJournalCompleted: boolean;
  isDailyStudyTaskCompleted: boolean;
  isQuickReflectionTaskCompleted: boolean;
  isInspirationalQuoteTaskCompleted: boolean;
  isMyPrayerTaskCompleted: boolean;
  isVerseOfTheDayTaskCompleted: boolean; // Adicionado aqui
}

export const getNextIncompleteTaskPath = (
  currentTaskName: string,
  completionStatus: TaskCompletionStatus
): string | null => {
  const currentTaskIndex = dailyTaskSequence.findIndex(task => task.name === currentTaskName);

  for (let i = currentTaskIndex + 1; i < dailyTaskSequence.length; i++) {
    const nextTask = dailyTaskSequence[i];
    const isNextTaskCompleted = completionStatus[`is${nextTask.name.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Completed` as keyof TaskCompletionStatus];
    
    if (!isNextTaskCompleted) {
      return nextTask.path;
    }
  }
  return null; // Todas as tarefas seguintes estão completas
};

export const isLastTaskInSequenceAndAllCompleted = (
  currentTaskName: string,
  completionStatus: TaskCompletionStatus
): boolean => {
  const currentTaskIndex = dailyTaskSequence.findIndex(task => task.name === currentTaskName);
  
  // Verifica se todas as tarefas da sequência (incluindo a atual) estão completas
  const allTasksCompleted = dailyTaskSequence.every(task => {
    const taskCompleted = completionStatus[`is${task.name.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Completed` as keyof TaskCompletionStatus];
    return taskCompleted || task.name === currentTaskName; // Considera a tarefa atual como "completa" para esta verificação
  });

  // Se a tarefa atual é a última na sequência E todas as tarefas estão completas
  return currentTaskIndex === dailyTaskSequence.length - 1 && allTasksCompleted;
};

export const isFirstTaskInSequence = (currentTaskName: string): boolean => {
  return dailyTaskSequence[0].name === currentTaskName;
};

export const getPreviousTaskPath = (currentTaskName: string): string | null => {
  const currentTaskIndex = dailyTaskSequence.findIndex(task => task.name === currentTaskName);
  if (currentTaskIndex > 0) {
    return dailyTaskSequence[currentTaskIndex - 1].path;
  }
  return null; // Não há tarefa anterior
};

// Helper para obter a chave do status de conclusão
export const getCompletionStatusKey = (taskName: string) => {
  return `is${taskName.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Completed`;
};