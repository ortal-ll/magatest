# МагаТест

Сайт для подготовки к вступительным тестам в магистратуру.

## Направления

1. **Информационные технологии M094**
   - **Алгоритмы и структуры данных** — единый тест (все вопросы по алгоритмам)
   - **Базы данных (СУБД)** — отдельно

## Стек

- Статический фронтенд (HTML/CSS/JS)
- **Netlify** — хостинг + serverless Functions (`/api/*`)
- **Upstash Redis** — база результатов и рейтинга

## Возможности

- Перемешивание вопросов и вариантов ответов при каждом запуске
- Мгновенная проверка выбранного ответа
- Итоговый результат с разбором
- Сохранение результата в Redis (имя + балл)
- Рейтинг / недавние попытки
- Адаптивная вёрстка для телефона и компьютера

## Переменные окружения

В Netlify → Site settings → Environment variables:

| Variable | Описание |
|---|---|
| `UPSTASH_REDIS_REST_URL` | REST URL из консоли Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | REST TOKEN из консоли Upstash |
| `ADMIN_PASSWORD` | Пароль страницы `/admin.html` для выдачи кодов |

Локально скопируйте `.env.example` → `.env` (файл в `.gitignore`).

## Доступ по коду

Сайт закрыт одноразовым 6-значным PIN:

1. Откройте `/admin.html`, войдите с `ADMIN_PASSWORD`
2. Нажмите **Создать код** — код живёт **ровно 60 секунд**
3. На `/access.html` введите код — после ввода он **сгорает**
4. Сессия пишется в Upstash Redis и в `localStorage` браузера (повторный ввод не нужен)
5. Без сессии любой прямой URL (`index`, `subject`, `quiz`) возвращает на ввод кода

## API

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/health` | Проверка Netlify + Redis (`PING`) |
| GET | `/api/stats` | Счётчики попыток |
| GET | `/api/results?testId=&mode=top\|recent` | Рейтинг / недавние |
| POST | `/api/results` | Сохранить результат |
| POST | `/api/access` `{ action: "admin-login" \| "create-code" \| "redeem" \| "check" }` | Доступ / админ |
| GET | `/api/access?action=check` | Проверка сессии (`X-Access-Token`) |

## Запуск

```bash
# только статика (без API)
npm run serve

# Netlify Functions + Redis (нужен .env)
npm run dev
```

## Тесты

```bash
npm test
```

## Деплой на Netlify

1. Подключите репозиторий к Netlify
2. Publish directory: `.` (корень), Functions: `netlify/functions` (уже в `netlify.toml`)
3. Добавьте `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` и `ADMIN_PASSWORD`
4. Deploy

После деплоя: `/admin.html` → создать код → открыть сайт → ввести код на `/access.html`.

## Добавление вопросов

Данные тестов лежат в `data/*.json`. Формат вопроса:

```json
{
  "text": "Текст вопроса",
  "options": ["Вариант A", "Вариант B", "Вариант C"],
  "correct": 0,
  "explanation": "Пояснение (необязательно)"
}
```

`correct` — индекс правильного варианта (с нуля) **до** перемешивания.
