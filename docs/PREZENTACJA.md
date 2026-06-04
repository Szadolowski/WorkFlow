# Instrukcja prezentacji projektu WorkFlow

## 1. Przygotowanie środowiska

Przed prezentacją należy uruchomić aplikację w Dockerze:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Sprawdzenie statusu kontenerów:

```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
```

Wszystkie usługi powinny mieć status `Up`, a PostgreSQL i MinIO status `healthy`.

Jeżeli baza jest pusta lub trzeba odświeżyć dane demonstracyjne, należy uruchomić seed demo:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec -e ALLOW_DEMO_SEED=true backend npm run seed:demo
```

Aplikacja jest dostępna pod adresem:

```text
http://localhost
```

## 2. Konta demonstracyjne

Do prezentacji można użyć poniższych kont:

```text
ADMIN:
admin@workflow.pl
Admin123!

HR:
hr@workflow.pl
Admin123!

KSIĘGOWOŚĆ:
ksiegowa@workflow.pl
Admin123!

BRYGADZISTA:
brygadzista@workflow.pl
Admin123!
```

## 3. Proponowany przebieg prezentacji

### Krok 1 — Logowanie

Zalogować się jako administrator:

```text
admin@workflow.pl
Admin123!
```

Krótko powiedzieć:

> WorkFlow to system webowy do zarządzania pracownikami, zakładami, projektami, czasem pracy, certyfikatami, nieobecnościami, dokumentami i rozliczeniami.

### Krok 2 — Dashboard

Pokazać ekran główny po zalogowaniu.

Warto zwrócić uwagę na:

* podział danych według zakładów,
* szybki dostęp do głównych modułów,
* dane demonstracyjne wygenerowane przez seed.

### Krok 3 — Zakłady

Przejść do modułu zakładów.

Pokazać:

* listę zakładów,
* liczbę pracowników,
* liczbę projektów,
* powiązanie zakładu z pracownikami, projektami i czytnikami RCP.

Powiedzieć:

> System obsługuje wiele zakładów, dzięki czemu dane pracowników, projektów i czasu pracy można rozdzielać organizacyjnie.

### Krok 4 — Pracownicy

Przejść do listy pracowników.

Pokazać:

* wyszukiwanie i filtrowanie,
* status aktywny / nieaktywny,
* role pracowników,
* przypisanie do zakładu.

Następnie wejść w profil przykładowego pracownika.

W profilu pokazać:

* dane podstawowe,
* edycję danych,
* umowy,
* certyfikaty,
* dokumenty,
* nieobecności,
* przypisania do projektów.

### Krok 5 — Umowy

W profilu pracownika pokazać sekcję umów.

Powiedzieć:

> System pozwala przechowywać aktualne i historyczne umowy pracownika, wraz z typem umowy i stawką. Dane te są później wykorzystywane przy rozliczeniach.

Pokazać przykłady:

* UOP,
* UZ,
* B2B,
* aktualna umowa,
* historyczna umowa.

### Krok 6 — Certyfikaty i badania

Przejść do certyfikatów pracownika albo słownika certyfikatów.

Pokazać:

* BHP,
* badania lekarskie,
* UDT,
* SEP,
* datę wydania,
* datę ważności,
* certyfikaty wygasające.

Następnie przejść do widoku wygasających certyfikatów.

Powiedzieć:

> System pomaga kontrolować terminy ważności szkoleń, badań i uprawnień. Dzięki temu dział HR może wcześniej reagować na zbliżające się terminy wygaśnięcia.

### Krok 7 — Nieobecności

W profilu pracownika pokazać sekcję nieobecności.

Pokazać typy:

* urlop,
* L4,
* nieusprawiedliwiona,
* specjalna.

Powiedzieć:

> Moduł nieobecności pozwala rejestrować różne typy absencji oraz oznaczać, czy zostały zatwierdzone.

### Krok 8 — Projekty

Przejść do listy projektów.

Pokazać:

* projekty aktywne,
* projekt planowany,
* projekt zakończony,
* przypisania pracowników,
* powiązanie projektu z zakładem.

Powiedzieć:

> Projekty służą jako miejsce przypisania pracowników oraz źródło rozliczania czasu pracy.

### Krok 9 — Czas pracy / RCP

Przejść do modułu czasu pracy.

Pokazać:

* wpisy czasu pracy,
* godziny rozpoczęcia i zakończenia,
* liczbę przepracowanych godzin,
* status wpisu: PENDING lub APPROVED.

Powiedzieć:

> Czas pracy może być generowany na podstawie zdarzeń z czytników RCP. Zdarzenie wejścia IN i wyjścia OUT tworzy wpis czasu pracy, który później może zostać zatwierdzony.

Seed demo generuje już przykładowe wpisy czasu pracy, więc na prezentacji nie trzeba ręcznie uruchamiać symulatora.

### Krok 10 — Payroll / rozliczenia

Przejść do modułu rozliczeń.

Pokazać:

* dane rozliczeniowe,
* zatwierdzone wpisy czasu pracy,
* eksport payroll,
* powiązanie z pracownikiem i umową.

Powiedzieć:

> Moduł rozliczeń wykorzystuje zatwierdzone wpisy czasu pracy oraz dane umów, żeby przygotować dane do rozliczeń kadrowo-płacowych.

### Krok 11 — Role użytkowników

Wylogować się i zalogować jako inna rola, np. HR albo brygadzista.

Pokazać różnice w dostępie.

Przykład:

```text
hr@workflow.pl
Admin123!
```

albo:

```text
brygadzista@workflow.pl
Admin123!
```

Powiedzieć:

> System wykorzystuje role użytkowników. Administrator ma pełny dostęp, HR obsługuje dane kadrowe, księgowość rozliczenia, a brygadzista ma ograniczony dostęp do danych związanych z własnym zakładem.

## 4. Najważniejsze rzeczy do podkreślenia

Podczas prezentacji warto podkreślić:

* aplikacja działa jako pełny system full-stack,
* frontend i backend są oddzielone,
* baza danych działa na PostgreSQL,
* pliki są obsługiwane przez MinIO,
* ruch przechodzi przez Nginx,
* projekt można uruchomić jednym Docker Compose,
* dane demo można wygenerować jednym seedem,
* system ma podział na role,
* projekt obejmuje realne procesy kadrowe: pracownicy, umowy, certyfikaty, nieobecności, czas pracy i rozliczenia.

## 5. Krótki opis projektu do powiedzenia na początku

WorkFlow to aplikacja webowa wspierająca zarządzanie pracownikami i procesami kadrowymi w firmie. System pozwala obsługiwać zakłady, pracowników, projekty, umowy, certyfikaty, nieobecności, dokumenty oraz czas pracy rejestrowany przez czytniki RCP. Projekt działa w środowisku Docker i składa się z frontendu Next.js, backendu NestJS, bazy PostgreSQL, MinIO oraz Nginx jako reverse proxy.

## 6. Krótkie zakończenie prezentacji

Na koniec można powiedzieć:

> Projekt pokazuje kompletny przepływ danych w systemie kadrowo-czasowym: od utworzenia pracownika, przez przypisanie go do projektu, rejestrację czasu pracy, kontrolę certyfikatów i nieobecności, aż po przygotowanie danych do rozliczeń. Aplikacja jest gotowa do uruchomienia w Dockerze i może być dalej rozwijana o kolejne funkcje produkcyjne.
