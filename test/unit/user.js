describe("User Model:", function() {

  describe("Password encryption", function() {

    describe("for a new user", function() {
      var user;
      before(function (cb) {
        var userData = {
          email: "testuser@sails.com",
          password: "test_password",
          passwordConfirmation: "test_password"
        };

        User.create(userData, function (err, newUser) {
          if (err) cb(err);
          user = newUser;
          cb();
        });
      });

      it("must encrypt the password", function() {
        user.must.have.property('encryptedPassword');
        user.must.not.have.property('password');
        user.must.not.have.property('passwordConfirmation');
      });

      after(function (cb){
        user.destroy(function (err) {
          cb(err);
        });
      });
    });

    describe("for an existing user", function() {
      describe("if the password was changed", function() {
        var user, oldPassHash, newPassHash;

        before(function (cb) {
          var userData = {
            email: "testuser@sails.com",
            password: "test_password",
            passwordConfirmation: "test_password"
          };

          User.create(userData, function (err, newUser) {
            if(err) cb(err);
            oldPassHash = newUser.encryptedPassword;
            User.update(newUser.id, { password: "new_password" }, function (err, updatedUser) {
              if(err) return cb(err);
              user = updatedUser[0];
              newPassHash = updatedUser[0].encryptedPassword;
              cb();
            });
          });
        });

        it("must encrypt the new password", function() {
          user.must.have.property('encryptedPassword');
          user.must.not.have.property('password');
          oldPassHash.must.not.equal(newPassHash);
        });

        after(function (cb){
          user.destroy(function (err) {
            cb(err);
          });
        });        
      });

      describe("if the password was not changed", function() {
        var user, oldPassHash, newPassHash;

        before(function (cb) {
          var userData = {
            email: "testuser@sails.com",
            password: "test_password",
            passwordConfirmation: "test_password"
          };

          User.create(userData, function (err, newUser) {
            if(err) cb(err);
            oldPassHash = newUser.encryptedPassword;
            User.update(newUser.id, { firstName: "Bob" }, function (err, updatedUser) {
              if(err) return cb(err);
              user = updatedUser[0];
              newPassHash = updatedUser[0].encryptedPassword;
              cb();
            });
          });
        });

        it("must not try to encrypt the password", function() {
          user.must.have.property('encryptedPassword');
          user.must.not.have.property('password');
          oldPassHash.must.equal(newPassHash);
        });

        after(function (cb){
          user.destroy(function (err) {
            cb(err);
          });
        });        
      });
    });

  });

  describe("Password validation", function() {
    var user;
    
    before(function (cb) {
      var userData = {
        email: "testuser@sails.com",
        password: "test_password",
        passwordConfirmation: "test_password"
      };

      User.create(userData, function (err, newUser) {
        if (err) cb(err);
        user = newUser;
        cb();
      });
    });

    describe("given a valid password", function() {
      it("must return true", function (cb) {
        user.validatePassword("test_password", function (err, valid) {
          valid.must.be.true();
          cb();
        });
      });
    });

    describe("given an invalid password", function() {
      it("must return false", function (cb) {
        user.validatePassword("wrong_password", function (err, valid) {
          valid.must.be.false();
          cb();
        });
      });
    });

    after(function (cb){
      user.destroy(function (err) {
        cb(err);
      });
    });    
  });

  describe("Session tokens", function() {
    var user, usedSessionToken;
    
    before(function (cb) {
      var userData = {
        email: "testuser@sails.com",
        password: "test_password",
        passwordConfirmation: "test_password"
      };

      User.create(userData, function (err, newUser) {
        if (err) cb(err);
        user = newUser;
        cb();
      });
    });

    describe("#issueSessionToken()", function() {
      it("must persist a session token in database", function (cb) {
        User.issueSessionToken(user, function (err, valid) {
          if(err) return cb(err);

          User.findOneById(user.id, function (err, user) {
            user.must.have.property('sessionTokens');
            user.sessionTokens.must.be.an.array();
            user.sessionTokens.must.have.length(1);

            usedSessionToken = user.sessionTokens[0].token;
            cb();
          });
        });
      });
    });

    describe("#consumeSessionToken()", function() {
      it("must return the user object and discard the token", function (cb) {
        User.consumeSessionToken(usedSessionToken, function (err, user) {
          if(err) return cb(err);

          user.must.be.an.object();
          user.sessionTokens.some(function (sessionToken) {
            return sessionToken.token === usedSessionToken
          }).must.not.be.true();

          cb();
        });
      });
    });

    after(function (cb){
      user.destroy(function (err) {
        cb(err);
      });
    });     
  });

});