'use strict';

const winston = require('winston');

let config = {};

config.TC = {};
config.TC.USERNAME=process.env.TC_USERNAME;
config.TC.PASSWORD=process.env.TC_PASSWORD;
config.TC.AUTHN_URL = process.env.TC_AUTHN_URL || 'https://topcoder.auth0.com/oauth/ro';
config.TC.AUTHZ_URL = process.env.TC_AUTHZ_URL || 'https://api.topcoder.com/v3/authorizations';
config.TC.CLIENT_ID = process.env.TC_CLIENT_ID || '6ZwZEUo2ZK4c50aLPpgupeg5v2Ffxp9P';
config.CLIENT_V2CONNECTION = process.env.CLIENT_V2CONNECTION || 'LDAP';

config.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
config.LOG_FILE = process.env.LOG_FILE || 'app.log';

config.logger = new(winston.Logger)({
    level: config.LOG_LEVEL,
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({
            filename: config.LOG_FILE
        })
    ]
});

module.exports = config;
