var express = require('express');
var config = require('../config');
var router = express.Router();
var createError = require('http-errors');
var request = require('request');




/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/submit', function(req, res, next) {
  var formId = req.body.form_id;
  var submissionUuid = req.body.uuid;

  if(!formId || !submissionUuid){
    console.log('here');
    next(createError(500));
    return;
  }

  var formXmlPath = '/www/formXml?formId='+formId;
  var submissionDataPath = '/view/downloadSubmission?formId='+ formId + encodeURIComponent('[@version=null]') + 
    '/data' + encodeURIComponent('[@key='+ submissionUuid +']');

  request.get(getServerOption(formXmlPath), function(error, response, body){
    result = "";
    if (!error && response.statusCode == 200){
      result = body;

      request.get(getServerOption(submissionDataPath), function(error, response, body){
        if (!error && response.statusCode == 200){
          result += body;

          res.send(result);
          return;
        }

      });
    }
  });
});

function getServerOption(path){
  return options = {
    'url': config.odk_server_url + path,
    'auth': {
        'user': config.odk_username,
        'pass': config.odk_password,
        'sendImmediately': false
    }
  };
}

module.exports = router;
