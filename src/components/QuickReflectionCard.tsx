"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react"; // Usando Lightbulb para reflexão
import { cn } from "@/lib/utils";

interface QuickReflectionCardProps {
  content: string | null;
  className?: string;
}

export const QuickReflectionCard = ({ content, className }: QuickReflectionCardProps) => {
  if (!content) return null;

  return (
    <Card className={cn("bg-gradient-to-br from-green-100 to-green-200 text-gray-800 shadow-lg", className)}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5" />
          Reflexão Rápida
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center items-center text-center py-2 px-4">
        <p className="text-lg font-serif italic line-clamp-2 leading-tight">
          "{content}"
        </p>
      </CardContent>
    </Card>
  );
};