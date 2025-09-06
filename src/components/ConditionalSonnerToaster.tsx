"use client";

import React from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useSession } from '@/contexts/SessionContext';

export const ConditionalSonnerToaster = () => {
  const { enablePopups } = useSession();

  if (!enablePopups) {
    return null; // Não renderiza o toaster se os pop-ups estiverem desativados
  }

  return <Sonner />;
};