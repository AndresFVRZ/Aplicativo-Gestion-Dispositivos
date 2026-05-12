const { Pool } = require('pg'); 
require('dotenv').config(); 
const pool = new Pool({ 
    user: 'postgres', 
    host: 'localhost', 
    database: 'anubis',
    password: '2026*', 
    port: 5432, 
}); 
module.exports = pool;