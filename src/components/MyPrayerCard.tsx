"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react"; // Usando Heart como alternativa para 'PrayingHands'
import { cn } from "@/lib/utils";

interface MyPrayerCardProps {
  content: string | null;
  className?: string;
}

export const MyPrayerCard = ({ content, className }: MyPrayerCardProps) => {
  if (!content) return null;

  return (
    <Card className={cn("bg-gradient-to-br from-purple-100 to-pink-200 text-gray-800 shadow-lg", className)}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5" /> {/* Usando Heart */}
          Oração do Dia
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