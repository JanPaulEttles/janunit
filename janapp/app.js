/*
npm install express
npm install body-parser
npm install cookie-parser
npm install node-uuid
*/

var express = require('express');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var uuid = require('node-uuid');

var https = require('https')
var fs = require('fs');


var logger = require('./logger');
var headers = require('./headers');

var head = require('./head');
var foot = require('./foot');

var forms = require('./forms');
var utils = require('./utils');

var sessionmanager = require('./sessionmanager');

var userdatabase = require('./userdatabase');
var notedatabase = require('./notedatabase');

var app = express();
app.set('port', 3000);
//app.use(express.static(__dirname + '/'));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var httpsOptions = {
  key: fs.readFileSync('./ca/server-key.pem'),
  cert: fs.readFileSync('./ca/server-crt.pem'),
  ca: fs.readFileSync('./ca/ca-crt.pem'),
  requestCert: true,
  rejectUnauthorized: false
}

//	crl: fs.readFileSync('./ca/ca-crl.pem'),
//    rejectUnauthorized: true

var server = https.createServer(httpsOptions, app).listen(app.get('port'), () => {
  logger.info('server running on port ' + app.get('port'))
})

/*
* shared by both get and post login
*/
function processLogin(username, password, req, res) {
  logger.info('***** processLogin');

  var user = userdatabase.getUser(username);

  if(user === null) {
    logger.warn('***** processLogin: username NOT found');
  }
  else {
    sessionmanager.login(username, password, user, req, res);
  }
  res.redirect('/');
}


/**
*	https://localhost.ssl:3000/
*/
app.get('/', function(req, res) {
  logger.info('***** home page');

  var content = '<b>YAVA :: Yet Another Vulnerable App</b>';
  content += '<br><br>An application for collaboratiing on notes.';

  sendResponse(req, res, 'Home Page', content);
});

/**
* reset everything - todo
*	https://localhost.ssl:3000/nuke
*/
app.get('/nuke', function(req, res) {
  logger.info('***** get nuke BOOOOOOM!!!');

	sessionmanager.clear(req, res);

  //userdatabase
  //notedatabase

	res.redirect('/');
});


/**
*
*	get request to clear cache, session, cookies and redirect to index.html
*	https://localhost:3000/reset
*
*/
app.get('/reset', function(req, res) {
  logger.info('***** get reset');

	headers.set(res);

	sessionmanager.clear();

	req.session = null;
	res.clearCookie('Session-Token', { path: '/' });

	res.redirect('/');
});


/**
*	https://localhost.ssl:3000/opensesame
*/
app.get('/opensesame', function(req, res) {
  logger.info('***** get login');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(utils.getAllIssues());
});


/**
*	get request to check if the user is authenticated
*	https://localhost:3000/authenticated
*/
app.get('/authenticated', function(req, res) {
  logger.info('***** get authenticated');

  var content = '';
	if(!sessionmanager.isAuthenticated(req)) {
		content += 'You are NOT authenticated';
	}
	else {
    content += 'You are authenticated';
	}
  sendResponse(req, res, 'Authenticated Reponse', content);
});

/**
*	https://localhost.ssl:3000/logout
*/
app.get('/logout', function(req, res) {
  logger.info('***** get logout');

  sessionmanager.logout(req, res);
  res.redirect('/');
});

/**
*	get request to view a user via admin interface
*	https://localhost:3000//admin/user/profile/view
*/
app.get('/admin/user/profile/view', function(req, res) {
  logger.info('***** get admin user profile');

  var user = userdatabase.getUser(req.query.username);

  var content = '';
  content += '<br>username : ' + user.username;
  content += '<br>password : ' + user.password; // + ' || <a href="/changepassword">change</a><br>';
  content += '<br>email : ' + user.email;
  content += '<br>firstname : ' + user.firstname;
  content += '<br>lastname : ' + user.lastname;

  sendResponse(req, res, 'Admin User Profile Reponse', content);
});

