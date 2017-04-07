'use strict';
const _=require('lodash');
const config=require('config');
const logger = config.logger;
const jwtDecode = require('jwt-decode');
const tc_api_projects=require('topcoder-api-projects');
const tc_api_challenges=require('topcoder-api-challenges');

const TCAuth = require('./TCAuth');

const ROLE_MANAGER = '13'; //CWD-- TODO: replace this magic number with an API call for roles

let tca = new TCAuth(config.TC, logger);

tca.login(config.TC.USERNAME,config.TC.PASSWORD, function(err, accessToken) {
  let projectsClient = tc_api_projects.ApiClient.instance;
  let challengesClient=tc_api_challenges.ApiClient.instance;
  let bearer = projectsClient.authentications['bearer'];

  bearer.apiKey = accessToken;
  bearer.apiKeyPrefix = 'Bearer';
  challengesClient.authentications['bearer']=bearer; //CWD-- set the bearer for challenge client as well

  let jwt=jwtDecode(accessToken);
  let uid=_.get(jwt,'userId',''); //CWD-- extract user Id from the jwt

  let projectsAPIInstance = new tc_api_projects.DefaultApi();
  let challengesAPIInstance = new tc_api_challenges.DefaultApi();

  let cbProjectsHandler = function(error, data, response) {
    if (error) {
      let errmsg=_.get(resp.body,'result.content','');
      logger.error(`failed to call projects API. ${errmsg}`);
    } else {
      logger.info('Projects API called successfully. ');

      if(_.get(data,'result.success',false)) { //CWD-- success ?
        let aProjects=_.get(data,'result.content',[]);

        _.forEach(aProjects,(o,i) => { //CWD-- loop the projects
          let opts={
            filter: `projectId=${o.id}` //CWD-- filter on project Id
          };

          logger.info(`fetching challenges for ${o.customerName}/${o.name}`)
          challengesAPIInstance.challengesGet(opts, (err, data, response) => { //CWD-- fetch the challenges

            if(err) {
              logger.error(err);
            } else {
              if(_.get(data,'result.success',false)){ //CWD-- success?
                let aChallenges=_.get(data,'result.content',[]); //CWD-- grab the challenges

                _.forEach(aChallenges,(oChallenge,iChallenge) => { //CWD-- loop the challenges
                  logger.info(`Setting manager for ${oChallenge.name}`);
                  let body = new tc_api_challenges.AddResourceBody(ROLE_MANAGER, uid);
                  challengesAPIInstance.challengesIdResourcesPost(oChallenge.id, body, (err, data, resp) => { //CWD-- add manager role for user
                    if(err){
                      let errmsg=_.get(resp.body,'result.content','');
                      logger.error(`failed to updated manager for ${oChallenge.id}. ${errmsg}`);
                    } else {
                      logger.info(`updated manager for ${oChallenge.id}`);
                    }
                  });
                });
              } else {
                logger.error('some sorta challenge API error')
              }
            }
          });
        });
      } else {
        logger.error('some sorta projects API error');
      }
    }
  };

  projectsAPIInstance.directProjectsUserGet(cbProjectsHandler);
});
