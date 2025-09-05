import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WeekCalendar = () => {
  const weekStartsOn = 0; // 0 para Domingo
  const today = new Date();
  const startOfWeekDate = startOfWeek(today, { weekStartsOn });

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(startOfWeekDate, i);
    return {
      date,
      dayOfMonth: format(date, 'd'),
      dayInitial: format(date, 'EEEEE', { locale: ptBR }).toUpperCase(),
      isCurrentDay: isToday(date),
    };
  });

  return (
    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 items-center justify-items-center w-full">
      {weekDays.map((day, index) => (
        <div key={index} className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">{day.dayInitial}</span>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
              day.isCurrentDay
                ? "border-primary bg-primary/10 text-primary"
                : "bg-card text-card-foreground"
            )}
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