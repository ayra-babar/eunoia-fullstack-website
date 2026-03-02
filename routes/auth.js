/**
  routes/auth.js
  11/17/2025
  Ayra Babar
  Kyle Revelo
  Khalil Velasco
*/

const express = require('express');
const { createUser, loginUser, invalidUsername, findUserByUsername } = require('../db/userModel');
const jwt = require('jsonwebtoken');
const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// SIGNUP
router.post('/signup', async (req, res) => {
  const pool = req.app.get('pool');
  const { firstName, lastName, username, email, password, confirmPassword } = req.body;

  if (invalidUsername(username)) {
    return res.status(400).json({ message: 'username format invalid' });
  }

  const existing = await findUserByUsername(pool, username);
  if(existing) return res.status(400).json({ message: 'username already taken' });

  if (password !== confirmPassword) return res.status(400).json({ message: 'passwords do not match' });

  try {
    const newUserId = await createUser(
      pool, 
      firstName, 
      lastName, 
      username, 
      email, 
      password
    );

    const token = createToken(newUserId);

    // front-end JS can check { success: true } and redirect to /profile
    res.json({ success: true, token });

  } catch (err) {
    console.error('error in /signup:', err);
    res.status(500).json({ message: 'error registering user' });
  }
});


/**
 * POST /login
 * logs in a user
 *
 * expects in req.body:
 *  - username : string
 *  - password : string
 *
 * process:
 *  1. validate credentials using loginUser()
 *  2. issue JWT token on success
 *
 * responses:
 *  - 200 OK  -> { success: true, token }
 *  - 401 Unauthorized -> { message: "invalid username or password" }
 *  - 500 Internal Server Error -> { message: "error logging in" }
 */
router.post('/login', async (req, res) => {
  const pool = req.app.get('pool');
  const { username, password } = req.body;

  try {
    const user = await loginUser(pool, username, password);
    if(!user) {
        return res.status(401).json({ message: 'invalid username or password' });
    }

    const token = createToken(user.id);
    res.json({ success: true, token });

  } catch (err) {
    console.error('error in /login:', err);
    res.status(500).json({ message: 'error logging in' });
  }
});

module.exports = router;