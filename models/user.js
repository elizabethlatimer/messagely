/** User class for message.ly */

const bcrypt = require('bcrypt');
const db = require('../db');
const { BCRYPT_WORK_FACTOR } = require('../config')

/** User of the site. */

class User {
  constructor(username, password, first_name, last_name, phone) {
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
  }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    let registered = await db.query(`
      INSERT INTO users(username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone
    `, [username, hashedPassword, first_name, last_name, phone]);

    return registered.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    let user = await db.query(`
      SELECT username, password
      FROM users
      WHERE username = $1
    `, [username])

    if(!user.rows[0]) return false;

    let authenticated = await bcrypt.compare(password, user.rows[0].password);

    return authenticated;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    let loginUpdate = await db.query(`
      UPDATE users SET last_login_at = current_timestamp
      WHERE username = $1
      RETURNING username, last_login_at
    `, [username]);

    return loginUpdate.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    let allUsers = await db.query(`
      SELECT username, first_name, last_name, phone
      FROM users
    `);

    return allUsers.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    let user = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at
    FROM users
    WHERE username = $1
  `, [username]);

    return user.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    let sentMessages = await db.query(`
      SELECT m.id as id,
             m.to_username as to_username,
             m.body as body,
             m.sent_at as sent_at,
             m.read_at as read_at,
             t.first_name as first_name,
             t.last_name as last_name,
             t.phone as phone
      FROM messages AS m
        JOIN users AS f ON m.from_username = f.username
        JOIN users AS t ON m.to_username = t.username
      WHERE m.from_username = $1
    `, [username]);

    return sentMessages.rows.map(msg => {
      return {
        id: msg.id,
        to_user: {
          username: msg.to_username,
          first_name: msg.first_name,
          last_name: msg.last_name,
          phone: msg.phone
        },
        body: msg.body,
        sent_at: msg.sent_at,
        read_at: msg.read_at
      }
    });
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    let receivedMessages = await db.query(`
    SELECT m.id as id,
           m.from_username as from_username,
           m.body as body,
           m.sent_at as sent_at,
           m.read_at as read_at,
           f.first_name as first_name,
           f.last_name as last_name,
           f.phone as phone
  FROM messages m
    JOIN users f ON m.from_username = f.username
    JOIN users t ON m.to_username = t.username
    WHERE m.to_username = $1
  `, [username]);

  return receivedMessages.rows.map(msg => {
    return {
      id: msg.id,
      from_user: {
        username: msg.from_username,
        first_name: msg.first_name,
        last_name: msg.last_name,
        phone: msg.phone
      },
      body: msg.body,
      sent_at: msg.sent_at,
      read_at: msg.read_at
    }
  });
  }
}


module.exports = User;