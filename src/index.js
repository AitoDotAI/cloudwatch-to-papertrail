/**
 * AWS Lambda function to send a CloudWatch log group stream to Papertrail.
 *
 * @author Apiary Inc.
 * @author Tim Malone <tim@timmalone.id.au>
 *
 * Original sources at:        https://github.com/tdmalone/cloudwatch-to-papertrail.git
 * Local, forked version at:   git@github.com:AitoDotAI/cloudwatch-to-papertrail.git
 *
 * Changelog:
 * * 2021-01-04:
 *   - Changed to build using webpack
 *   - Rely on stanard eslint config, rather than custom config (from dependency)
 *   - Upgraded dependencies
 *   - Config handling to rely on env variables rather than config file
 */

'use strict';

const zlib = require( 'zlib' ),
      winston = require( 'winston' ),
      papertrailTransport = require('winston-papertrail').Papertrail;

function getConfig() {
  const papertrailHost = process.env.PAPERTRAIL_HOST
  const papertrailPort = process.env.PAPERTRAIL_PORT
  const lambdaName     = process.env.PAPERTRAIL_LAMBDA_NAME
  const logGroup       = process.env.PAPERTRAIL_LOG_GROUP

  return {
    papertrailHost,
    papertrailPort,
    lambdaName,
    logGroup
  }
}

exports.handler = ( event, context, callback ) => {
  const config = getConfig()

  context.callbackWaitsForEmptyEventLoop = config.waitForFlush;

  const payload = Buffer.from( event.awslogs.data, 'base64' );

  zlib.gunzip( payload, ( error, result ) => {
    if ( error ) return callback( error );

    const log = new winston.Logger({
      transports: []
    });

    const data = JSON.parse( result.toString( 'utf8' ) );

    if ( config.debug ) console.log( data );

    log.add( papertrailTransport, {

      host:         config.papertrailHost,
      port:         config.papertrailPort,
      hostname:     config.lambdaName || 'aito-core',
      program:      data.logGroup || config.logGroup || 'aito-core',
      flushOnClose: true,

      logFormat: ( level, message ) => {
        return message;
      }

    });

    data.logEvents.forEach( ( line ) => {
      if ( config.debug ) console.log( line.message );
      log.info( line.message );
    });

    log.close();
    return callback( null, 'Logged ' + data.logEvents.length + ' lines to Papertrail.' );

  }); // Gunzip.
}; // Exports.handler.
