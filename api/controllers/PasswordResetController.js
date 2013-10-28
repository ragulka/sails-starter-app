/**
 * PasswordResetController
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

module.exports = {
  
  /**
   * Create a new password reset token and send 
   * an email with instructions to user
   */

  create: function(req, res, next) {
    if (!req.body.email) return res.badRequest({ email: "required" });

    User.findOneByEmail(req.body.email, function (err, user) {
      if(err) return res.serverError(err);

      if(!user) return res.badRequest({ user: "not found" });

      Jobs.create('sendPasswordResetEmail', { user: user.toObject() }).save(function (err) {
        if(err) return res.serverError(err);
        res.send({ info: "Password reset instructions sent" });
      });
    });
  },

  /**
   * Update user password 
   * Expects and consumes a password reset token
   */

  update: function(req, res, next) {
    if (!req.params.id) return res.notFound();

    if (!req.body.token) return res.badRequest({ token: "required" });

    User.findOneById(req.params.id, function (err, user) {
      if (err) return next(err);

      // Check if the token is valid
      if (!user.passwordResetToken || user.passwordResetToken.value !== req.body.token)
        return res.badRequest({ token: "invalid" });

      // Check if token is expired
      var expires = new Date().setHours( new Date().getHours() - 2 );

      if (user.passwordResetToken.issuedAt.getTime() <= expires)
        return res.badRequest({ token: "expired" });

      // Check if password has been provided
      if (!req.body.password)
        return res.badRequest({ password: "required" });

      // Check if password matches confirmation
      if (req.body.password !== req.body.passwordConfirmation)
        return res.badRequest({ passwordConfirmation: "invalid" });

      // Update user with new password
      user.password = req.body.password;
      user.save(function (err) {
        if (err) return next(err);

        // Send user data back to client
        res.send( user.toJSON() );
      });
    });

  },


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to PasswordResetController)
   */
  _config: {
    blueprints: {
      rest: false
    }    
  }

  
};
