

var searchform = require('./searchform');
var registerform = require('./registerform');
var loginform = require('./loginform');
var forgottenform = require('./forgottenform');
var changepasswordform = require('./changepasswordform');
var profileform = require('./profileform');
var updateprofileform = require('./updateprofileform');
var noteform = require('./noteform');
var updatenoteform = require('./updatenoteform');


module.exports = {
  search: searchform,
  register: registerform,
  login: loginform,
  forgotten: forgottenform,
  changepassword: changepasswordform,
  profile: profileform,
  updateprofile: updateprofileform,
  note: noteform,
  updatenote: updatenoteform
};