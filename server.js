/**
  server.js
  10/29/2025
  Ayra Babar
  Kyle Revelo
  Khalil Velasco
*/

const express = require('express');   // express web framework
const path = require('path');         // safe path handling
const expressLayouts = require('express-ejs-layouts');
const dotenv = require('dotenv');

dotenv.config();

const pool = require('./db/pool');
const pageRoutes = require('./routes/pages');
const userRoutes = require('./routes/auth');
const apiRouter = require('./routes/api');
const aiRouter = require('./routes/generate');

const app = express();
const port = process.env.PORT || 3001;

// message banner
const message = 
  'CSC-317 node/express app \n' +
  'This uses nodeJS, express, and express.static\n' +
  'to "serve" the files in the ./public/ dir!\n';
console.log(message);

// ---------- VIEW ENGINE / LAYOUTS ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ---------- BODY PARSERS ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------- STATIC FILES ----------
const staticDirectory = path.join(__dirname, 'public');
app.use(express.static(staticDirectory));

// ---------- DB POOL AVAILABLE TO ROUTES ----------
app.set('pool', pool);

// ---------- ROUTES ----------

// auth routes: /signup, /login, etc.
app.use('/', userRoutes);

// page routes: /, /gallery, /contact, /profile, etc.
app.use('/', pageRoutes);

// JSON API routes: /api/...
app.use('/api', apiRouter);

// ChatGPT / OpenAI route: /api/generate
app.use('/api/generate', aiRouter);

// ---------- START SERVER ----------
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

