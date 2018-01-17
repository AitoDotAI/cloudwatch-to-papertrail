var zlib = require('zlib');
var winston = require('winston');
var papertrailTransport = require('winston-papertrail').Papertrail;
var config = require('./env.json');

exports.handler = function (event, context, cb) {
  context.callbackWaitsForEmptyEventLoop = config.waitForFlush;

  var payload = new Buffer(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function (err, result) {
    if (err) {
      return cb(err);
    }

    var log = new (winston.Logger)({
      transports: []
    });

    log.add(papertrailTransport, {
      host: config.host,
      port: config.port,
      program: config.program,
      hostname: config.appname,
      flushOnClose: true,
      logFormat: function (level, message) {
        return message;
      }
    });

    var data = JSON.parse(result.toString('utf8'));

    data.logEvents.forEach(function (line) {
      log.info(line.message);
    });

    log.close();
    return cb();

  });
};
