import { Tractor } from "lucide-react";
import { useEffect } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-700 to-green-900 gap-6">
      <div className="flex items-center justify-center w-28 h-28 bg-white/20 rounded-full shadow-2xl ring-4 ring-white/30">
        <div className="flex items-center justify-center w-20 h-20 bg-green-700 rounded-full shadow-lg">
          <Tractor className="w-12 h-12 text-white" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold text-white tracking-wide">
          Kisan Seva
        </h1>
        <p className="text-white/80 text-lg text-center px-8">
          ટ્રૅક્ટર બિઝનેસ મૅનેજમૅન્ટ
        </p>
      </div>
      <div className="mt-8 flex gap-2">
        <div
          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
