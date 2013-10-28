/**
 * Recipient
 *
 * @module      :: Model
 * @description :: This model is only used by the email model to validate a recipient.
 *                 It should not be used on its own or persisted to database.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
  
    name: {
      type: 'string'
    },

    email: {
      type: 'email',
      required: true
    }  
    
  }

};
