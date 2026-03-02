/**
  db/userModel.js
  11/17/2025
  Ayra Babar
  Kyle Revelo
  Khalil Velasco
*/

const bcrypt = require('bcrypt');

/**
 * createUser(pool, firstName, lastName, username, email, rawPassword)
 * creates a new user in the database with a hashed password
 *
 * parameters:
 *  - pool        : pg.Pool instance
 *  - firstName   : string
 *  - lastName    : string
 *  - username    : string
 *  - email       : string
 *  - rawPassword : string (plaintext password)
 *
 * process:
 *  1. hash the password using bcrypt
 *  2. insert the new user into the users table
 *  3. return the new user's ID
 *
 * returns:
 *  - number: id of the new user
 *
 * throws:
 *  - database errors or hashing errors
 */
async function createUser(pool, firstName, lastName, username, email, rawPassword) {
    try {
        // hash the password before saving, never store plain text passwords
        const hash = await bcrypt.hash(rawPassword, 10);

        const result = await pool.query('INSERT INTO users (first_name, last_name, username, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id', [firstName, lastName, username, email, hash]);
        return result.rows[0].id;
    } 
    catch (err) {
        throw(err);
    }
}


/**
 * findUserByUsername(pool, username)
 * finds a user from the database by username
 *
 * parameters:
 *  - pool   : pg.Pool instance
 *  - username : string (username to find in database)
 *
 * process:
 *  1. execute a SELECT * FROM users WHERE username = $1
 *  2. rowCount tells whether a user was actually found under given username
 *
 * Returns:
 *  - user from the data base if successful
 *  - null if user not found with given username
 *
 * throws:
 *  - any database errors
 */

async function findUserByUsername(pool, username) {
  try {
        const result = await pool.query(' SELECT * FROM users WHERE username = $1', [username]);
        if(result.rowCount === 0) {
            return null;
        };

        return result.rows[0];
    } 
    catch (err) {
        throw(err);
    }
}


/**
 * loginUser(pool, username, rawPassword)
 * attempts to authenticate a user by checking their username & password
 *
 * parameters:
 *  - pool        : pg.Pool instance (database connection)
 *  - username    : string (username to look up)
 *  - rawPassword : string (plaintext password provided by the user)
 *
 * process:
 *  1. fetch the user row from the database by username
 *  2. if no user exists, return null
 *  3. compare the provided password with the stored password_hash using bcrypt
 *  4. return the user object if the password matches; otherwise return null
 *
 * returns:
 *  - user object (with id, username, etc.) if login is valid
 *  - null if invalid username or invalid password
 *
 * throws:
 *  - any database or bcrypt errors encountered during execution
 */
async function loginUser(pool, username, rawPassword) {
    try {
    const user = await findUserByUsername(pool, username);
        if(!user) {
            return null;
        }
        const match = await bcrypt.compare(rawPassword, user.password_hash);
        return (match ? user : null);
    }
    catch(err) {
        throw(err);
    }
}


/**
 * deleteUser(pool, userId)
 * deletes a user from the database by ID
 *
 * parameters:
 *  - pool   : pg.Pool instance
 *  - userId : number (ID of the user to delete)
 *
 * process:
 *  1. execute a DELETE FROM users WHERE id = $1
 *  2. rowCount tells whether a user was actually removed
 *
 * returns:
 *  - 1 if deletion succeeded
 *  - 0 if no user with that ID existed
 *
 * throws:
 *  - any database error
 */
async function deleteUser(pool, userId) {
    try {
        const result = await pool.query(' DELETE FROM users WHERE id = $1', [userId]);
        return result.rowCount;
    }
    catch(err) {
        throw(err);
    }
}


/**
 * invalidUsername(username)
 * checks whether a username contains any invalid characters or whitespaces
 *
 * invalid if:
 *  - contains special characters (listed in the array below)
 *  - contains any whitespace (spaces, tabs, newlines, etc.)
 *
 * parameters:
 *  - username : string
 *
 * returns:
 *  - true if username is invalid
 *  - false if username is valid
 *
 * notes:
 *  - only checks for formatting, not length or uniqueness
 */
function invalidUsername(username) {

    const specialCharacters = [
  ':', ';', ',', '!', '?', ')', '(', '[', ']', '{', '}', 
  '#', '$', '%', '^', '&', '*', "'", '/', '"', '\\', 
  '+', '>', '<', '~', '`', '=', '|'];

    for(const c of specialCharacters) {
        if(username.includes(c)){
            return true;
        }
    }

    // tests for all kinds of white spaces in username
    if(/\s/.test(username)) return true;

    return false;
}

module.exports = {
    createUser,
    findUserByUsername,
    loginUser,
    deleteUser,
    invalidUsername,
};
