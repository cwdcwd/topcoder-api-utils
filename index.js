const config=require('config');
const logger = config.logger;
const tc_api_projects=require('@lazybaer/topcoder-api-projects');
const TCAuth = require('./TCAuth');

let tca = new TCAuth(config.TC, logger);

tca.login(config.TC.USERNAME,config.TC.PASSWORD, function(err, accessToken) {
  let defaultClient = tc_api_projects.ApiClient.instance;

  // Configure API key authorization: bearer
  var bearer = defaultClient.authentications['bearer'];
  bearer.apiKey = accessToken;
  // Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
  bearer.apiKeyPrefix = 'Bearer';

  var apiInstance = new tc_api_projects.DefaultApi();

  var callback = function(error, data, response) {
    if (error) {
      console.error(error);
    } else {
      console.log('API called successfully. Returned data: ', data);
    }
  };
  apiInstance.directProjectsUserGet(callback);
});
