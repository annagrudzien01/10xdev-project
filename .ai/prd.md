# Dokument wymagań produktu (PRD) - Rytmik

## 1. Przegląd produktu

Rytmik to web-owa gra edukacyjna dla dzieci, która rozwija umiejętność rozpoznawania i kontynuowania sekwencji dźwiękowych. MVP koncentruje się na jednooktawowym wirtualnym pianinku z zadaniami polegającymi na dokończeniu usłyszanej melodii. Aplikacja obsługuje dwa typy kont:

- Rodzic (Admin) – zakłada konto, tworzy profile dzieci, monitoruje postępy.
- Dziecko – loguje się poprzez wybór profilu, rozwiązuje zadania melodyczne.

Silnik gry losuje sekwencje spośród predefiniowanych sekwencji zgodnie z aktualnym poziomem gracza(20 poziomów trudności). Kluczowe technologie: Astro 5 + React 19, Tone.js (audio), Tailwind 4 (UI), Supabase (baza danych i auth).

## 2. Problem użytkownika

Dzieci mają trudności z przetwarzaniem wzorów rytmicznych; tradycyjne ćwiczenia są monotonne i wymagają ciągłego nadzoru dorosłego. Rytmik zapewnia angażujące i samodzielne ćwiczenia o rosnącym stopniu trudności, jednocześnie dając rodzicowi wgląd w postępy.

## 3. Wymagania funkcjonalne

1. Rejestracja i logowanie konta rodzica (e-mail + hasło).
2. CRUD profili dzieci (max. n profili na konto).
3. Wybór profilu dziecka po zalogowaniu rodzica.
4. Sekwencjie dźwięków są zapisane w bazie i każda ma 20 poziomów.
5. Odtworzenie zagadki audio + podświetlenie klawiszy.
6. Wirtualne pianinko (1 oktawa, monofoniczne, obsługa mysz/dotyk, kolory + litery).
7. Panel slotów pokazujący długość brakującej sekwencji.
8. Przycisk „Sprawdź” (aktywny po uzupełnieniu slotów) i „Wyczyść”.
9. Walidacja kolejności dźwięków, 3 próby na zadanie, punktacja 10/5/2/0.
10. Animacja sukcesu lub utraty szansy (pękające serduszka).
11. Awans na wyższy poziom po 5 poprawnych zadaniach; błąd nie obniża poziomu.
12. Zapis stanu gry w bazie: aktualny poziom, punkty, logi aktywności.
13. Dashboard rodzica: lista profili dzieci, poziom, punkty, data ostatniej gry.
14. Free play pianinka dostępne poza odtwarzaniem zagadki.
15. Bezpieczna sesja – token Supabase, wylogowanie.

## 4. Granice produktu

- Brak importu/eksportu plików (PDF, DOCX …)
- Brak rankingu użytkowników i interakcji między kontami.
- Brak aplikacji mobilnej; UI zoptymalizowane pod tablet/desktop (landscape).
- Brak możliwości ręcznego ustawiania poziomu przez rodzica.
- Brak onboardingu/tutoriala wizualnego w MVP.

## 5. Historyjki użytkowników

| ID     | Tytuł                     | Opis                                                                                    | Kryteria akceptacji                                                                                                                                  |
| ------ | ------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-001 | Rejestracja rodzica       | Jako rodzic chcę założyć konto za pomocą e-maila i hasła, aby móc korzystać z aplikacji | • Użytkownik podaje unikalny e-mail i hasło • Po poprawnej rejestracji widzi ekran logowania • Dane zapisywane w bazie                               |
| US-002 | Logowanie rodzica         | Jako rodzic chcę zalogować się na istniejące konto                                      | • Prawidłowy e-mail/hasło przekierowuje na ekran wyboru profilu • Błędne dane pokazują komunikat o błędzie • Sesja trwa min. 24 h lub do wylogowania |
| US-003 | Bezpieczne sesje          | Jako system chcę chronić dostęp do danych profili                                       | • Każde żądanie do API wymaga ważnego tokena • Wylogowanie usuwa token z LocalStorage/cookies                                                        |
| US-004 | Tworzenie profilu dziecka | Jako rodzic chcę dodać profil dziecka z imieniem i wiekiem                              | • Formularz imię+wiek • Profil pojawia się na liście • Można dodać min. 1 max. n profili                                                             |
| US-005 | Wybór profilu             | Jako rodzic chcę wybrać profil dziecka, aby rozpocząć grę                               | • Kliknięcie profilu otwiera ekran gry z poziomem tego dziecka                                                                                       |
| US-006 | Losowanie sekwencji       | Jako system chcę wylosować sekwencję zgodną z bieżącym poziomem                       | • Sekwencja ma odpowiednią długość, interwały i użycie czarnych klawiszy • Nowa sekwencja po każdej ukończonej lub nieudanej próbie                  |
| US-007 | Odtworzenie zagadki       | Jako dziecko chcę usłyszeć sekwencję i zobaczyć podświetlenie klawiszy                  | • Audio odtwarza się automatycznie • Klawisze podświetlają się synchronicznie                                                                        |
| US-008 | Wprowadzanie odpowiedzi   | Jako dziecko chcę kliknąć klawisze pianinka, aby wpisać brakujące dźwięki               | • Kliknięcie klawisza dodaje dźwięk do slotu • Sloty aktualizują stan                                                                                |
| US-009 | Czyszczenie odpowiedzi    | Jako dziecko chcę wyczyścić wpisane dźwięki przed sprawdzeniem                          | • Przycisk „Wyczyść” usuwa wszystkie sloty • Dźwięki nie są wysyłane do walidatora                                                                   |
| US-010 | Sprawdzenie odpowiedzi    | Jako dziecko chcę sprawdzić sekwencję, aby wiedzieć czy jest poprawna                   | • Przycisk „Sprawdź” aktywny gdy sloty pełne • Poprawna sekwencja → animacja sukcesu + punkty • Błędna sekwencja → odejmuje szansę, animacja błędu   |
| US-011 | Szanse i punktacja        | Jako system chcę liczyć próby i punkty                                                  | • 3 szanse na zadanie • Punktacja 10/5/2/0 zgodnie z próbą • Po 3 błędach pokazanie rozwiązania                                                      |
| US-012 | Awans poziomu             | Jako system chcę awansować dziecko po 5 poprawnych zadaniach                            | • Po 5 sukcesach poziom+1 (max 20) • Błąd nie zmniejsza poziomu                                                                                      |
| US-013 | Dashboard postępów        | Jako rodzic chcę widzieć poziom i punkty dziecka                                        | • Lista profili pokazuje poziom, sumę punktów, datę ostatniej gry                                                                                    |
| US-014 | Free play                 | Jako dziecko chcę grać dowolne dźwięki poza zagadką                                     | • W trybie free play klawisze grają dźwięk, brak slotów • Free play blokowany podczas odtwarzania zagadki                                            |

## 6. Metryki sukcesu

1. Retencja 7-dniowa (R7) ≥ 50 % dla aktywnych kont dziecka (liczona z tabeli logins w bazie).
2. Liczba ukończonych zadań na sesję – średnia ≥ 10.
3. Średni czas spędzony w aplikacji > 5 minut.
4. Brak krytycznych błędów (rate ≤ 1 % sesji) w logach aplikacji.
