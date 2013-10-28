describe("Authentication:", function() {
  describe("Accessing a protected route without being authenticated", function() {
    var response;

    before(function (cb) {
      request(sails.config.localAppURL)
        .get('/api/v1/users')
        .end(function (err, res) {
          if (err) return cb(err);
          response = res;
          cb();
        });
    });

    it("must respond with status 401", function() {
      response.status.must.be(401);
    });

    it("must respond with an error", function() {
      response.body.must.have.property('status');
    });
  });

  describe("With sessions:", function() {
    describe("Creating a new session", function() {
      
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

      describe("given a correct username and password", function() {
        var response, agent;

        before(function (cb) {
          agent = request.agent(sails.config.localAppURL);

          agent.get('/csrfToken').end(function (err, res) {
            if (err) return cb(err);

            agent.saveCookies(res);
            var csrfToken = res.body._csrf;

            agent
              .post('/session')
              .send({ email: "testuser@sails.com", password: "test_password", _csrf: csrfToken })
              .end(function (err, res) {
                if (err) return cb(err);
                response = res;
                // Set cookie for the agent (browsers do this automatically)
                agent.saveCookies(response);            
                cb();
              });
          });

        });

        it("must respond with status 200", function () {
          response.status.must.be(200);
        });

        it("must respond with the user's data", function () {
          response.body.must.be.an.object();
          response.body.must.have.property('email');
          response.body.must.have.property('id');
        });

        it("must set a cookie that will authenticate subsequent requests", function (done) {
          // Try a new request
          agent
            .get('/api/v1/users/' + response.body.id)
            .end(function (err, getResponse) {
              if (err) return cb(err);
              getResponse.status.must.be(200);
              getResponse.body.must.be.an.object();
              getResponse.body.id.must.equal( response.body.id );
              done();
            });
        });
      });

      describe("given incorrect username", function() {
        var response, agent;

        before(function (cb) {
          agent = request.agent(sails.config.localAppURL);

          agent.get('/csrfToken').end(function (err, res) {
            if (err) return cb(err);

            agent.saveCookies(res);
            var csrfToken = res.body._csrf;
            
            agent
              .post('/session')
              .send({ email: "idontexist", password: "test_password", _csrf: csrfToken })
              .end(function (err, res) {
                if (err) return cb(err);
                response = res;
                cb();
              });
          });
        });

        it("must respond with status 400", function () {
          response.status.must.be(400);
        });

        it("must respond with an error message", function () {
          response.body.must.be.an.object();
          response.body.must.have.property('validationErrors');
        });
      });

      describe("given incorrect username", function() {
        var response, agent;

        before(function (cb) {
          agent = request.agent(sails.config.localAppURL);

          agent.get('/csrfToken').end(function (err, res) {
            if (err) return cb(err);

            agent.saveCookies(res);
            var csrfToken = res.body._csrf;        

            agent
              .post('/session')
              .send({ email: "testuser@sails.com", password: "wrong_password", _csrf: csrfToken })
              .end(function (err, res) {
                if (err) return cb(err);
                response = res;
                cb();
              });
          });
        });

        it("must respond with status 400", function () {
          response.status.must.be(400);
        });

        it("must respond with an error message", function () {
          response.body.must.be.an.object();
          response.body.must.have.property('validationErrors');
        });
      });

      describe("with remember me option specified", function() {
        var response, agent;

        before(function (cb) {
          agent = request.agent(sails.config.localAppURL);
          
          agent.get('/csrfToken').end(function (err, res) {
            if (err) return cb(err);

            agent.saveCookies(res);
            var csrfToken = res.body._csrf;        

            agent
              .post('/session')
              .send({ email: "testuser@sails.com", password: "test_password", remember: true, _csrf: csrfToken })
              .end(function (err, res) {
                if (err) return cb(err);
                response = res;
                // Remove the sails.sid cookie to emulate expired session
                delete response.headers['set-cookie'][1];
                // Set cookie for the agent (browsers do this automatically)
                agent.saveCookies(response);
                cb();
              });
          });
        });

        it("must respond with a set-cookie header with remember_me cookie", function () {
          response.headers['set-cookie'].some(function (cookie) {
            return ~cookie.indexOf('remember_me');
          }).must.be.true();
        });

        it("must set a cookie that will authenticate subsequent requests", function (done) {
          // Try a new request
          agent
            .get('/api/v1/users/' + response.body.id)
            .end(function (err, getResponse) {
              if (err) return cb(err);
              getResponse.status.must.be(200);
              getResponse.body.must.be.an.object();
              getResponse.body.id.must.equal( response.body.id );
              done();
            });
        });
      });

      after(function (cb) {
        user.destroy(function (err) {
          cb();
        });
      });
    });

    describe("Destroying a session", function() {

      var user, agent, response;

      before(function (cb) {
        var userData = {
          email: "testuser@sails.com",
          password: "test_password",
          passwordConfirmation: "test_password"
        };

        User.create(userData, function (err, newUser) {
          if (err) return cb(err);

          agent = request.agent(sails.config.localAppURL);

          // First, create a new session
          agent.get('/csrfToken').end(function (err, res) {
            if (err) return cb(err);
            
            agent.saveCookies(res);
            var csrfToken = res.body._csrf;

            agent
              .post('/session')
              .send({ email: "testuser@sails.com", password: "test_password", remember: true, _csrf: csrfToken })
              .end(function (err, res) {
                if (err) return cb(err);
                response = res;
                // Set cookie for the agent (browsers do this automatically)
                agent.saveCookies(response);
                // Then, destory the session
                agent
                  .get('/session/destroy')
                  .end(function (err, res) {
                    if(err) return cb(err);
                    response = res;
                    cb();
                  });
              });
          });
        });
      });

      it("must destroy the remember_me cookie", function() {
        response.headers['set-cookie'].some(function (cookie) {
          return ~cookie.indexOf('remember_me=;');
        }).must.be.true();
      });

      it("must destroy the sails session cookie", function() {
        response.headers['set-cookie'].some(function (cookie) {
          return ~cookie.indexOf('sails.sid');
        }).must.not.be.true();
      });
    });
  });

  describe("With API key:", function() {
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

    describe("given a valid API key", function() {
      var response, auth;

      before(function (cb) {
        // Construct HTTP Basic Authentication 'object'
        var credentials = new Buffer( user.apiKey + ':' + user.apiKey ).toString( "base64" );
        auth = "Basic " + credentials;
        // Execute request
        request(sails.config.localAppURL)
          .get('/api/v1/users/' + user.id)
          .set('Authorization', auth)
          .end( function (err, res) {
            if (err) return cb( err );
            response = res;
            cb();
          });      
      });

      it("must respond with status code 200", function() {
        response.status.must.equal( 200 );
      });

      it("must return the requested data", function() {
        response.body.must.be.an.object();
        response.body.must.have.property('email');
        response.body.must.have.property('id');
      });

      it("must bypass the CSRF protection", function (cb) {
        request(sails.config.localAppURL)
          .put('/api/v1/users/' + user.id)
          .send({ firstName: 'Bobby' })
          .set('Authorization', auth)
          .end( function (err, res) {
            if (err) return cb( err );

            res.status.must.equal('200');
            cb();
          }); 
      });
    });

    describe("given an invalid API key", function() {
      var response;

      before(function (cb) {
        // Construct HTTP Basic Authentication 'object'
        var credentials = new Buffer( 'bad_api_key:bad_api_key' ).toString( "base64" );
        var auth = "Basic " + credentials;
        // Execute request
        request(sails.config.localAppURL)
          .get('/api/v1/users/' + user.id)
          .set('Authorization', auth)
          .end( function (err, res) {
            if (err) return cb( err );
            response = res;
            cb();
          });      
      });

      it("must respond with status code 401", function() {
        response.status.must.equal( 401 );
      });
    });

    after(function (cb) {
      user.destroy(function (err) {
        cb();
      });
    });    
  });
});