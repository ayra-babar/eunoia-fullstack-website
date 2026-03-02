/**
  routes/api.js
  11/18/2025
  Ayra Babar
  Kyle Revelo
  Khalil Velasco
*/

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const { createEntry, listEntries, deleteEntry, editEntry } = require('../db/entryModel');
const { deleteUser } = require('../db/userModel');
const requireAuth = require('../middleware/requireAuth');


/* ---------- Multer config for profile pictures ---------- */

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

/* ---------- ACCOUNT DELETE ---------- */

/**
 * DELETE /api/account
 * deletes the currently authenticated user
 */
router.delete('/account', requireAuth, async (req, res) => {
  const pool = req.app.get('pool');

  try {
    const deletedCount = await deleteUser(pool, req.userId);
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'user not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('error in DELETE /api/account:', err);
    res.status(500).json({ message: 'error deleting user' });
  }
});

/* ---------- PROFILE: GET CURRENT USER ---------- */

/**
 * GET /api/me
 * returns the currently authenticated user's info
 */
router.get('/me', requireAuth, async (req, res) => {
  const pool = req.app.get('pool');

  try {
    const { rows } = await pool.query(
      `SELECT id,
              first_name,
              last_name,
              username,
              email,
              bio,
              profile_image_url,
              theme_preference
       FROM users
       WHERE id = $1`,
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'user not found' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('error in GET /api/me:', err);
    res.status(500).json({ message: 'error loading profile' });
  }
});

/* ---------- PROFILE: UPDATE TEXT FIELDS ---------- */

/**
 * PUT /api/profile
 * updates the authenticated user's profile fields
 */
router.put('/profile', requireAuth, async (req, res) => {
  const pool = req.app.get('pool');
  const { firstName, lastName, email, username, bio } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           email = $3,
           username = $4,
           bio = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING id,
                 first_name,
                 last_name,
                 username,
                 email,
                 bio,
                 profile_image_url,
                 theme_preference`,
      [firstName, lastName, email, username, bio, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'user not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('error in PUT /api/profile:', err);
    res.status(500).json({ message: 'error updating profile' });
  }
});

/* ---------- PROFILE: UPDATE THEME ---------- */

/**
 * POST /api/profile/theme
 * updates the authenticated user's theme preference
 */
router.post('/profile/theme', requireAuth, async (req, res) => {
  const pool = req.app.get('pool');
  const { theme } = req.body;

  if (theme !== 'light' && theme !== 'dark') {
    return res.status(400).json({ message: 'invalid theme' });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET theme_preference = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING theme_preference`,
      [theme, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'user not found' });
    }

    res.json({ success: true, theme: result.rows[0].theme_preference });
  } catch (err) {
    console.error('error in POST /api/profile/theme:', err);
    res.status(500).json({ message: 'error saving theme' });
  }
});

/* ---------- PROFILE: UPDATE PICTURE ---------- */

/**
 * POST /api/profile/picture
 * uploads and saves the authenticated user's profile image
 */
router.post(
  '/profile/picture',
  requireAuth,
  upload.single('profilePic'),
  async (req, res) => {
    const pool = req.app.get('pool');

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'no file uploaded' });
      }

      const imagePath = `/uploads/${req.file.filename}`;

      const result = await pool.query(
        `UPDATE users
         SET profile_image_url = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING profile_image_url`,
        [imagePath, req.userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'user not found' });
      }

      res.json({ success: true, imageUrl: result.rows[0].profile_image_url });
    } catch (err) {
      console.error('error in POST /api/profile/picture:', err);
      res.status(500).json({ message: 'error saving profile image' });
    }
  }
);

/* ---------- JOURNAL ENTRIES ---------- */

/**
 * POST /api/entries
 * creates a new journal entry
 */
router.post('/entries', requireAuth, async (req, res) => {
  const pool = req.app.get('pool');

  // these names must match what your front-end sends
  const { title, bodyText, imageUrl, location, entryDate } = req.body;

  // basic validation so we fail with 400 instead of 500 if user leaves blanks
  if (!title || !bodyText) {
    return res
      .status(400)
      .json({ success: false, message: 'title and thoughts are required' });
  }

  try {
    // this matches your createEntry signature in entryModel.js exactly:
    // createEntry(pool, userId, title, bodyText, imageUrl, location, entryDate)
    const newEntryId = await createEntry(
      pool,
      req.userId,
      title,
      bodyText,
      imageUrl || null,
      location || null,
      entryDate || null
    );

    res.json({ success: true, entryId: newEntryId });
  } catch (err) {
    // 👀 this will print the real database error in your terminal
    console.error('error in POST /api/entries:', err.message);
    console.error(err.stack);
    res
      .status(500)
      .json({ success: false, message: 'error in creating entry' });
  }
});


/**
 * GET /api/entries
 * retrieves all journal entries for the current user
 */
router.get('/entries', requireAuth, async (req, res) => {
  const pool = req.app.get('pool');
  try {
    const entries = await listEntries(pool, req.userId);
    res.json({ success: true, entries });
  } catch (err) {
    console.error('error in GET /api/entries:', err);
    res.status(500).json({ message: 'error in listing all entries' });
  }
});

/**
 * DELETE /api/entries/:id
 * deletes a single journal entry
 */
router.delete('/entries/:id', requireAuth, async (req, res) => {
  const pool = req.app.get('pool');
  const entryId = Number(req.params.id);

  try {
    const deletedCount = await deleteEntry(pool, req.userId, entryId);
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'entry not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('error in DELETE /api/entries/:id', err);
    res.status(500).json({ message: 'error deleting entry' });
  }
});

/**
 * PUT /api/entries/:id
 * updates an existing journal entry
 */
router.put('/entries/:id', requireAuth, async (req, res) => {
  const pool = req.app.get('pool');
  const entryId = Number(req.params.id);
  const fields = req.body;

  try {
    const updated = await editEntry(pool, req.userId, entryId, fields);
    if (!updated) {
      return res.status(404).json({ message: 'entry not found' });
    }

    res.json({ success: true, entry: updated });
  } catch (err) {
    console.error('error in PUT /api/entries/:id:', err);
    res.status(500).json({ message: 'error editing entry' });
  }
});

module.exports = router;