const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ExpressError = require('../expressError');
const { SECRET_KEY } = require('../config')

const router = new express.Router();


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (await User.authenticate(username, password)) {
      let payload = { username };
      let token = jwt.sign(payload, SECRET_KEY);
      User.updateLoginTimestamp(username);

      return res.json({ token });
    } else {
      throw new ExpressError('Invalid Username/Password', 400);
    }
  } catch (err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
  try {
    const userInputs = {
      username: req.body.username,
      password: req.body.password,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone
    }

    let userDetails = await User.register(userInputs);

    if (userDetails) {
      let payload = { username: userDetails.username };
      let token = jwt.sign(payload, SECRET_KEY);

      return res.json({ token });
    }

  } catch (err) {
    return next(err);
  }
});


module.exports = router;