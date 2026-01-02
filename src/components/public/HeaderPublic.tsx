import { Button } from "@/components/ui/button";

export default function HeaderPublic() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center space-x-2 font-bold text-xl hover:opacity-80 transition-opacity"
            aria-label="Rytmik - strona główna"
          >
            <span>🎹</span>
            <span>Rytmik</span>
          </a>

          {/* Navigation buttons */}
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" asChild className="font-medium">
              <a href="/login">Zaloguj się</a>
            </Button>
            <Button asChild className="font-medium">
              <a href="/register">Zarejestruj się</a>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
