const fs = require('fs');

console.log('í³‹ PROJECT COMPLETION CHECKLIST\n');

const checks = {
  'Server runs': fs.existsSync('server.js'),
  'Package.json': fs.existsSync('package.json'),
  'Environment config': fs.existsSync('.env') || fs.existsSync('.env.example'),
  'Database models': fs.existsSync('models/index.js'),
  'Controllers': fs.readdirSync('controllers').length >= 6,
  'Services': fs.readdirSync('services').length >= 6,
  'Routes': fs.readdirSync('routes').length >= 6,
  'Middleware': fs.readdirSync('middleware').length >= 3,
  'Migrations': fs.existsSync('migrations'),
  'Seeders': fs.existsSync('seeders'),
  'CORS configured': fs.readFileSync('server.js', 'utf8').includes('cors'),
};

Object.entries(checks).forEach(([item, exists]) => {
  console.log(`${exists ? 'âœ…' : 'âŒ'} ${item}`);
});

console.log(`\ní³Š Completion: ${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length} items`);
