'use strict';
const _ = require('lodash');
const util = require('util')
const config = require('config');
const moment = require('moment');
const logger = config.logger;
const jwtDecode = require('jwt-decode');
const tc_api_projects=require('topcoder-api-projects');
const tc_api_challenges=require('topcoder-api-challenges');

const TCAuth = require('./TCAuth');

let tca = new TCAuth(config.TC, logger);

tca.login(config.TC.USERNAME,config.TC.PASSWORD, function(loginError, accessToken) {
  if(loginError) {
    //console.error(util.inspect(loginError, {showHidden: false, depth: null}));
    console.log(_.get(loginError,'error_description', loginError));
    return loginError;
  }

  console.log(`received accessToken: ${accessToken}`);
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

//  projectsAPIInstance
//  challengesAPIInstance

  const projectPayload = {
    projectName: 'cwd test '+new Date(),
//    projectDescription: 'cwd test 01 desc',
//    billingAccountId: -1
  };
  const projectBody = new tc_api_projects.ProjectRequestBody.constructFromObject(projectPayload); // ProjectRequestBody |

  const projectCB = function(projectError, projectData, challengeResponse) {
    if (projectError) {
      console.error(util.inspect(projectError, {showHidden: false, depth: null}));
    } else {
      console.log(util.inspect(projectData, {showHidden: false, depth: null}));
      const start = new Date();
      const startTime = moment(start).toISOString();
      const end = moment(start).add(7, 'days').toISOString()
      const reqs = 'these are the requirements';
      const guidelines = 'these are the guidelines';

      const challengePayload = {
        milestoneId: 1,
        subTrack: 'FIRST_2_FINISH',
        reviewType: 'COMMUNITY',
        technologies: [],
        platforms: [],
        finalDeliverableTypes: [],
        confidentialityType: 'PUBLIC',
        name: 'cwd test challenge '+new Date(),
        projectId: _.get(projectData,'result.content.projectId'),
        registrationStartDate: start,
        registrationStartsAt: startTime,
        registrationEndsAt: end,
        submissionEndsAt: end,
        detailedRequirements: reqs,
        submissionGuidelines: guidelines,
        prizes: [10]
      };

      var challengeBody = new tc_api_challenges.NewChallengeBodyParam.constructFromObject({ param: challengePayload});
console.error(util.inspect(challengePayload, {showHidden: false, depth: null}));
      var challengeCB = function(challengeError, challengeData, projectResponse) {
        if (challengeError) {
          console.error(util.inspect(challengeError, {showHidden: false, depth: null}));
        } else {
          console.log(util.inspect(challengeData, {showHidden: false, depth: null}));
        }
      };

      challengesAPIInstance.saveDraftContest(challengeBody, challengeCB);
    }
  };

  console.log('calling out to projects API');
  console.log(projectsAPIInstance);
  projectsAPIInstance.directProjectsPost(projectBody, projectCB);
});
