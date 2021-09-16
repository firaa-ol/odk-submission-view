var express = require('express');
var config = require('../config');
var router = express.Router();
var createError = require('http-errors');
var request = require('request');
var transformer = require('enketo-transformer');
var libxmljs = require("libxmljs");



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/file/:encodedUrl/:filename', function(req, res, next) {
  var encodedUrl = req.params.encodedUrl;
  if(encodedUrl){
    var decodedUrl = Buffer.from(encodedUrl, 'base64').toString('ascii');
    var option = getServerOption(decodedUrl);
    option.encoding = null;
    request.get(option, async function(error, response, body){
      res.set('Content-Type',  "application/octet-stream");
      res.set('Content-Disposition', "attachment; filename="+ req.params.filename);
      res.send(body);
    });
  }
});

router.post('/submit', function(req, res, next) {
  var formId = req.body.form_id;
  var submissionUuid = req.body.uuid;
  var formData = '';
  var submissionData = '';
  var transformationResult = null;

  if(!formId || !submissionUuid){
    next(createError(500));
    return;
  }

  var formXmlPath = config.odk_server_url + '/www/formXml?formId='+formId;

  request.get(getServerOption(formXmlPath), async function(error, response, body){
    
    if (!error && response.statusCode == 200){
      formData = body;
      
      transformationResult = await transformer.transform({xform : formData});
      var modelDoc = libxmljs.parseXmlString(transformationResult.model); 
      var rootDataTagName = modelDoc.get("//*[@id='"+ formId+"']").name();

      var submissionDataPath = config.odk_server_url + '/view/downloadSubmission?formId='+ formId + encodeURIComponent('[@version=null]') + 
      '/' + rootDataTagName + encodeURIComponent('[@key='+ submissionUuid +']');

      request.get(getServerOption(submissionDataPath), function(error, response, body){
        if (!error && response.statusCode == 200){
          submissionData = body;
          var parsedSubmission = parseSubmission(submissionData, formId, req.protocol + '://' + req.get('host'));
        
          res.render('form-view', { odkData : {
            form: transformationResult.form.replace(/(\r\n|\n|\r)/gm, ""),
            model: transformationResult.model.replace(/(\r\n|\n|\r)/gm, ""),
            instance: parsedSubmission.replace(/(\r\n|\n|\r)/gm, "")
          }});
          
        } else {
          res.status(400);
          if(error){
            res.render('app_error', {message : error.message});
          } else {
            var error_message = '';
            switch(response.statusCode){
              case 401:
                error_message = 'Invalid Username or Password used for the ODK Server';
                break;
              case 500:
                error_message = 'Invalid submission uuid';
                break;
            }
            res.render('app_error', {message : error_message});
          }
        }

      });
    } else {    
      res.status(400);
      if(error){
        console.log(error);
        res.render('app_error', {message : error.message});
      } else {
        var error_message = '';
        switch(response.statusCode){
          case 401:
            error_message = 'Invalid Username or Password used for the ODK Server';
            break;
          case 404:
            error_message = 'Invalid Form Id';
            break;
        }
        res.render('app_error', {message : error_message});
      }     
    }
  });
});

function getServerOption(path){
  return options = {
    'url': path,
    'auth': {
        'user': config.odk_username,
        'pass': config.odk_password,
        'sendImmediately': false
    }
  };
}

function parseSubmission(data, formId, serverUrl){
  var xmlDoc = libxmljs.parseXmlString(data);
  var dataElt = xmlDoc.get("//*[@id='"+ formId+"']");
  // enketo-core will not parse the xml if these attributes are not set
  dataElt.attr("xmlns", "http://opendatakit.org/submissions");
  dataElt.attr("xmlns:orx", "http://openrosa.org/xforms");
  var mediaFileElts = xmlDoc.find("//*[name()='mediaFile']");
  for(var i= 0; i < mediaFileElts.length; i++){
    var fileNameElt = mediaFileElts[i].childNodes().find(c => c.name() == 'filename');
    var matchingTags = dataElt.find("//*[text()='"+ fileNameElt.text() +"']");

    for(var j=0; j < matchingTags.length; j++){
      var fileUrl = mediaFileElts[i].childNodes().find(c => c.name() == 'downloadUrl').text();
      matchingTags[j] = matchingTags[j].text(serverUrl + "/file/"+ Buffer.from(fileUrl).toString('base64') 
          + "/" + fileNameElt.text());
    }

  }
  return dataElt.toString();
}

module.exports = router;
