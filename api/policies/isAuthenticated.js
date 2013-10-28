/**
 * isAuthenticated
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
var passport = require('passport');

module.exports = function(req, res, next) {

  // User is authenticated, proceed to controller
  if (req.isAuthenticated()) return next();

  // Try authenticating user with API key
  passport.authenticate('basic', { session: false }, function (err, user, info) {
    if (err) return res.serverError(err);

    if (!user) return res.send(401, { status: "Not authorized" });

    req.user = user;
    next();
  })(req, res, next);

};
