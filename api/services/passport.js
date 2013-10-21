var passport = require( "passport" ),
    LocalStrategy = require('passport-local').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy,
    RememberMeStrategy = require('passport-remember-me').Strategy;
            
/**
 * Passport setup
 */

/** Passport session setup. */

passport.serializeUser( function (user, done) {
  done(null, user.id);
});

passport.deserializeUser( function (userId, done) {
  User.findOneById(userId, function (err, user) {
    done(err, user);
  });
});

/** Passport authentication strategies */

/**
 * Passport Local Strategy
 */

passport.use( new LocalStrategy(
  { usernameField: 'email' },
  function (email, password, done) {
    User.findOneByEmail( email, function ( err, user ) {
      if(err) return done( err );
      
      // No user was found
      if(!user) {
        return done( null, false, { message: 'Unknown user' } );
      }

      // Validate user password
      user.validatePassword( password, function ( err, isValid ) {
        if(err) return done( err );

        // If the password was not valid
        if(!isValid)
          return done( null, false, { message: 'Invalid password' } );
        
        // We are successfully authenticated, return the user instance
        done( null, user );
      });
    });
  }
));

/**
 * Passport Remember Me (cookie) Startegy
 *
 * This strategy consumes a remember me token, supplying the user the
 * token was originally issued to. The token is single-use, so a new
 * token is then issued to replace it.
 */

passport.use(new RememberMeStrategy(
  function (token, done) {
    User.consumeSessionToken(token, function (err, user) {
      done( err, user );
    });
  },
  User.issueSessionToken
));

/**
 * Passport Basic HTTP Auth Startegy
 */

passport.use(new BasicStrategy( function (apiKey, password, done) {
  if (apiKey !== password) {
    return done( new Error( "API key and password do not match" ) );
  }
  // Find the user by API key.  If there is no user with the given
  // API key, or the password is not correct, set the user to `false` to
  // indicate failure.  Otherwise, return the authenticated `user`.
  User.findByApiKey( apiKey, function (err, user) {
    if (err) return done( err );
    if (!user) return done( null, false, { message: 'Invalid or unknown API key' } );
    done( null, user );
  });
}));