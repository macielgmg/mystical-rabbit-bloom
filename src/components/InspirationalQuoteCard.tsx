"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react"; // Usando Sparkles para citações inspiradoras
import { cn } from "@/lib/utils";

interface InspirationalQuoteCardProps {
  content: string | null;
  className?: string;
}

export const InspirationalQuoteCard = ({ content, className }: InspirationalQuoteCardProps) => {
  if (!content) return null;

  return (
    <Card className={cn("bg-gradient-to-br from-yellow-100 to-orange-200 text-gray-800 shadow-lg", className)}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" />
          Citação Inspiradora
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