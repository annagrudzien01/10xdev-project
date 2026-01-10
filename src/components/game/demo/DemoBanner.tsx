/**
 * DemoBanner Component
 *
 * Sticky banner informujący o trybie demo z przyciskiem do rejestracji.
 */

export function DemoBanner() {
  const handleRegisterClick = () => {
    window.location.href = "/register";
  };

  return (
    <div
      className="sticky top-0 z-50 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 shadow-md"
      role="banner"
      aria-label="Informacja o trybie demo"
    >
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            ⚠️
          </span>
          <p className="text-sm sm:text-base font-semibold">
            <span className="font-bold">Tryb demo</span> - postępy nie są zapisywane
          </p>
        </div>

        <button
          onClick={handleRegisterClick}
          className="
            px-4 py-2 
            bg-white text-gray-900 
            rounded-lg font-semibold text-sm
            hover:bg-gray-100 
            focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
            transition-all duration-200
            shadow-md hover:shadow-lg
          "
          aria-label="Zarejestruj się aby zapisać postępy"
        >
          Zarejestruj się
        </button>
      </div>
    </div>
  );
}
