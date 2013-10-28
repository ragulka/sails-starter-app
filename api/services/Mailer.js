/**
 * Node Mailer service and setup
 */

var sails = require("sails"),
    nodemailer = require("nodemailer");

module.exports = nodemailer.createTransport( "SMTP", {
  host: sails.config.smtp.host,
  secureConnection: sails.config.smtp.ssl,
  port: sails.config.smtp.port,
  auth: {
    user: sails.config.smtp.user,
    pass: sails.config.smtp.pass
  }
});
