var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
	id : {type: Number, required: false},
	username : {type: String, required: false},
	githubId : {type: Number, required: false},
	access : {type: String, required: false}
});

module.exports = mongoose.model('User', User);