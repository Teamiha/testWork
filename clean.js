/**
 * Скрипт для очистки проекта и создания версии для production
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting cleanup process...');

// Список директорий и файлов для удаления
const toDelete = [
  'node_modules/aws-sdk',
  'node_modules/@opentelemetry',
  'node_modules/@azure',
];

// Список директорий и файлов для создания
const toCreate = [
  'dist',
  '.env'
];

// Проверяем размер проекта до очистки
console.log('Project size before cleanup:');
execSync('du -sh .', { stdio: 'inherit' });

// Удаляем ненужные директории
console.log('\nRemoving large dependencies...');
toDelete.forEach(item => {
  const itemPath = path.join(__dirname, item);
  if (fs.existsSync(itemPath)) {
    try {
      execSync(`rm -rf "${itemPath}"`, { stdio: 'inherit' });
      console.log(`✅ Removed ${item}`);
    } catch (error) {
      console.error(`❌ Failed to remove ${item}: ${error.message}`);
    }
  } else {
    console.log(`⚠️ ${item} does not exist, skipping`);
  }
});

// Проверяем размер node_modules
console.log('\nnode_modules size after cleanup:');
execSync('du -sh node_modules', { stdio: 'inherit' });

// Проверяем размер проекта после очистки
console.log('\nProject size after cleanup:');
execSync('du -sh .', { stdio: 'inherit' });

// Инструкции для production-билда
console.log('\n-----------------------------------------------------');
console.log('For a production build, run:');
console.log('npm run build:prod');
console.log('This will build the project and remove all dev dependencies.');
console.log('-----------------------------------------------------'); 