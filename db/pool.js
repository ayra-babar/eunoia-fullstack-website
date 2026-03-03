// loads dotenv library & immediately reads .env file, putting values into 
// process.env so code (e.g., process.env.DATABASE_URL) works
require('dotenv').config();

// import the postgres client library & grabs the Pool class for making reusable DB connection pool
const { Pool } = require('pg');

// create reusable Postgres connection pool using env config
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
