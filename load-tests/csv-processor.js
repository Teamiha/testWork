// Функция для обработки данных из CSV и преобразования их в JSON
function processJsonData(userContext, events, done) {
  try {
    // Получаем строковые значения из CSV
    const itemsStr = userContext.vars.items;
    const lengthStr = userContext.vars.length;
    
    // Парсим строку JSON-массива в JavaScript-массив
    const parsedItems = JSON.parse(itemsStr);
    
    // Преобразуем строковое значение длины в число
    const parsedLength = parseInt(lengthStr, 10);
    
    // Сохраняем обработанные значения в контексте
    userContext.vars.parsedItems = parsedItems;
    userContext.vars.parsedLength = parsedLength;
    
    // Для отладки
    // console.log(`Processed: items=${JSON.stringify(parsedItems)}, length=${parsedLength}`);
    
    return done();
  } catch (error) {
    console.error('Error processing CSV data:', error);
    return done(error);
  }
}

module.exports = {
  processJsonData
}; 