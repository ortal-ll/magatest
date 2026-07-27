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

Локально скопируйте `.env.example` → `.env` (файл в `.gitignore`).

## API

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/health` | Проверка Netlify + Redis (`PING`) |
| GET | `/api/stats` | Счётчики попыток |
| GET | `/api/results?testId=&mode=top\|recent` | Рейтинг / недавние |
| POST | `/api/results` | Сохранить результат |

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
3. Добавьте `UPSTASH_REDIS_REST_URL` и `UPSTASH_REDIS_REST_TOKEN`
4. Deploy

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