/**
*	get request to list all sessions
*	https://localhost:3000/admin/sessions
*/
app.get('/admin/sessions', function(req, res) {
  logger.info('***** get admin sessions');

  var keys = sessionmanager.getSessionTokens();
  var content = '';
  for(var i = 0; i < keys.length; ++i) {
        content += '<br><a href="/admin/session/view?token=' + keys[i] + '">' + keys[i] + '</a>';
  }

  sendResponse(req, res, 'Admin Sessions Reponse', content);

});

/**
*	get request to list all users
*	https://localhost:3000/admin/users
*/
app.get('/admin/users', function(req, res) {
  logger.info('***** get admin users');

  var keys = userdatabase.getUsernames();
  var content = '';
  for(var i = 0; i < keys.length; ++i){
        content += '<br><a href="/admin/user/profile/view?username=' + userdatabase.getUser(keys[i]).username + '">' + userdatabase.getUser(keys[i]).username + '</a>';
  }

  sendResponse(req, res, 'Admin Users Reponse', content);
});

/**
*	get request to display admin stuff
*	https://localhost:3000/authenticated
*/
app.get('/admin', function(req, res) {
  logger.info('***** get admin');

  var content = '';
  content += '<a href="/admin/users">Users</a><br>';
  content += '<a href="/admin/sessions">Sessions</a><br>';

  sendResponse(req, res, 'Admin Reponse', content);
});


/**
*	https://localhost.ssl:3000/login?username=74n&password=password
*/
app.get('/login', function(req, res) {
  logger.trace('***** get login');
	processLogin(req.query.username, req.query.password, req, res);
});

/**
*	https://localhost:3000/login.html
*/
app.post('/login', function(req, res) {
  logger.trace('***** post login');

  if(utils.checkSQLi(req.body.username)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(utils.getSQLiTableDump());
	}
	else {
		processLogin(req.body.username, req.body.password, req, res);
	}
});

/**
*
*	get request to show the user profile --associated with the session token-- from the query string
*	https://localhost:3000/profile
*
*/
app.get('/profile/view', function(req, res) {

  logger.info('***** get profile/view ' + sessionmanager.isAuthenticated(req));

	if(!sessionmanager.isAuthenticated(req)) {
    logger.trace('profile/view: redirecting to homepage');
    res.redirect('/');
	}
  else {
    var user = userdatabase.getUser(req.query.username);

    var content = '';

    if(user !== null) {
      content += '<br>username : ' + user.username;
      content += '<br>';
      content += '<br>password : ' + user.password;
      content += '<br><a href="/changepasswordform?username=' + user.username + '">change</a><br>';

      content += '<br>email : ' + user.email;
      content += '<br>firstname : ' + user.firstname;
      content += '<br>lastname : ' + user.lastname;
      content += '<br><a href="/updateprofileform?username=' + user.username + '">change</a><br>';
    }
    else {
      content += 'User not found';
    }

    sendResponse(req, res, 'View Profile Reponse', content);
  }
});




/**
*
*	get request to show the note
*	https://localhost:3000/profile
*
*/
app.get('/notes/view', function(req, res) {
  logger.info('***** get notes/view ' + sessionmanager.isAuthenticated(req));

	if(!sessionmanager.isAuthenticated(req)) {
    logger.trace('notes/view: redirecting');
    res.redirect('/');
	}
  else {

    var content = '';

    var note = notedatabase.getNote(req.query.note);

    if(note !== null) {
      content += '<br>Title : ' + note.title;
      content += '<br>Note : ' + note.note;
      content += '<br><br><a href="/updatenoteform?note=' + note.id + '">Update</a>';
    }
    else {
      content += 'Note not found';
    }

    sendResponse(req, res, 'View Note Reponse', content);
  }
});


