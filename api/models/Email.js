/**
 * Email
 *
 * @module      :: Model
 * @description :: This is the email model.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var sails = require("sails");
var _ = require("lodash");

module.exports = {

  attributes: {
    
    from: {
      type: 'json',
      required: true,
      defaultsTo: {
        name: sails.config.mail.from.name,
        email: sails.config.mail.from.email
      }
    },

    to: {
      type: 'json',
      required: true
    },

    subject: {
      type: 'string'
    },

    body: {
      type: 'text'
    },

    attachments: {
      type: 'array'
    },

    // Data used in template
    data: {
      type: 'json'
    },

    // Template for this email
    template: {
      type: 'string',
      required: true
    },

    // Mandrill-specific tags (X-MC-Tags) for this email
    // http://help.mandrill.com/entries/21688056-Using-SMTP-Headers-to-customize-your-messages
    tags: {
      type: 'array',
      defaultsTo: ['transactional']
    },

    /**
     * Set default values if available
     *
     * Funcionality taken from waterline, hopefully a setDefaults instance method will be
     * available in future releases, so we can remove this from the model definition.
     */    

    setDefaults: function() {
      for(var key in Email.attributes) {
        if(this[key] === undefined && Email.attributes[key].hasOwnProperty('defaultsTo')) {
          this[key] = _.clone(Email.attributes[key].defaultsTo);
        }
      }
    },

    /**
     * Validate email based on current values
     *
     * Funcionality taken from waterline, hopefully a validate instance method will be
     * available in future releases, so we can remove this from the model definition.
     */

    validate: function(cb) {
      // Set Default Values if available
      this.setDefaults();

      var values = this.toObject();

      async.series([

        // Run Before Validate Lifecycle Callbacks
        function(cb) {
          var runner = function(item, callback) {
            item(values, function(err) {
              if(err) return callback(err);
              callback();
            });
          };

          async.eachSeries(Email._callbacks.beforeValidation, runner, function(err) {
            if(err) return cb(err);
            cb();
          });
        },

        // Run Validation
        function(cb) {
          Email._validator.validate(values, function(err) {
            if(err) return cb(err);
            cb();
          });
        },

        // Run After Validate Lifecycle Callbacks
        function(cb) {
          var runner = function(item, callback) {
            item(values, function(err) {
              if(err) return callback(err);
              callback();
            });
          };

          async.eachSeries(Email._callbacks.afterValidation, runner, function(err) {
            if(err) return cb(err);
            cb();
          });
        }

      ], function (err) {
        cb(err);
      });
    },

    /**
     * Send email using mailer service
     */

    send: function(cb) {
      var self = this;
      Mailer.template( this.template, this.data, function (err, html, text) {
        if (err) return cb(err);

        // Compose the message
        var message = {
          from: self.from.name + ' <' + self.from.email + '>',
          subject: self.subject,
          attachments: self.attachments,
          generateTextFromHTML: true,
          html: html,
          text: text
        };

        // Attach tags
        if (self.tags) {
          message.headers = {
            'X-MC-Tags': self.tags.join()
          }
        }

        // Attach recipients
        var recipients = [];

        if (!_.isArray(self.to)) {
          self.to = [self.to];
        }

        self.to.forEach(function (recipient) {
          recipients.push( recipient.name + ' <' + recipient.email + '>' );
        });

        message.to = recipients.join();

        // Send mail
        Mailer.sendMail(message, function (err, result) {
          if(err) return cb(err);
          cb(null, result, message);
        });
      });
    }
    
  },


  /**
   * These functions run before the email message is validated
   */

  beforeValidation: [

    /**
     * Check that there is at least one valid recipient
     */

    function (values, cb) {
      if (!values.to || _.isEmpty(values.to)) return cb(new Error("Please provide at least one recipient"));

      // Convert recipient object to array if an object
      // was supplied instead of an array
      if (!_.isArray(values.to)) {
        values.to = [values.to];
      }

      // Validate each recipient
      values.to.forEach(function (recipient, i) {
        Recipient._validator.validate(recipient, function (err) {
          if(err) return cb(err);
        });
      });

      cb();
    }
  ],

};
