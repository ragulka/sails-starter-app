var sails = require('sails'),
    must  = require('must'),
    DbServer = require('../node_modules/sails-mongo/node_modules/mongodb').Server,
    Db = require('../node_modules/sails-mongo/node_modules/mongodb').Db;

global.request = require('supertest');
global.localAppURL = null;

function createConnection(config, cb) {
  var safe = config.safe ? 1 : 0;
  var server = new DbServer(config.host, config.port, {native_parser: config.nativeParser, auth: { user: config.user, password: config.password }});
  var db = new Db(config.database, server, {w: safe, native_parser: config.nativeParser});

  db.open(function(err) {
    if (err) return cb(err);
    if (db.serverConfig.options.auth.user && db.serverConfig.options.auth.password) {
      return db.authenticate(db.serverConfig.options.auth.user, db.serverConfig.options.auth.password, function(err, success) {
        if (success) return cb(null, db);
        if (db) db.close();
        return cb(err ? err : new Error('Could not authenticate user ' + auth[0]), null);
      });
    }

    return cb(null, db);
  });
}

function dropDb(cb) {
  createConnection( sails.config.adapters.mongo, function (err, db) {
    db.dropDatabase(function () {
      cb();
    });
  });
}

before(function (done) {
  this.timeout(10000);
  sails.lift({ port: 7357 }, function (err, sails) {
    dropDb(function() {

      // Check if tests run on SSL
      var usingSSL = (
        (
          sails.config.serverOptions && 
          sails.config.serverOptions.key &&
          sails.config.serverOptions.cert
        ) || (
          sails.config.express && 
          sails.config.express.serverOptions && 
          sails.config.express.serverOptions.key && 
          sails.config.express.serverOptions.cert 
        )
      );

      // Compose the local app url
      localAppURL = ( usingSSL ? 'https' : 'http' ) + '://' + sails.config.host + ':' + sails.config.port + '';

      // All done, we con now run tests!
      done();
    });
  });
});

after(function (done) {
  sails.lower(function() {
    dropDb(function() {
      done();
    });
  });
});