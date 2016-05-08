var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Project = new Schema({
	path : {type: String, required: false},
	type : {type: String, required: false},
	parent : {type: String, required: false}
});

module.exports = mongoose.model('Project', Project);