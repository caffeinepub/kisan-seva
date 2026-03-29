import { useCallback, useEffect, useRef, useState } from "react";

const getSpeechRecognition = (): (new () => any) | null => {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
};

export interface UseVoiceInputReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  startListening: (lang?: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const SpeechRecognition = getSpeechRecognition();
  const isSupported = SpeechRecognition !== null;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (lang = "hi-IN") => {
      if (!SpeechRecognition) return;
      stopListening();

      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          setTranscript(result[0].transcript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    },
    [SpeechRecognition, stopListening],
  );

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  };
}
