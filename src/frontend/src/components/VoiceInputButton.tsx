import { Mic, MicOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  label?: string;
}

export default function VoiceInputButton({
  isListening,
  isSupported,
  onStart,
  onStop,
  label,
}: VoiceInputButtonProps) {
  if (!isSupported) {
    return (
      <div className="fixed bottom-28 right-4 z-40 flex flex-col items-center gap-1.5">
        <div
          title="Voice input not supported in this browser"
          className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center shadow-xl opacity-50 cursor-not-allowed"
        >
          <MicOff className="w-7 h-7 text-gray-500 dark:text-gray-400" />
        </div>
        <span className="text-xs text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full shadow font-medium">
          {label ?? "Voice"}
        </span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-28 right-4 z-40 flex flex-col items-center gap-1.5">
      <div className="relative">
        {/* Pulsing ring when listening */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              key="pulse"
              className="absolute inset-0 rounded-full bg-red-400"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
              }}
            />
          )}
        </AnimatePresence>
        <button
          type="button"
          data-ocid="voice.mic.button"
          onClick={isListening ? onStop : onStart}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${
            isListening
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-700 hover:bg-green-800"
          }`}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
        >
          <Mic className="w-7 h-7 text-white" />
        </button>
      </div>
      <AnimatePresence mode="wait">
        {isListening ? (
          <motion.span
            key="listening"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-red-600 font-semibold bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full shadow"
          >
            Listening…
          </motion.span>
        ) : (
          <motion.span
            key="label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full shadow font-medium"
          >
            {label ?? "Voice"}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