/**
*	get request to list all users
*	https://localhost:3000/notes/list
*/
app.get('/notes/list', function(req, res) {
  logger.info('***** get notes/list ' + sessionmanager.isAuthenticated(req));

	if(!sessionmanager.isAuthenticated(req)) {
    logger.info('notes/list: redirecting');
    res.redirect('/');
	}
  else {
    var keys = notedatabase.getNotes();
    logger.debug('#notes ' + keys.length);
    var content = '';
    content += '<a href="/noteform">Create</a><br><br>';
    for(var i = 0; i < keys.length; ++i){
      content += '<a href="/notes/view?note=' + notedatabase.getNote(keys[i]).id + '">' + notedatabase.getNote(keys[i]).title + '</a><br>';
    }
  }

  sendResponse(req, res, 'Notes List Reponse', content);
});

/**
*
*	parse note form
*	https://localhost:3000/notes/create
*
*/
app.post('/notes/create', function(req, res) {
  logger.info('***** post note');

  if(!sessionmanager.isAuthenticated(req)) {
    logger.info('notes/create: redirecting');
    res.redirect('/');
	}
  else {
    notedatabase.putNote({
            title: req.body.title || null,
            note: req.body.note || null
          });

    var content = '';
    content += '<br><br><div id="content">Title : ' + req.body.title;
    //content += '<br><br><div id="content">Title : ' + req.body.title.replace('>','&gt;').replace('<','&lt;').replace('\\','\\\\');
    content += '<br>Note : ' + req.body.note + '</div>';

    sendResponse(req, res, 'Create Note Reponse', content);
  }
});

/**
*	parse updatenote form
*	https://localhost:3000/notes/update
*/
app.post('/notes/update', function(req, res) {
  logger.info('***** post update note');

  var note = notedatabase.getNote(req.body.id);

  var content = '';
  if(note !== null) {
    note.title = req.body.title;
    note.note = req.body.note;
    notedatabase.updateNote(note);
    content += 'The note has been updated.';
  }
  else {
   content += 'The note could not be found.';
  }

  sendResponse(req, res, 'Update Note Reponse', content);
});


/**
*	parse updateprofile form
*	https://localhost:3000/profile/update
*/
app.post('/profile/update', function(req, res) {
  logger.info('***** post update profile');

  var user = userdatabase.getUser(req.body.username);

  var content = '';
  if(user !== null) {
    user.password = req.body.password;
    user.email = req.body.email;
    user.firstname = req.body.firstname;
    user.lastname = req.body.lastname;
    userdatabase.putUser(user);
    content += 'The user profile has been updated.';
  }
  else {
     content += 'The user could not be found.';
  }
  sendResponse(req, res, 'Update Profile Reponse', content);
});


/**
*
*	parse forgotten password form
*	https://localhost:3000/forgotten.html
*
*/
app.post('/forgotten', function(req, res) {
  logger.info('***** post forgotten');

  var user = userdatabase.getUserByEmail(req.body.email);

  var content = '';
  if(user !== null) {
    content += 'Your password will be sent to: ' + req.body.email;
  }
  else {
    content += 'Email: ' + req.body.email + ' was not found in the database';
  }

  sendResponse(req, res, 'Forgotten Reponse', content);
});

/**
*	parse search form
*	https://localhost:3000/searchform
*/
app.post('/search', function(req, res) {
  logger.info('***** post search');

  var content = 'You searched for: ' + req.body.search;

  sendResponse(req, res, 'Search Reponse', content);
});

/**
*	parse changepassword form
*	https://localhost:3000/changepasswordform
*/
app.post('/changepassword', function(req, res) {
  logger.info('***** post changepassword');

  var user = userdatabase.getUser(req.body.username);

  var content = '';
  if(user !== null) {

    user.password = req.body.password;
    userdatabase.putUser(user);
    content += 'Your password has been changed.';
  }
  else {
     content += 'The user could not be found.';
  }
  sendResponse(req, res, 'Change Password Reponse', content);
});

