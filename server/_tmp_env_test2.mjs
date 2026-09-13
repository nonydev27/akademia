import { config } from 'dotenv';
const result = config({ path: './.env' });
console.log('Parsed:', result.parsed ? Object.keys(result.parsed) : 'none');
console.log('Error:', result.error || 'none');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
