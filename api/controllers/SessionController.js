/**
 * SessionController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var passport = require('passport');

module.exports = {
  

  /**
   * Create a new session (log in user)
   */

  create: function(req, res, next) {
    passport.authenticate('local', function (err, user, info) {
      if (err) return res.serverError(err);
      
      // Authentication failed
      if (!user) return res.badRequest(info);

      // Log the user in
      req.logIn(user, function (err) {
        if(err) return res.serverError(err);

        // Just return user JSON if remember me was not specified
        if (!req.body.remember) return res.send(user.toJSON());

        // If remember me option was specified, issue a session token
        User.issueSessionToken( user, function (err, token) {
          if(err) return res.serverError(err);
          res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 60*60*24*30 });
          // ... and return user data as JSON
          res.send(user.toJSON());
        });
      });

    })(req, res, next);   
  },

  /**
   * Destroy a session (log out user)
   */

  destroy: function(req, res, next) {
    if (!req.user) return res.send();

    // Clear user's session tokens
    req.user.sessionTokens = [];
    req.user.save(function (err) {
      if(err) return res.serverError(err);

      // Clear user's remember_me cookie
      res.clearCookie('remember_me');
      // Log out the user
      req.logout();
      
      // Send empty response
      res.send();  
    });
  },


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to SessionController)
   */
  _config: {
    blueprints: {
      prefix: '',
      pluralize: false
    }
  }

  
};
