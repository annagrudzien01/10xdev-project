export default function HeroSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Witaj w <span className="text-primary">Rytmik</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Gra edukacyjna dla dzieci, która rozwija umiejętność rozpoznawania i kontynuowania sekwencji dźwiękowych
            poprzez zabawę z wirtualnym pianinem.
          </p>

          {/* Piano illustration placeholder */}
          <div className="w-full max-w-md aspect-video bg-muted rounded-lg flex items-center justify-center">
            <span className="text-6xl" role="img" aria-label="Pianino">
              🎹
            </span>
          </div>

          {/* Additional info */}
          <div className="flex flex-col md:flex-row gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎵</span>
              <span>20 poziomów trudności</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👶</span>
              <span>Dla dzieci 3-18 lat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span>Monitorowanie postępów</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
