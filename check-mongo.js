require('dotenv').config();
const uri = process.env.MONGODB_URI;
console.log('URI exists:', !!uri);
if (uri) {
  console.log('URI starts with:', uri.substring(0, 25) + '...');
  console.log('Full URI length:', uri.length);
} else {
  console.log('MONGODB_URI is MISSING from .env');
}
