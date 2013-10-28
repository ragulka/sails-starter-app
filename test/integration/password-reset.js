var _     = require('lodash'),
    async = require('async'),
    Job   = require('kue').Job;

describe("Password reset:", function() {

  describe("Requesting a password reset", function() {
    var user, agent, csrfToken;

    before(function (cb) {
      var userData = {
        email: "testuser@sails.com",
        password: "test_password",
        passwordConfirmation: "test_password"
      };

      User.create(userData, function (err, newUser) {
        if (err) return cb(err);
        user = newUser;

        agent = request.agent(sails.config.localAppURL);
        agent.get('/csrfToken').end(function (err, res) {
          if(err) return cb(err);
          
          agent.saveCookies(res);
          csrfToken = res.body._csrf;
          cb();
        });
      });
    });

    describe("given no user email", function() {
      var response;

      before(function (cb) {
        agent
          .post('/password-reset')
          .send({ _csrf: csrfToken })
          .end(function (err, res) {
            if (err) return cb(err);
            response = res;          
            cb();
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

    describe("given invalid user email", function() {
      var response;

      before(function (cb) {
        agent
          .post('/password-reset')
          .send({ email: 'not_real', _csrf: csrfToken })
          .end(function (err, res) {
            if (err) return cb(err);
            response = res;          
            cb();
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

    describe("given a valid user email", function() {
      var response;

      before(function (cb) {
        this.timeout(10000);

        agent
          .post('/password-reset')
          .send({ email: user.email, _csrf: csrfToken })
          .end(function (err, res) {
            if (err) return cb(err);
            response = res;          
            cb();
          });
      });

      it("must respond with status 400", function () {
        response.status.must.be(200);
      });

      it("must respond with an info message", function () {
        response.body.must.be.an.object();
        response.body.must.have.property('info');
      });

      it("must queue a password reset email to be sent", function (cb) {
        Job.rangeByType('sendPasswordResetEmail', 'inactive', 0, -1, null, function (err, jobs) {
          if(err) return cb( err );
          _.find( jobs, function (job) {
            return job.data.user.email == user.email;
          }).must.have.property('data');
          cb();
        });
      });
    });

    after(function (cb){
      user.destroy(function (err) {
        if (err) return cb(err);
        // Remove the job
        Job.rangeByType('sendPasswordResetEmail', 'inactive', 0, -1, null, function (err, jobs) {
          if(err) return cb(err);
          var removeJobs = [];
          jobs.forEach( function (job) {
            removeJobs.push( function (cb) {
              job.remove( function (err) {
                cb(err);
              });
            });
          });
          async.auto( removeJobs, function (err) {
            cb();
          });
        });
      });
    });
  });

  describe("Resetting a password", function() {
    var user, agent, csrfToken;

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
          if(err) return cb(err);

          agent = request.agent(sails.config.localAppURL);
          agent.get('/csrfToken').end(function (err, res) {
            if(err) return cb(err);
            
            agent.saveCookies(res);
            csrfToken = res.body._csrf;
            cb();
          });
        });

      });
    });

    describe("with no token", function() {
      var response;

      before(function (cb) {
        this.timeout(3000);

        agent
          .put('/password-reset/' + user.id)
          .send({ _csrf: csrfToken })
          .end(function (err, res) {
            if (err) return cb(err);
            response = res;          
            cb();
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

    describe("with an invalid token", function() {
      var response;

      before(function (cb) {
        this.timeout(3000);

        agent
          .put('/password-reset/' + user.id)
          .send({ token: 'not_really_valid', _csrf: csrfToken })
          .end(function (err, res) {
            if (err) return cb(err);
            response = res;          
            cb();
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

    describe("with a valid token, but no new password", function() {
      var response;

      before(function (cb) {
        this.timeout(3000);

        agent
          .put('/password-reset/' + user.id)
          .send({ token: user.passwordResetToken.value, _csrf: csrfToken })
          .end(function (err, res) {
            if (err) return cb(err);
            response = res;          
            cb();
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

    describe("with a valid token, but with new password and confirmation not matching", function() {
      var response;

      before(function (cb) {
        this.timeout(3000);

        agent
          .put('/password-reset/' + user.id)
          .send({
            token: user.passwordResetToken.value,
            password: 'new_password',
            passwordConfirmation: 'newer_password',
            _csrf: csrfToken
          })
          .end(function (err, res) {
            if (err) return cb(err);
            response = res;          
            cb();
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

    describe("with a valid token and password and confirmation matching", function() {
      var response;

      before(function (cb) {
        this.timeout(3000);

        agent
          .put('/password-reset/' + user.id)
          .send({
            token: user.passwordResetToken.value,
            password: 'new_password',
            passwordConfirmation: 'new_password',
            _csrf: csrfToken
          })
          .end(function (err, res) {
            if (err) return cb(err);
            response = res;          
            cb();
          });
      });

      it("must respond with status 200", function () {
        response.status.must.be(200);
      });

      it("must respond with the user object", function () {
        response.body.must.be.an.object();
        response.body.must.have.property('id');
        response.body.id.must.equal(user.id);
      });      
    });

    after(function (cb){
      user.destroy(function (err) {
        cb(err);
      });
    });
  });
});