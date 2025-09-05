"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DailyStudyCardProps {
  content: string | null;
  auxiliar_text: string | null; // Alterado para auxiliar_text
  tags: string[] | null;
  className?: string;
}

export const DailyStudyCard = ({ content, auxiliar_text, tags, className }: DailyStudyCardProps) => {
  if (!content && !auxiliar_text && (!tags || tags.length === 0)) return null;

  return (
    <Card className={cn("bg-gradient-to-br from-blue-100 to-blue-200 text-gray-800 shadow-lg", className)}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5" />
          Estudo Diário
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
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-white/50 text-gray-700 border-none">
                {tag.toUpperCase()}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};