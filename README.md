# IRB Family · пилотный отчёт HR-Rocket

Интерактивный одностраничный отчёт о первой неделе пилота лидогенерации для **IRB Family**.

## Стек

- TanStack Start + React 19 + Vite 8
- Tailwind CSS 4 + Recharts
- Nitro (`node-server`) для production

## Локальная разработка

```bash
npm install
npm run dev
```

Откройте http://localhost:8080/

## Production-сборка

```bash
npm run build
npm start
```

Сервер слушает `PORT` (по умолчанию 3000).

## Деплой на Railway

1. Создайте проект в [Railway](https://railway.app/) → **Deploy from GitHub**
2. Подключите репозиторий `Seventil1/irb_family`
3. Railway подхватит `railway.toml`:
   - **Install:** `npm ci` (Nixpacks)
   - **Build:** `npm run build`
   - **Start:** `npm start` → `node .output/server/index.mjs`
4. В **Settings → Networking** нажмите **Generate Domain**
5. (Опционально) переменные окружения — см. таблицу ниже

### Авторизация

Отчёт закрыт логином. По умолчанию:

- **Логин:** `admin`
- **Пароль:** `123123qw`

Страница входа: `/login`. После успешного входа выставляется HttpOnly-cookie на 7 дней.

### Переменные Railway

| Переменная | Назначение |
|---|---|
| `PORT` | Порт (Railway задаёт автоматически) |
| `NODE_ENV` | `production` |
| `AUTH_USER` | Логин (по умолчанию `admin`) |
| `AUTH_PASS` | Пароль (по умолчанию `123123qw`) |
| `SESSION_SECRET` | Секрет для подписи cookie-сессии |

## Структура

```
├── public/              # логотипы (HR-Rocket mark, IRB Family)
├── src/
│   ├── routes/index.tsx # лендинг-отчёт
│   ├── lib/pilot-data.ts# данные пилота
│   └── components/report/# UI-компоненты HR-Rocket
├── railway.toml         # конфиг Railway
└── vite.config.ts       # Nitro preset: node-server
```
