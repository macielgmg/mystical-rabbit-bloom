"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Loader2, Headphones } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { showError } from '@/utils/toast'; // Importar showError para feedback ao usuário

interface AudioPlayerProps {
  src: string;
  className?: string;
}

const LOADING_TIMEOUT_MS = 30000; // Aumentado para 30 segundos para dar mais tempo ao carregamento

export const AudioPlayer = ({ src, className }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Indica se está carregando metadados ou dados
  const [canPlay, setCanPlay] = useState(false); // Indica se o áudio pode ser reproduzido sem interrupções
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const resetPlayerState = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setCanPlay(false);
    setError(null);
    // Não resetar isExpanded aqui, pois é controlado pela interação do usuário
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    resetPlayerState(); // Resetar estado ao mudar a fonte do áudio

    const handleLoadedMetadata = () => {
      console.log('Audio: loadedmetadata');
      setDuration(audio.duration);
      // setIsLoading(false); // Não desativar isLoading aqui, esperar por canplaythrough
    };

    const handleCanPlay = () => {
      console.log('Audio: canplay');
      // O áudio pode começar a tocar, mas pode precisar de mais buffer
    };

    const handleCanPlayThrough = () => {
      console.log('Audio: canplaythrough - Audio is ready!');
      setIsLoading(false);
      setCanPlay(true);
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('Audio: error', audio.error, e);
      let errorMessage = "Não foi possível carregar o áudio.";
      if (audio.error) {
        switch (audio.error.code) {
          case audio.error.MEDIA_ERR_NETWORK:
            errorMessage = "Erro de rede ao carregar o áudio.";
            break;
          case audio.error.MEDIA_ERR_DECODE:
            errorMessage = "Erro de decodificação do áudio.";
            break;
          case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Formato de áudio não suportado.";
            break;
          case audio.error.MEDIA_ERR_ABORTED:
            errorMessage = "Carregamento de áudio abortado.";
            break;
          default:
            errorMessage = "Erro desconhecido ao carregar o áudio.";
        }
      }
      setError(errorMessage);
      setIsLoading(false);
      setCanPlay(false);
      showError(errorMessage);
    };
    const handleWaiting = () => {
      console.log('Audio: waiting');
      setIsLoading(true);
    };
    const handlePlaying = () => {
      console.log('Audio: playing');
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    // Timeout para o carregamento inicial
    const loadingTimeout = setTimeout(() => {
      if (isLoading && !canPlay) {
        console.warn('Audio: Loading timed out.');
        setError("O áudio demorou muito para carregar. Verifique sua conexão.");
        setIsLoading(false);
        setCanPlay(false);
        showError("O áudio demorou muito para carregar.");
      }
    }, LOADING_TIMEOUT_MS);

    return () => {
      clearTimeout(loadingTimeout);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [src, resetPlayerState, isLoading, canPlay]); // Adicionado isLoading e canPlay para o cleanup do timeout

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Pause audio when player collapses
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !isExpanded && isPlaying) {
      audio.pause();
    }
  }, [isExpanded, isPlaying]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        try {
          await audio.play();
        } catch (e: any) {
          console.error("Erro ao tentar reproduzir áudio:", e);
          setError("Erro ao reproduzir áudio. Pode ser necessário interagir com a página primeiro.");
          showError("Erro ao reproduzir áudio: " + e.message);
        }
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
    else setIsMuted(true);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (error) {
    return (
      <div className={cn("flex items-center justify-center p-3 rounded-lg bg-destructive/10 text-destructive text-sm", className)}>
        {error}
      </div>
    );
  }

  if (!src) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {!isExpanded ? (
        <Button 
          variant="outline" 
          onClick={() => setIsExpanded(true)} 
          className="w-full"
          disabled={isLoading || !canPlay} // Desabilitar se ainda estiver carregando ou não puder reproduzir
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Headphones className="h-4 w-4 mr-2" />}
          Ouvir Áudio
        </Button>
      ) : (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/50 border border-primary/20 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={togglePlayPause} 
              disabled={isLoading || !canPlay} // Desabilitar se ainda estiver carregando ou não puder reproduzir
              className="text-primary hover:bg-primary/10"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />)}
            </Button>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
                disabled={isLoading || !canPlay} // Desabilitar se ainda estiver carregando ou não puder reproduzir
              />
              <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute} 
              className="text-primary hover:bg-primary/10"
            >
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
      )}
    </div>
  );
};