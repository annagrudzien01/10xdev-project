import { AlertCircle } from "lucide-react";

export default function OrientationNotice() {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50" role="alert" aria-live="polite">
      <div className="bg-amber-50 dark:bg-amber-950 border-2 border-amber-500 dark:border-amber-600 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
              Najlepsze doświadczenie w orientacji poziomej
            </h3>
            <p className="text-amber-800 dark:text-amber-200 text-xs mt-1">
              Obróć urządzenie lub użyj ekranu o szerokości minimum 768px dla optymalnej rozgrywki.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
