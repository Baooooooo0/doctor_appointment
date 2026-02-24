const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
  console.log('DB_USER =', process.env.DB_USER);
  console.log('DB_NAME =', process.env.DB_NAME);
});
