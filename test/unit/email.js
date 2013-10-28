var demand = require("must");

describe("Email Model:", function() {

  describe("Validation", function() {

    describe("given valid data", function() {
      it("must not return any errors", function() {
        var email = new Email._model({
          from: {
            name: "Jon Dude",
            email: "dudejon@duuuuuude.com"
          },
          to: {
            name: "Jon Doe",
            email: "jon@doe.com"
          },
          template: 'password-reset'
        });

        email.validate(function (err) {
          demand(err).not.to.exist();
        });
      });

      it("must set the default sender, if from was not provided", function() {
        var email = new Email._model({
          to: {
            name: "Jon Doe",
            email: "jon@doe.com"
          },
          template: 'password-reset'
        });

        email.validate(function (err) {
          demand(err).not.to.exist();
          email.must.have.property('from');
          email.from.name.must.equal(sails.config.mail.from.name);
          email.from.email.must.equal(sails.config.mail.from.email);          
        });
      });

      it("must accept an array of recipients", function() {
        var email = new Email._model({
          to: [
            {
              name: "Jon Doe",
              email: "jon@doe.com"
            },
            {
              name: "Jean D'Ark",
              email: "jeandark@gmai.com"
            }
          ],
          template: 'password-reset'
        });

        email.validate(function (err) {
          demand(err).not.to.exist();       
        });
      });
    });

    describe("given invalid data with missing recipient", function() {
      it("must not return an error", function() {

        var email = new Email._model({
          template: 'password-reset'
        });

        email.validate(function (err) {
          err.must.exist();
        });

      });
    });

    describe("given invalid data with invald recipients", function() {
      it("must not return an error", function() {

        var email = new Email._model({
          to: [
            { name: "Recipient 1" },
            { name: "Recipient 2", email: "recipient2@sails.com" },
          ],
          template: 'password-reset'
        });

        email.validate(function (err) {
          err.must.exist();
        });

      });
    });

  });

  describe(".send()", function() {
    describe("given a valid email instance", function() {
      var email, response, message, error;

      before(function (cb) {
        email = new Email._model({
          from: {
            name: "Jon Dude",
            email: "dudejon@duuuuuude.com"
          },
          to: {
            name: "Jon Doe",
            email: "jon@doe.com"
          },
          data: {
            resetURL: 'http://sliptree.com'
          },
          template: 'password-reset'
        });

        email.send(function (err, res, msg) {
          error = err;
          response = res;
          message = msg;
          cb();
        });
      });

      it("must send the email successfully", function() {
        demand(error).not.to.exist();
        response.must.have.property('message');
        response.message.must.equal('250 Message accepted');
        response.failedRecipients.must.be.empty;
      });

      it("must return the composed message", function() {
        message.must.be.an.object();
      });

    });
  });

});