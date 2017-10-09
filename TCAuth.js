'use strict';

let _ = require('lodash');
let requestPromise = require('request-promise');

function TCAuth(config, logger) {
    var self = this;
    self.logger = logger;
    self.config = config;
}

TCAuth.prototype.login = function login(username, password, cb) {
    var self = this;
    self.logger.info('logging in user: %s', username);
    var self = this;

    let v2TokenBody = {
        username: username,
        password: password,
        client_id: self.config.CLIENT_ID,
        sso: false,
        scope: 'openid profile offline_access',
        response_type: 'token',
        connection: self.config.CLIENT_V2CONNECTION || 'LDAP',
        grant_type: 'password',
        device: 'Browser'
    }

    self.logger.debug('token request: %j', v2TokenBody);

    let reqOpts = {
        method: 'POST',
        uri: self.config.AUTHN_URL,
        json: true,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json'
        },
        body: v2TokenBody
    };

    requestPromise(reqOpts).then(function(res) {
        self.logger.debug('v2 token: %j', res);
        self.fetchV3Token(res, cb);
    }).catch(function(err) {
        self.logger.error('error while requesting login: ', err);
        cb(err);
    });
};

TCAuth.prototype.fetchV3Token = function fetchV3Token(v2Token, cb) {
    var self = this;
    self.logger.info('exchanging v2Token for v3Token');
    self.logger.debug('v2Token: %j', v2Token);
    var self = this;
    let v2IdToken = _.get(v2Token, 'id_token', '');

    let v3ReqBody = {
        param: {
            externalToken: v2IdToken,
            refreshToken: _.get(v2Token, 'refresh_token', '')
        }
    };

    let reqOpts = {
        method: 'POST',
        uri: self.config.AUTHZ_URL,
        headers: {
            'cache-control': 'no-cache',
            'authorization': 'Bearer ' + v2IdToken,
            'content-type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify(v3ReqBody)
    };

    requestPromise(reqOpts).then(function(body) {
        let tcJSON = JSON.parse(body);
        self.logger.info('received v3 token');
        self.logger.debug(tcJSON);
        let token=_.get(tcJSON, 'result.content.token', '');
        cb(null, token);
    }).catch(function(err) {
        self.logger.error('An error occured while requesting a v3 token: %j', err);
        cb(err);
    });
};


module.exports = TCAuth;
