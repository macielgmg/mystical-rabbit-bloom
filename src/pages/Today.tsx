const handleDayClick = (date: Date) => {
          const formattedDate = format(date, 'yyyy-MM-dd');
          if (datesWithDailyContent.has(formattedDate)) { // Verifica se tem conteúdo antes de abrir
            setSelectedDateForSummary(date);
          } else {
            showError("Nenhum conteúdo diário disponível para esta data."); // Mensagem se não tiver conteúdo
          }
        };