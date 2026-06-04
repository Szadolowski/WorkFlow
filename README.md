# WorkFlow

WorkFlow to webowy system do zarządzania pracownikami, zakładami, projektami, czasem pracy, dokumentami, certyfikatami, nieobecnościami oraz rozliczeniami kadrowo-płacowymi.

Projekt został przygotowany jako aplikacja full-stack działająca w środowisku Docker. System składa się z osobnego frontendu, backendu, bazy danych PostgreSQL, magazynu plików MinIO oraz reverse proxy Nginx.

---

## 1. Główne funkcje

- logowanie użytkowników z podziałem na role,
- zarządzanie pracownikami,
- zarządzanie zakładami / siedzibami,
- przypisywanie pracowników do projektów,
- obsługa czasu pracy z urządzeń RCP,
- zatwierdzanie czasu pracy,
- obsługa umów i stawek,
- generowanie danych do rozliczeń,
- zarządzanie certyfikatami, szkoleniami i badaniami,
- podgląd wygasających certyfikatów,
- zarządzanie nieobecnościami,
- prywatny obieg dokumentów,
- minimalny seed startowy do uruchomienia czystej instancji.

---

## 2. Stack technologiczny

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query

### Backend

- NestJS
- TypeScript
- JWT
- Prisma ORM
- Swagger / OpenAPI

### Baza danych i storage

- PostgreSQL
- Prisma
- MinIO

### DevOps

- Docker
- Docker Compose
- Nginx

---

## 3. Role użytkowników

System wykorzystuje RBAC, czyli kontrolę dostępu opartą o role.

Dostępne role:

- `ADMIN` — pełna administracja systemem,
- `HR` — obsługa pracowników, umów, certyfikatów, nieobecności i dokumentów,
- `FOREMAN` — brygadzista, obsługa projektów i pracowników zakładu w ograniczonym zakresie,
- `ACCOUNTING` — księgowość, rozliczenia i raporty płacowe,
- `WORKER` — pracownik,
- `OFFICE` — rola biurowa przewidziana w modelu systemu.

---

## 4. Struktura projektu

```text
WorkFlow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── seed-minimal.ts
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── Dockerfile
│   └── package.json
│
├── nginx/
│   └── default.conf
│
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## 5. Wymagania

Do uruchomienia projektu potrzebne są:

- Docker,
- Docker Compose,
- Git.

Opcjonalnie do lokalnego developmentu:

- Node.js 22+,
- npm,
- dostęp do PostgreSQL,
- dostęp do MinIO.

---

## 6. Konfiguracja środowiska

Skopiuj plik `.env.example` do `.env`:

```bash
cp .env.example .env
```

Następnie uzupełnij wartości w `.env`.

Przykładowa konfiguracja lokalna:

```env
# PostgreSQL
POSTGRES_DB=workflow
POSTGRES_USER=workflow
POSTGRES_PASSWORD=change_me_postgres_password
POSTGRES_PORT=5432

# Backend
BACKEND_PORT=2000
JWT_SECRET=change_me_super_secret_jwt_key
JWT_EXPIRES_IN=1d
DEVICE_INGESTION_TOKEN=change_me_device_token

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ACCESS_KEY=rootadmin
MINIO_SECRET_KEY=change_me_minio_password
MINIO_BUCKET_NAME=workflow-documents

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://backend:2000

# Nginx
NGINX_PORT=80

# Minimal seed
SEED_DEFAULT_PASSWORD=Admin123!

# Cookie
# false = lokalny Docker po HTTP
# true = środowisko z HTTPS
AUTH_COOKIE_SECURE=false
```

> Pliku `.env` nie wolno commitować do repozytorium. Do repozytorium trafia tylko `.env.example`.

---

## 7. Uruchomienie aplikacji w Dockerze

Z poziomu głównego katalogu projektu uruchom:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Po uruchomieniu sprawdź status kontenerów:

```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
```

Oczekiwany efekt:

```text
workflow-postgres   Up / healthy
workflow-minio      Up / healthy
workflow-backend    Up
workflow-frontend   Up
workflow-nginx      Up
```

---

## 8. Inicjalizacja bazy danych

Po pierwszym uruchomieniu kontenerów należy utworzyć strukturę bazy danych:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend npx prisma db push --config prisma.config.ts
```

Ta komenda synchronizuje bazę PostgreSQL ze schematem Prisma.

---

## 9. Minimalny seed startowy

Projekt posiada minimalny seed przeznaczony do czystej instancji systemu.

Uruchom:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend node dist/prisma/seed-minimal.js
```

Minimalny seed tworzy:

```text
Zakład:
- Biuro Główne

