describe("Sessions:", function() {
  describe("Accessing a protected route with no session", function() {
    var response;

    before(function (cb) {
      request(localAppURL)
        .get('/api/v1/users')
        .end(function (err, res) {
          if(err) cb(err);
          response = res;
          cb();
        });
    });

    it("should respond with status 401", function() {
      response.status.must.be(401);
    });

    it("should respond with an error", function() {
      response.body.must.have.property('status');
    });
  });

  describe("Creating a new session", function() {
    
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

    describe("given a correct username and password", function() {
      var response, agent;

      before(function (cb) {
        agent = request.agent(localAppURL);

        agent.get('/csrfToken').end(function (err, res) {
          if(err) cb(err);

          agent.saveCookies(res);
          var csrfToken = res.body._csrf;

          agent
            .post('/session')
            .send({ email: "testuser@sails.com", password: "test_password", _csrf: csrfToken })
            .end(function (err, res) {
              if (err) cb(err);
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

      it("must respond with the user's data as json", function () {
        response.body.must.be.an.object();
        response.body.must.have.property('email');
        response.body.must.have.property('id');
      });

      it("must set a cookie that will authenticate subsequent requests", function (done) {
        // Try a new request
        agent
          .get('/api/v1/users/' + response.body.id)
          .end(function (err, getResponse) {
            if (err) cb(err);
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
        agent = request.agent(localAppURL);

        agent.get('/csrfToken').end(function (err, res) {
          if(err) cb(err);

          agent.saveCookies(res);
          var csrfToken = res.body._csrf;
          
          agent
            .post('/session')
            .send({ email: "idontexist", password: "test_password", _csrf: csrfToken })
            .end(function (err, res) {
              if (err) cb(err);
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
        response.body.must.have.property('err');
      });
    });

    describe("given incorrect username", function() {
      var response, agent;

      before(function (cb) {
        agent = request.agent(localAppURL);

        agent.get('/csrfToken').end(function (err, res) {
          if(err) cb(err);

          agent.saveCookies(res);
          var csrfToken = res.body._csrf;        

          agent
            .post('/session')
            .send({ email: "testuser@sails.com", password: "wrong_password", _csrf: csrfToken })
            .end(function (err, res) {
              if (err) cb(err);
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
        response.body.must.have.property('err');
      });
    });

    describe("with remember me option specified", function() {
      var response, agent;

      before(function (cb) {
        agent = request.agent(localAppURL);
        
        agent.get('/csrfToken').end(function (err, res) {
          if(err) cb(err);

          agent.saveCookies(res);
          var csrfToken = res.body._csrf;        

          agent
            .post('/session')
            .send({ email: "testuser@sails.com", password: "test_password", remember: true, _csrf: csrfToken })
            .end(function (err, res) {
              if (err) cb(err);
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
            if (err) cb(err);
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
        if (err) cb(err);

        agent = request.agent(localAppURL);

        // First, create a new session
        agent.get('/csrfToken').end(function (err, res) {
          if(err) cb(err);
          
          agent.saveCookies(res);
          var csrfToken = res.body._csrf;

          agent
            .post('/session')
            .send({ email: "testuser@sails.com", password: "test_password", remember: true, _csrf: csrfToken })
            .end(function (err, res) {
              if (err) cb(err);
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

    it("should destroy the remember_me cookie", function() {
      response.headers['set-cookie'].some(function (cookie) {
        return ~cookie.indexOf('remember_me=;');
      }).must.be.true();
    });

    it("should destroy the sails session cookie", function() {
      response.headers['set-cookie'].some(function (cookie) {
        return ~cookie.indexOf('sails.sid');
      }).must.not.be.true();
    });

  });
});