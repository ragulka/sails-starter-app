/**
 * Kue job queue holder
 *
 * Queue will be loaded into this object in bootstrap.js
 */
module.exports = {

  _processors: {

    
    /**
     * Send password reset email
     */

    sendPasswordResetEmail: function(job, cb) {
      if (!job.data.user) return cb( new Error("User not provided") );

      var user = new User._model(job.data.user);
      user.sendPasswordResetEmail(function (err, res, msg) {
        cb(err, res, msg);
      });
    }

  }

}