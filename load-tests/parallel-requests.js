const http = require('http');
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

console.log(`Loaded ${testData.length} test cases from CSV`);

// Функция для отправки одного запроса
function sendRequest(data) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const start = Date.now();
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const end = Date.now();
        const duration = end - start;
        resolve({
          statusCode: res.statusCode,
          duration,
          success: res.statusCode === 200,
          data: responseData.length > 0 ? JSON.parse(responseData) : null
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(requestData);
    req.end();
  });
}

// Основная функция для запуска параллельных запросов
async function runParallelLoad(concurrentRequests, totalRequests) {
  console.log(`Запуск ${totalRequests} запросов с параллелизмом ${concurrentRequests}`);
  
  const results = {
    totalRequests,
    successfulRequests: 0,
    failedRequests: 0,
    totalDuration: 0,
    minDuration: Infinity,
    maxDuration: 0,
    durations: [],
    statusCodes: {}
  };
  
  const startTime = Date.now();
  let completed = 0;
  
  // Функция для запуска батча запросов
  async function runBatch() {
    const batch = [];
    const batchSize = Math.min(concurrentRequests, totalRequests - completed);
    
    for (let i = 0; i < batchSize; i++) {
      // Случайный выбор тестовых данных
      const testCase = testData[Math.floor(Math.random() * testData.length)];
      batch.push(sendRequest(testCase));
    }
    
    try {
      const batchResults = await Promise.all(batch);
      
      batchResults.forEach(result => {
        results.durations.push(result.duration);
        results.totalDuration += result.duration;
        results.minDuration = Math.min(results.minDuration, result.duration);
        results.maxDuration = Math.max(results.maxDuration, result.duration);
        
        if (result.success) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
        }
        
        results.statusCodes[result.statusCode] = (results.statusCodes[result.statusCode] || 0) + 1;
      });
      
      completed += batchSize;
      
      // Прогресс
      const progress = Math.floor((completed / totalRequests) * 100);
      process.stdout.write(`\rПрогресс: ${progress}% (${completed}/${totalRequests})`);
      
      if (completed < totalRequests) {
        await runBatch();
      }
    } catch (error) {
      console.error('Ошибка при выполнении батча запросов:', error);
      results.failedRequests += batchSize;
      completed += batchSize;
      
      if (completed < totalRequests) {
        await runBatch();
      }
    }
  }
  
  await runBatch();
  
  const endTime = Date.now();
  const totalElapsedTime = endTime - startTime;
  
  // Сортировка длительностей для расчета процентилей
  results.durations.sort((a, b) => a - b);
  
  // Вычисление процентилей
  results.averageDuration = results.totalDuration / results.durations.length;
  results.medianDuration = results.durations[Math.floor(results.durations.length / 2)];
  results.p90 = results.durations[Math.floor(results.durations.length * 0.9)];
  results.p95 = results.durations[Math.floor(results.durations.length * 0.95)];
  results.p99 = results.durations[Math.floor(results.durations.length * 0.99)];
  
  // Расчет RPS (запросов в секунду)
  results.requestsPerSecond = completed / (totalElapsedTime / 1000);
  
  console.log('\n\nРезультаты нагрузочного тестирования:');
  console.log('========================================');
  console.log(`Всего запросов: ${totalRequests}`);
  console.log(`Успешных запросов: ${results.successfulRequests}`);
  console.log(`Неудачных запросов: ${results.failedRequests}`);
  console.log(`Общее время: ${totalElapsedTime}ms`);
  console.log(`Запросов в секунду: ${results.requestsPerSecond.toFixed(2)}`);
  console.log('\nВремя обработки запросов:');
  console.log(`Минимум: ${results.minDuration}ms`);
  console.log(`Среднее: ${results.averageDuration.toFixed(2)}ms`);
  console.log(`Медиана: ${results.medianDuration}ms`);
  console.log(`p90: ${results.p90}ms`);
  console.log(`p95: ${results.p95}ms`);
  console.log(`p99: ${results.p99}ms`);
  console.log(`Максимум: ${results.maxDuration}ms`);
  
  console.log('\nКоды статуса:');
  Object.keys(results.statusCodes).forEach(code => {
    console.log(`${code}: ${results.statusCodes[code]}`);
  });
  
  // Сохранение результатов в файл
  fs.writeFileSync(
    path.join(__dirname, `parallel-results-${Date.now()}.json`),
    JSON.stringify(results, null, 2)
  );
  console.log('\nРезультаты сохранены в файл JSON');
}

// Запуск теста с 50 параллельными запросами, всего 1000 запросов
const concurrentRequests = process.argv[2] ? parseInt(process.argv[2]) : 50;
const totalRequests = process.argv[3] ? parseInt(process.argv[3]) : 1000;

runParallelLoad(concurrentRequests, totalRequests)
  .catch(err => console.error('Ошибка при выполнении тестирования:', err)); 