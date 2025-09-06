import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retorna a string da data local no formato 'YYYY-MM-DD'.
 * Garante que a data seja baseada no fuso horário local do usuário,
 * evitando problemas de deslocamento de data ao converter para UTC.
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mês é 0-indexado
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}