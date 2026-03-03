/**
 * createEntry(pool, userId, title, bodyText, imageUrl, location, entryDate)
 * inserts a new journal entry for a specific user
 *
 * parameters:
 *  - pool      : pg.Pool instance
 *  - userId    : number (authenticated user's id)
 *  - title     : string (max 200 chars)
 *  - bodyText  : string
 *  - imageUrl  : string
 *  - location  : string
 *  - entryDate : date
 *
 * returns:
 *  - number: id of the newly created entry
 *
 * throws:
 *  - database errors if insertion fails
 */
async function createEntry(pool, userId, title, bodyText, imageUrl, location, entryDate) {
  try {
      const result = await pool.query('INSERT INTO entries (user_id, title, body_text, image_url, location, entry_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', 
        [userId, 
          title, 
          bodyText, 
          imageUrl || null, 
          location || null, 
          entryDate || null]);
      return result.rows[0].id;

  } catch(err) {
      throw(err);
  }
}


/**
 * listEntries(pool, userId)
 * fetches all journal entries that belong to a single user
 *
 * parameters:
 *  - pool   : pg.Pool instance (database connection)
 *  - userId : number (ID of the user)
 *
 * process:
 *  1. SELECT rows from entries WHERE user_id = $1
 *  2. order them (e.g. newest first by created_at)
 *
 * returns:
 *  - array of entry objects (can be empty if user has no entries)
 *
 * throws:
 *  - any database error
 */
/**
 * listEntries(pool, userId)
 * -------------------------
 * Fetches all journal entries that belong to a single user.
 */
async function listEntries(pool, userId) {
  try {
    const result = await pool.query(
      `SELECT
        id,
        title,
        body_text AS "bodyText",
        image_url AS "imageUrl",
        location,
        entry_date AS "entryDate",
        created_at AS "createdAt"
      FROM entries
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;   // [] if no entries
  } catch (err) {
    throw err;
  }
}



/**
 * deleteEntry(pool, userId, entryId)
 * deletes a single journal entry for a specific user
 *
 * parameters:
 *  - pool    : pg.Pool instance
 *  - userId  : number (ID of the owner, from JWT)
 *  - entryId : number (ID of the entry to delete)
 *
 * process:
 *  1. DELETE FROM entries WHERE id = $1 AND user_id = $2
 *  2. use rowCount to see if anything was actually deleted
 *
 * returns:
 *  - 1 if an entry was deleted
 *  - 0 if no matching entry was found (wrong id or not this user's entry)
 *
 * throws:
 *  - any database error
 */
async function deleteEntry(pool, userId, entryId) {
   try{
    const result = await pool.query('DELETE FROM entries WHERE id = $1 AND user_id = $2', [entryId, userId]);
    return result.rowCount;

  } catch(err) {
      throw(err);
  }
}


/**
 * editEntry(pool, userId, entryId, fields)
 * updates an existing journal entry for a specific user
 *
 * parameters:
 *  - pool    : pg.Pool instance
 *  - userId  : number (ID of the owner, from JWT)
 *  - entryId : number (ID of the entry to update)
 *  - fields  : object with any editable fields, e.g.
 *              { title, bodyText, imageUrl, location, entryDate }
 *
 * process:
 *  1. build an UPDATE query that only changes the provided fields
 *  2. UPDATE entries SET ... WHERE id = $entryId AND user_id = $userId
 *  3. return the updated row (or null if not found)
 *
 * returns:
 *  - the updated entry object if successful
 *  - null if no matching entry was found
 *
 * throws:
 *  - any database error
 */
async function editEntry(pool, userId, entryId, fields) {
  const { title, bodyText, imageUrl, location, entryDate } = fields;

  try {
    const result = await pool.query(
      `UPDATE entries
       SET
         title     = $1,
         body_text = $2,
         image_url = $3,
         location  = $4,
         entry_date = $5
       WHERE id = $6 AND user_id = $7
       RETURNING
         id,
         title,
         body_text AS "bodyText",
         image_url AS "imageUrl",
         location,
         entry_date AS "entryDate",
         created_at AS "createdAt"`,
      [title, bodyText, imageUrl, location, entryDate, entryId, userId]
    );

    if (result.rowCount === 0) {
      return null;
    }
    return result.rows[0];
  } catch (err) {
    throw err;
  }
}


module.exports = {
    createEntry,
    listEntries,
    deleteEntry,
    editEntry,
};
