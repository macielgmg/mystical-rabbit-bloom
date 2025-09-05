"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickReflectionCardProps {
  content: string | null;
  auxiliar_text: string | null; // Alterado para auxiliar_text
  className?: string;
}

export const QuickReflectionCard = ({ content, auxiliar_text, className }: QuickReflectionCardProps) => {
  if (!content && !auxiliar_text) return null;

  return (
    <Card className={cn("bg-gradient-to-br from-green-100 to-green-200 text-gray-800 shadow-lg", className)}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5" />
          Reflexão Rápida
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center items-center text-center py-2 px-4">
        {content && (
          <p className="text-lg font-serif italic line-clamp-2 leading-tight">
            "{content}"
          </p>
        )}
        {auxiliar_text && !content && ( // Exibe auxiliar_text se não houver content
          <p className="text-lg font-serif italic line-clamp-2 leading-tight">
            "{auxiliar_text}"
          </p>
        )}
      </CardContent>
    </Card>
  );
};