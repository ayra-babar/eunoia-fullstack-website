const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const path = require('path');
const multer = require('multer');

// configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads')); 
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `user-${req.userId}${ext}`);
  },
});

const upload = multer({ storage });

// when someone visits the homepage ('/'), render the 'index.ejs' file & send it with a title
router.get('/', (req, res) => {
  res.render('index', { title: 'home page | eunoia' });
});

// when someone visits the sign up / login page, render the 'login.ejs' file & send it with a title
router.get('/login', (req, res) => {
  res.render('login', { title: 'login & sign up page | eunoia' });
});

// when someone visits the chatGPT page, render the 'chat.ejs' file & send it with a title
router.get('/chat', (req, res) => {
  res.render('chat', { title: 'chatgpt | eunoia' });
});

// when someone visits the gallery page, render the 'gallery.ejs' file & send it with a title
router.get('/gallery', (req, res) => {
  res.render('gallery', { title: 'gallery page | eunoia' });
});

router.get('/contact', async (req, res) => {
  const pool = req.app.get('pool');

  try {
    const { rows } = await pool.query(
      `SELECT id, theme_preference
       FROM users
       WHERE id = $1`,
      [req.userId]
    );

    const user = rows[0] || {};

    res.render('contact', { 
      title: 'contact page | eunoia',
      user,
    });

  } catch (err) {
    console.error('error loading contact page theme:', err);
    res.status(500).send('server error');
  }
});

// 🔹 IMPORTANT: /profile is now just a normal render.
// The page loads, then your front-end JS uses the JWT (localStorage token)
// to call protected API routes.
router.get('/profile', (req, res) => {
  res.render('profile', { title: 'profile page | eunoia' });
});

router.post('/profile', requireAuth, async (req, res) => {
  const pool = req.app.get('pool');
  const userId = req.userId;

  const { firstName, lastName, username, email, bio } = req.body;

  try {
    await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name  = $2,
           username   = $3,
           email      = $4,
           bio        = $5,
           updated_at = NOW()
       WHERE id = $6`,
      [firstName, lastName, username, email, bio, userId]
    );

    // classic flow: go back to /profile after saving
    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send('error updating profile');
  }
});

router.post('/profile/theme', requireAuth, async (req, res) => {
  const pool = req.app.get('pool');
  const userId = req.userId;
  const { theme } = req.body;

  const allowed = ['light', 'dark'];
  const finalTheme = allowed.includes(theme) ? theme : 'light';

  try {
    await pool.query(
      `UPDATE users
       SET theme_preference = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [finalTheme, userId]
    );

    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating theme:', err);
    res.status(500).send('Error updating theme');
  }
});

// upload profile picture
router.post('/profile/picture', requireAuth, upload.single('profilePic'), async (req, res) => {
  const pool = req.app.get('pool');

  try {
    if (!req.file) {
      return res.redirect('/profile');
    }

    // this will be like: /uploads/user-3.png
    const imagePath = `/uploads/${req.file.filename}`;

    await pool.query(
      `UPDATE users
       SET profile_image_url = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [imagePath, req.userId]
    );

    res.redirect('/profile');
  } catch (err) {
    console.error('Error saving profile image:', err);
    res.status(500).send('Error saving profile image');
  }
});

module.exports = router;
