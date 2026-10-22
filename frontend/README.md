# Stock Alerts - frontend

Panel do zarządzania tabelą `stock_alerts` (React + Vite + Mantine + supabase-js).

## Konfiguracja Supabase (jednorazowo)

1. Uruchom `../supabase/migrations/20261021000000_stock_alerts_frontend.sql` w SQL Editor
   (RLS, walidacja progów, reset statusu po zmianie tickera/progów).
2. **Authentication -> Sign In / Providers**: wyłącz "Allow new users to sign up".
   Polityka RLS wpuszcza każdego zalogowanego użytkownika, więc rejestracja musi być zamknięta.
3. **Authentication -> Users -> Add user**: dodaj swoje konto (email).
4. **Authentication -> URL Configuration**: dodaj `http://localhost:5173` (i adres produkcyjny) do Redirect URLs.

## Uruchomienie

Zmienne środowiskowe są we wspólnym `../.env` (wzór: `../.env.example`) - uzupełnij `VITE_SUPABASE_URL` i `VITE_SUPABASE_PUBLISHABLE_KEY`.

```sh
npm install
npm run dev
```

Build produkcyjny: `npm run build` (wynik w `dist/`, do wrzucenia na dowolny statyczny hosting).
