<div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border transition-colors cursor-pointer",
              day.isCurrentDay
                ? "border-primary bg-primary/10 text-primary"
                : "bg-card text-card-foreground",
              day.hasDailyContent && !day.isCurrentDay && "bg-yellow-100 border-yellow-500 text-yellow-800", // Estilo para dias com conteúdo (não o dia atual)
              day.hasDailyContent && day.isCurrentDay && "bg-yellow-200 border-yellow-600 text-yellow-900" // Estilo para o dia atual com conteúdo
            )}
            onClick={() => onDayClick(day.date)}
          >
            {day.isCurrentDay ? (
              <Flame className="h-4 w-4 text-orange-500" />
            ) : (
              <span className="text-xs font-semibold">{day.dayOfMonth}</span>
            )}
          </div>