app.post('/register', function(req, res) {
  logger.info('***** post register');

  var user = {
        	username  : '',
        	password  : '',
        	email     : '',
        	firstname : '',
        	lastname  : ''
  };

  //user.username = req.body.username.replace('>','&gt;').replace('<','&lt;').replace('\\','\\\\');
  user.username = req.body.username;
  user.password = req.body.password;
  user.email = req.body.email;
  user.firstname = req.body.firstname;
  user.lastname = req.body.lastname;

  //var dummyuser = utils.filterXSS(user);

	userdatabase.putUser(user);

  var content = 'User: ' + user.username + ' has been registered.<br>An email has been sent to: ' + user.email + '<br>Please login to continue.';

  sendResponse(req, res, 'Register Resonse', content);
});

function getUserFragment(session, req, res) {

  var header = '<div>';

  if(session.authenticated) {
    header += '<span id="loggedinstate">Logged In As: ' + session.username + '</span> || ';
    header += '<span><a href="/profile/view?username=' + session.username + '">Profile</a></span> || ';
    header += '<span><a href="/notes/list">Notes</a></span> || ';
    header += '<span><a href="/logout">Logout</a></span>';
  }
  else {
    header += '<span id="loggedinstate">Logged In As: Not Logged In</span> || ';
    header += '<span><a href="/loginform">Login</a></span> || ';
    header += '<span><a href="/registerform">Register</a></span> || ';
    header += '<span><a href="/forgottenform">Forgotten</a></span>';
  }
  header += '</div>';
	logger.info("adding user fragment: " + session.username);

  return header;
}






/**
*	https://localhost.ssl:3000/loginform
*/
app.get('/loginform', function(req, res) {
  getForm(req, res, 'Login Form', forms.login);
});


/**
*	https://localhost.ssl:3000/changepasswordform
*/
app.get('/changepasswordform', function(req, res) {
  updateForm(req, res, 'Change Password Form', forms.changepassword, userdatabase.getUser(req.query.username));
});

/**
*	https://localhost.ssl:3000/profileform
*/
app.get('/profileform', function(req, res) {
  getForm(req, res, 'Profile Form', forms.profile);
});

/**
*	https://localhost.ssl:3000/searchform
*/
app.get('/searchform', function(req, res) {
  getForm(req, res, 'Search Form', forms.search);
});

/**
*	https://localhost.ssl:3000/registerform
*/
app.get('/registerform', function(req, res) {
  getForm(req, res, 'Register Form', forms.register);
});

/**
*	https://localhost.ssl:3000/forgottenform
*/
app.get('/forgottenform', function(req, res) {
  getForm(req, res, 'Forgotten Form', forms.forgotten);
});

/**
*	https://localhost.ssl:3000/noteform
*/
app.get('/noteform', function(req, res) {
  getForm(req, res, 'Note Form', forms.note);
});

/**
*	https://localhost.ssl:3000/updatenoteform
*/
app.get('/updatenoteform', function(req, res) {
  updateForm(req, res, 'Update Note Form', forms.updatenote, notedatabase.getNote(req.query.note));
});

/**
*	https://localhost.ssl:3000/updateprofileform
*/
app.get('/updateprofileform', function(req, res) {
  updateForm(req, res, 'Update Profile Form', forms.updateprofile, userdatabase.getUser(req.query.username));
});

function updateForm(req, res, title, form, object) {
  logger.trace('***** fetch form: ' + title);

  sendResponse(req, res, title, form.get(object));
}

function getForm(req, res, title, form) {
  logger.trace('***** fetch form: ' + title);

  sendResponse(req, res, title, form.get());
}

function sendResponse(req, res, title, content) {
  logger.info('***** sendResponse');

  headers.set(res);

  var session = sessionmanager.getSessionFromRequest(req);
  sessionmanager.refresh(session, req, res);

  var response = head.get(title);
  response += getUserFragment(session, req, res);

  response += '<br><br><div id="content">';
  response += content;
  response += '<div>';

  response += foot.get();

  res.send(response);
}

