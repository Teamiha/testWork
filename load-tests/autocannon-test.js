const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Загрузить тестовые данные из CSV
const csvData = fs.readFileSync(path.join(__dirname, 'test-data.csv'), 'utf8');
const rows = csvData.trim().split('\n').slice(1); // Пропускаем заголовок

// Обрабатываем данные из CSV, учитывая кавычки
const testData = rows.map(row => {
  // Используем регулярное выражение для корректного разбора CSV с кавычками
  const match = row.match(/"(\[.*?\])"\s*,\s*(\d+)/);
  
  if (match) {
    const [, itemsStr, lengthStr] = match;
    return {
      items: JSON.parse(itemsStr),
      length: parseInt(lengthStr, 10)
    };
  } else {
    console.error('Failed to parse row:', row);
    return null;
  }
}).filter(Boolean); // Удаляем null значения

// Функция для случайного выбора элемента из массива
const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];

console.log(`Loaded ${testData.length} test cases`);

// Настройка теста
const instance = autocannon({
  url: 'http://localhost:3000',
  connections: 100, // Количество одновременных соединений
  pipelining: 1,    // Количество запросов по одному соединению
  duration: 30,     // Продолжительность теста в секундах
  
  requests: [
    {
      method: 'POST',
      path: '/generate',
      setupRequest: (req) => {
        // Выбираем случайный тестовый пример при каждом запросе
        const testCase = randomItem(testData);
        req.body = JSON.stringify(testCase);
        req.headers['content-type'] = 'application/json';
        return req;
      }
    },
    {
      method: 'GET',
      path: '/health',
      weight: 3 // Вес запроса (соотношение к другим запросам)
    }
  ]
}, finishedBench);

// Создаем файл для записи результатов
const outputStream = fs.createWriteStream(`./${Date.now()}-results.json`);
autocannon.track(instance, { outputStream });

// Выводим прогресс в консоль
process.stdout.write('Запуск нагрузочного тестирования');
instance.on('tick', () => process.stdout.write('.'));

// Обработка завершения тестирования
function finishedBench(err, res) {
  if (err) {
    console.error('Ошибка:', err);
  }
  
  console.log('\n\nРезультаты нагрузочного тестирования:');
  console.log('Запросов в секунду:', res.requests.average);
  console.log('Задержка (среднее):', res.latency.average, 'мс');
  console.log('Задержка (максимум):', res.latency.max, 'мс');
  console.log('Задержка (процентили):');
  console.log('  p50:', res.latency.p50, 'мс');
  console.log('  p90:', res.latency.p90, 'мс');
  console.log('  p99:', res.latency.p99, 'мс');
  
  console.log('\nОшибки:', res.errors);
  console.log('\nПодробные результаты сохранены в файл JSON');
} 