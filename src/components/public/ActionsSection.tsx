import { Button } from "@/components/ui/button";

export default function ActionsSection() {
  return (
    <section className="py-12 border-t bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-6">
          {/* Main heading */}
          <h2 className="text-2xl md:text-3xl font-bold text-center">Zacznij swoją muzyczną przygodę</h2>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
            <Button asChild size="lg" className="flex-1 text-base font-semibold">
              <a href="/login">Zaloguj się</a>
            </Button>

            <Button asChild variant="outline" size="lg" className="flex-1 text-base font-semibold">
              <a href="/register">Zarejestruj się</a>
            </Button>

            <Button asChild variant="ghost" size="lg" className="flex-1 text-base font-semibold">
              <a href="/demo">Wypróbuj demo</a>
            </Button>
          </div>

          {/* Additional info */}
          <p className="text-sm text-muted-foreground text-center">
            Demo nie wymaga rejestracji • Pełna wersja pozwala zapisywać postępy
          </p>
        </div>
      </div>
    </section>
  );
}
