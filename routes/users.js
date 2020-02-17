const express = require('express');
const User = require('../models/user');
const ExpressError = require('../expressError');
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth")

const router = new express.Router();

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const users = await User.all();

    return res.json({ users });

  } catch (err) {
    return next(err);
  }
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureLoggedIn, async (req, res, next) => {
  try {
    const user = await User.get(req.params.username);

    if (!user) {
      throw new ExpressError('Username not found.', 404);
    }

    return res.json({ user });

  } catch (err) {
    return next(err);
  }
});

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureCorrectUser, async (req, res, next) => {
  try {
    const messagesTo = await User.messagesTo(req.params.username);

    return messagesTo.length === 0 ?
      res.json({ error: 'No messages found.' }) :
      res.json({ messages: messagesTo });

  } catch (err) {
    return next(err);
  }
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureCorrectUser, async (req, res, next) => {
  try {
    const messagesFrom = await User.messagesFrom(req.params.username);

    return messagesFrom.length === 0 ?
      res.json({ error: 'No messages found.' }) :
      res.json({ messages: messagesFrom });

  } catch (err) {
    return next(err);
  }
});


module.exports = router;