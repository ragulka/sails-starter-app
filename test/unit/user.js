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
          if (err) return cb(err);
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
            if (err) return cb(err);
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
            if (err) return cb(err);
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
        if (err) return cb(err);
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
        if (err) return cb(err);
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

  describe("API Key", function() {
    var user;
    before(function (cb) {
      var userData = {
        email: "testuser@sails.com",
        password: "test_password",
        passwordConfirmation: "test_password"
      };

      User.create(userData, function (err, newUser) {
        if (err) return cb(err);
        user = newUser;
        cb();
      });
    });

    it("must be generateted for a new user", function() {
      user.must.have.property('apiKey');
    });

    after(function (cb){
      user.destroy(function (err) {
        cb(err);
      });
    });
  });

  describe(".fullName()", function() {
    describe("given first name only", function() {
      it("must return first name only, no trailing space", function() {
        var user = new User._model({
          firstName: 'Jon',
        });
        user.fullName().must.equal(user.firstName);
      });
    });

    describe("given last name only", function() {
      it("must return last name only, no preceeding space", function() {
        var user = new User._model({
          lastName: 'Doe',
        });
        user.fullName().must.equal(user.lastName);
      });
    });

    describe("given both first and last name", function() {
      it("must return the full name", function() {
        var user = new User._model({
          firstName: 'Jon',
          lastName: 'Doe',
        });
        user.fullName().must.equal(user.firstName + ' ' + user.lastName);
      });
    });

    describe("given neither first or last name", function() {
      it("must return empty string", function() {
        var user = new User._model();
        user.fullName().must.equal('');
      });
    });
  });

  describe(".generatePasswordResetToken()", function() {
    var user;
    before(function (cb) {
      var userData = {
        email: "testuser@sails.com",
        password: "test_password",
        passwordConfirmation: "test_password"
      };

      User.create(userData, function (err, newUser) {
        if (err) return cb(err);
        user = newUser;
        user.generatePasswordResetToken(function (err) {
          if (err) return cb(err);
          cb();
        });
      });
    });

    it("must generate a random uuid token and save it", function() {
      user.must.have.property('passwordResetToken');
      user.passwordResetToken.must.be.an.object();
      user.passwordResetToken.must.have.property('value');
      user.passwordResetToken.must.have.property('issuedAt');
    });

    after(function (cb){
      user.destroy(function (err) {
        cb(err);
      });
    });    
  });

  describe(".sendPasswordResetEmail()", function() {
    var user, response, message, timeBefore;

    before(function (cb) {
      this.timeout(4000);
      
      var userData = {
        email: "testuser@sails.com",
        password: "test_password",
        passwordConfirmation: "test_password"
      };

      User.create(userData, function (err, newUser) {
        if (err) return cb(err);
        user = newUser;
        timeBefore = new Date();

        user.sendPasswordResetEmail(function (err, res, msg) {
          if (err) return cb(err);
          response = res;
          message = msg;
          cb();
        });
      });
    });

    it("must send the password reset email", function() {
      response.must.have.property('message');
      response.message.must.equal('250 Message accepted');
      response.failedRecipients.must.be.empty();
    });

    it("must set a new password reset token for the user", function (cb) {
      User.findOneById(user.id, function (err, user) {
        if(err) return cb(err);
        user.passwordResetToken.must.be.an.object();
        user.passwordResetToken.issuedAt.getTime().must.be.gte( timeBefore.getTime() );
        cb();
      });
    });
  });

});