Konta:
- admin@workflow.pl
- hr@workflow.pl
- ksiegowa@workflow.pl
- brygadzista@workflow.pl
```

Domyślne hasło pochodzi ze zmiennej:

```env
SEED_DEFAULT_PASSWORD=Admin123!
```

Domyślnie:

```text
Admin123!
```

---

## 10. Dane logowania po minimalnym seedzie

```text
ADMIN:
email: admin@workflow.pl
hasło: Admin123!

HR:
email: hr@workflow.pl
hasło: Admin123!

KSIĘGOWOŚĆ:
email: ksiegowa@workflow.pl
hasło: Admin123!

BRYGADZISTA:
email: brygadzista@workflow.pl
hasło: Admin123!
```

Po pierwszym wdrożeniu hasła powinny zostać zmienione.

---

## 11. Adresy usług

Po uruchomieniu lokalnym:

```text
Aplikacja przez Nginx:
http://localhost

Frontend bezpośrednio:
http://localhost:3000

Backend bezpośrednio:
http://localhost:2000

Backend przez Nginx:
http://localhost/api

MinIO API:
http://localhost:9000

MinIO Console:
http://localhost:9001
```

---

## 12. Nginx

Nginx pełni rolę reverse proxy.

Routing:

```text
/       → frontend
/api/*  → backend
```

Dzięki temu użytkownik korzysta z jednego adresu:

```text
http://localhost
```

a zapytania API przechodzą przez:

```text
http://localhost/api
```

---

## 13. Przydatne komendy administracyjne

### Start całego środowiska

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Zatrzymanie kontenerów

```bash
docker compose -f docker-compose.prod.yml --env-file .env down
```

### Zatrzymanie i usunięcie wolumenów

Uwaga: ta komenda usuwa dane z bazy i MinIO.

```bash
docker compose -f docker-compose.prod.yml --env-file .env down -v
```

### Podgląd logów backendu

```bash
docker compose -f docker-compose.prod.yml --env-file .env logs -f backend
```

### Podgląd logów frontendu

```bash
docker compose -f docker-compose.prod.yml --env-file .env logs -f frontend
```

### Podgląd logów Nginx

```bash
docker compose -f docker-compose.prod.yml --env-file .env logs -f nginx
```

### Wejście do kontenera backendu

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend sh
```

### Ponowna synchronizacja bazy

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend npx prisma db push --config prisma.config.ts
```

### Ponowne uruchomienie minimalnego seeda

Uwaga: minimalny seed czyści dane i tworzy czysty zestaw startowy.

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend node dist/prisma/seed-minimal.js
```

---

## 14. Test API logowania

Przykład testu logowania przez Nginx:

```bash
curl -i -X POST "http://localhost/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@workflow.pl","password":"Admin123!"}'
```

Oczekiwany wynik:

```text
HTTP/1.1 201 Created
```

oraz odpowiedź zawierająca token JWT:

```json
{
  "access_token": "..."
}
```

---

## 15. Zalecenia bezpieczeństwa

Przed uruchomieniem w środowisku produkcyjnym należy:

- zmienić wszystkie domyślne hasła,
- ustawić silny `JWT_SECRET`,
- ustawić silny `DEVICE_INGESTION_TOKEN`,
- ustawić silne hasło PostgreSQL,
- ustawić silne hasło MinIO,
- nie commitować pliku `.env`,
- ograniczyć dostęp do aplikacji przez firewall lub sieć prywatną,
- w środowisku HTTPS ustawić:

```env
AUTH_COOKIE_SECURE=true
```

Dla lokalnego uruchomienia po HTTP:

```env
AUTH_COOKIE_SECURE=false
```

---

## 16. Uwagi developerskie

Projekt jest rozwijany w branchach zgodnych z Conventional Commits.

Przykłady:

```text
feat/employees-management
fix/auth-cookie-production
chore/docker-production-setup
docs/readme-docker-setup
```

Przed commitem warto sprawdzić:

```bash
git status
git diff
```

Do repozytorium nie powinny trafiać:

```text
.env
node_modules
.next
dist
pliki tymczasowe
```

---

## 17. Status projektu

Aktualnie projekt posiada działające środowisko Docker Compose z:

- frontendem Next.js,
- backendem NestJS,
- bazą PostgreSQL,
- MinIO,
- Nginx,
- minimalnym seedem startowym,
- podstawową obsługą ról użytkowników.

Kolejne etapy rozwoju:

- końcowe testy ról,
- dopracowanie README i dokumentacji,
- końcowa dokumentacja projektowa.

```

```
