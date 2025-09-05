import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeekCalendarProps {
  datesWithDailyContent: Set<string>; // Novo prop: um conjunto de datas (YYYY-MM-DD) que têm conteúdo
  onDayClick: (date: Date) => void; // Novo prop: função para lidar com o clique em um dia
}

const WeekCalendar = ({ datesWithDailyContent, onDayClick }: WeekCalendarProps) => {
  const weekStartsOn = 0; // 0 para Domingo
  const today = new Date();
  const startOfWeekDate = startOfWeek(today, { weekStartsOn });

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(startOfWeekDate, i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    return {
      date,
      dayOfMonth: format(date, 'd'),
      dayInitial: format(date, 'EEEEE', { locale: ptBR }).toUpperCase(),
      isCurrentDay: isToday(date),
      hasDailyContent: datesWithDailyContent.has(formattedDate), // Verifica se a data tem conteúdo
    };
  });

  return (
    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 items-center justify-items-center w-full">
      {weekDays.map((day, index) => (
        <div key={index} className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">{day.dayInitial}</span>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border transition-colors cursor-pointer", // Adicionado cursor-pointer
              day.isCurrentDay
                ? "border-primary bg-primary/10 text-primary"
                : "bg-card text-card-foreground",
              day.hasDailyContent && !day.isCurrentDay && "bg-yellow-100 border-yellow-500 text-yellow-800", // Estilo para dias com conteúdo (não o dia atual)
              day.hasDailyContent && day.isCurrentDay && "bg-yellow-200 border-yellow-600 text-yellow-900" // Estilo para o dia atual com conteúdo
            )}
            onClick={() => onDayClick(day.date)} // Adicionado onClick
          >
            {day.isCurrentDay ? (
              <Flame className="h-4 w-4 text-orange-500" />
            ) : (
              <span className="text-xs font-semibold">{day.dayOfMonth}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeekCalendar;