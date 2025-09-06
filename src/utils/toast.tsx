import { toast } from "sonner";
import { AchievementToast } from '@/components/AchievementToast';
import { StudyAcquiredToast } from '@/components/StudyAcquiredToast'; // Importar o novo toast

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

interface Achievement {
  id: string; // Adicionado ID
  name: string;
  description: string;
}

export const showAchievementToast = (achievement: Achievement) => {
  toast.custom(() => (
    <AchievementToast id={achievement.id} name={achievement.name} description={achievement.description} />
  ), { duration: 5000 });
};

interface StudyAcquired {
  title: string;
  studyId: string; // Adicionado studyId
}

export const showStudyAcquiredToast = (study: StudyAcquired) => {
  toast.custom(() => (
    <StudyAcquiredToast title={study.title} studyId={study.studyId} />
  ), { duration: 5000 });
};