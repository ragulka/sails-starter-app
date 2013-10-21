/**
 * User
 *
 * @module      :: Model
 * @description :: This is the User model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var bcrypt = require('bcrypt'),
    uuid = require("node-uuid"),
    _ = require("lodash");

module.exports = {

  schema: true,

  attributes: {
    
    firstName: {
      type: 'string'
    },
    
    lastName: {
      type: 'string'
    },

    avatar: {
      type: 'string',
      url: true
    },

    email: {
      type: 'email',
      required: true
    },

    encryptedPassword: {
      type: 'string'
    },

    sessionTokens: {
      type: 'array'
    },

    /**
     * Custom toJSON() implementation. Removes unwanted attributes.
     */
     
    toJSON: function() {
      var user = this.toObject();
      delete user.password;
      delete user.passwordConfirmation;
      delete user.encryptedPassword;
      delete user.sessionTokens;
      delete user._csrf;
      return user;
    },

    /**
     * Check if the supplied password matches the stored password.
     */
     
    validatePassword: function( candidatePassword, cb ) {
      bcrypt.compare( candidatePassword, this.encryptedPassword, function (err, valid) {
        if(err) return cb(err);
        cb(null, valid);
      });
    }
    
  },

  /**
   * Functions that run before a user is created
   */
   
  beforeCreate: function(values, cb) {
    if (!values.password || values.password !== values.passwordConfirmation) {
      return cb({ err: "Password doesn't match confirmation!" });
    }

    User.encryptPassword(values, function (err) {
      cb(err);
    });
  },

  /**
   * Functions that run before a user is updated
   */
   
  beforeUpdate: function(values, cb) {
    if (!values.password) {
      return cb();
    }

    User.encryptPassword(values, function (err) {
      cb(err);
    });
  },

  /**
   * User password encryption. Uses bcrypt.
   */

  encryptPassword: function(values, cb) {
    bcrypt.hash(values.password, 10, function (err, encryptedPassword) {
      if(err) return cb(err);
      values.encryptedPassword = encryptedPassword;
      cb();
    });
  },

  /**
   * Issue a session token for a user
   */

  issueSessionToken: function(user, cb) {
    if (!user || typeof user === 'function') return cb("A user model must be supplied");

    if (!user.sessionTokens) {
      user.sessionTokens = [];
    }

    var token = uuid.v4();

    user.sessionTokens.push({
      token: token,
      issuedAt: new Date()
    });

    user.save(function (err) {
      cb(err, token);
    });
  },

  /**
   * Consume a user's session token
   */  

  consumeSessionToken: function (token, cb) {
    if (!token || typeof token === 'function') return cb("A token must be supplied");

    User.findOne({'sessionTokens.token': token }, function (err, user) {
      if (err) return cb( err );
      if (!user) return cb(null, false);

      // Remove the consumed session token so it can no longer be used
      if (user.sessionTokens) {
        user.sessionTokens.forEach(function (sessionToken, index) {
          if (sessionToken.token === token) {
            delete user.sessionTokens[index];
          }
        });
      }

      // Remove falsy tokens
      user.sessionTokens = _.compact(user.sessionTokens);

      // Save
      user.save(function (err) {
        return cb( err, user );
      });
    });
  }

};
