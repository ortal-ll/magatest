#!/usr/bin/env node
/**
 * Merge all algorithm question banks into one, keep databases separate.
 * Adds new questions from screenshots (correct answers by knowledge).
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

function load(name) {
  return JSON.parse(readFileSync(join(dataDir, name), 'utf8'));
}

function normalizeText(t) {
  return String(t)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[«»""]/g, '"')
    .trim();
}

function stripLetter(opts) {
  return opts.map((o) => o.replace(/^[A-E]\)\s*/, ''));
}

function q(text, options, correctLetter, explanation = null) {
  const letters = 'ABCDE';
  const correct = letters.indexOf(correctLetter.toUpperCase());
  if (correct < 0 || correct >= options.length) {
    throw new Error(`Bad correct ${correctLetter} for ${text.slice(0, 50)}`);
  }
  const item = { text, options: stripLetter(options), correct };
  if (explanation) item.explanation = explanation;
  return item;
}

/** New questions from screenshots — correct answers determined by knowledge */
const fromScreenshots = [
  q(
    'Выполнение каждой программы на С++ начинается с использования функции',
    ['A) begin', 'B) first', 'C) init', 'D) start', 'E) main'],
    'E',
    'Точка входа любой программы на C++ — функция main.'
  ),
  q(
    'Объявлена переменная:\nunsigned int a=-5;\nЗначение переменной a',
    [
      'A) компилятор переведет число в очень большое положительное число',
      'B) данное присваивание недопустимо',
      'C) 5',
      'D) 0',
      'E) -5',
    ],
    'A',
    'Отрицательное значение, присвоенное unsigned int, преобразуется по правилам модульной арифметики в большое положительное число (дополнение до двух).'
  ),
  q(
    'Следующая директива отказывается от символических констант и макросов',
    ['A) #include', 'B) #define', 'C) ifdef', 'D) #undef', 'E) #file'],
    'D',
    '#undef снимает определение ранее заданного макроса или символической константы.'
  ),
  q(
    'Результат операции:\ndouble x=2, y=1.5, z=0;\nz=2pow(x, 3)+y;\ncout<<z<<endl;',
    [
      'A) 3.5',
      'B) ошибка, пропущен знак умножения',
      'C) 0',
      'D) 17.5',
      'E) 1.5',
    ],
    'B',
    'В C++ нельзя писать 2pow(...): нужен явный оператор умножения — 2 * pow(x, 3).'
  ),
  q(
    'Результат операции:\nint a=0, b=1, c=2, d=3, e=4;\na=(b++, c++, d++, e++);\ncout<<"a="<<a<<endl;',
    ['A) 1', 'B) 10', 'C) 4', 'D) 2', 'E) 5'],
    'C',
    'Оператор «запятая» возвращает значение последнего выражения. e++ даёт 4 (постфикс), поэтому a=4.'
  ),
  q(
    'Дан массив:\nint a[10] = {6, 5, 4, 3, 2};\nВсе значения в ячейках массива a',
    [
      'A) 6 5 4 3 2',
      'B) 6 5 4 3 2 6 5 4 3 2',
      'C) 6 5 4 3 2 2 3 4 5 6',
      'D) 0 0 0 0 0 0 0 0 0 0',
      'E) 6 5 4 3 2 0 0 0 0 0',
    ],
    'E',
    'При частичной инициализации остальные элементы массива в C/C++ заполняются нулями.'
  ),
  q(
    'В результате выполнения оператора product /= ++x; при начальных значениях всех переменных равных 5, переменные примут значения',
    [
      'A) product = 0, x = 6',
      'B) product = 25, x = 5',
      'C) product = 31, x = 5',
      'D) product = 0, x = 5',
      'E) product = 30, x = 5',
    ],
    'A',
    'Сначала ++x → x=6, затем product = 5 / 6 (целочисленное деление) → 0.'
  ),
  q(
    'Результат операции:\nfor(int i=0;i<3;++i){\n  for(int j=0;j<i+1;++j)\n    cout<<"*";\n  cout<<endl;\n}',
    ['A) ошибка', 'B) *\n**\n***', 'C) ******'],
    'B',
    'Внешний цикл i=0..2; внутренний печатает i+1 звёздочек — получается треугольник.'
  ),
];

const screenshots = load('algorithms-screenshots.json');
const test1 = load('algorithms-test1.json');
const databases = load('databases-test1.json');

const merged = [];
const seen = new Set();

function addAll(list, source) {
  let added = 0;
  for (const item of list) {
    const key = normalizeText(item.text);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    added += 1;
  }
  console.log(`${source}: +${added} (skipped dups)`);
}

addAll(screenshots.questions, 'algorithms-screenshots');
addAll(test1.questions, 'algorithms-test1');
addAll(fromScreenshots, 'new-screenshots');

const algorithms = {
  id: 'algorithms',
  title: 'Алгоритмы и структуры данных',
  subject: 'm094',
  subjectTitle: 'Информационные технологии M094',
  topic: 'Алгоритмы и структуры данных',
  questions: merged,
};

writeFileSync(
  join(dataDir, 'algorithms.json'),
  JSON.stringify(algorithms, null, 2),
  'utf8'
);
console.log(`Wrote algorithms.json (${algorithms.questions.length} questions)`);

// Keep databases as-is, ensure id/title are clear
databases.id = 'databases';
databases.title = 'Базы данных (СУБД)';
databases.topic = 'Базы данных';
writeFileSync(
  join(dataDir, 'databases.json'),
  JSON.stringify(databases, null, 2),
  'utf8'
);
console.log(`Wrote databases.json (${databases.questions.length} questions)`);

const catalog = {
  brand: 'МагаТест',
  subjects: [
    {
      id: 'm094',
      title: 'Информационные технологии M094',
      short: 'M094',
      description:
        'Подготовка к вступительным тестам в магистратуру по направлению «Информационные технологии».',
      tests: [
        {
          id: algorithms.id,
          title: algorithms.title,
          topic: algorithms.topic,
          count: algorithms.questions.length,
          file: 'algorithms.json',
        },
        {
          id: databases.id,
          title: databases.title,
          topic: databases.topic,
          count: databases.questions.length,
          file: 'databases.json',
        },
      ],
    },
  ],
};

writeFileSync(join(dataDir, 'catalog.json'), JSON.stringify(catalog, null, 2), 'utf8');
console.log('Wrote catalog.json');

// Remove old split algorithm banks and old db filename
for (const old of [
  'algorithms-screenshots.json',
  'algorithms-test1.json',
  'databases-test1.json',
]) {
  const p = join(dataDir, old);
  if (existsSync(p)) {
    unlinkSync(p);
    console.log(`Removed ${old}`);
  }
}
