var express = require('express');
var router = express.Router();
var passport = require('passport');
var request = require('request');

var Client = require('node-rest-client').Client;

var client = new Client();


/* GET home page. */
router.get('/', function(req, res, next) {
	if (req.user) {
		renderProjects(req, res);
	} else {
		res.render('index', { title: 'Express', session: req.user });
	}
});

/* GET home page. */
router.get('/projects', function(req, res, next) {
	renderProjects(req, res);
});

/* GET home page. */
router.post('/save', function(req, res, next) {
	// var request = JSON.parse(req.body);
	// /repos/:owner/:repo/contents/:path
	var fileUrl = "https://api.github.com/repos/" + req.user.username + "/" + req.body.parent + "/contents/" + req.body.title + "?content= &message= ";
	console.log(fileUrl)
	var string = {
	    message: "Updating",
	    content: new Buffer(req.body.data).toString('base64'),
	    sha: req.body.sha,
	};
	console.log(req.user.access);
	var options = {
		method: "PUT",
		form: JSON.stringify(string),
		url: fileUrl,
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
			'Content-Type': 'application/json',
		}
	}
	// request({
	// 	url: fileUrl,
	// 	method: 'PUT',
	// 	form: string,
	// 	headers: {
	// 		'User-Agent': 'Awesome-Octocat-App',
	// 		"Authorization": "token " + req.user.access,
	// 		'Content-Type': 'application/json',
	// 		'Content-Length': JSON.stringify(string).length,
	// 	}},
	// 	function(error, response, body) {
	// 		console.log(body);
	// 	});
	request(options, function(error, response, body) {
		console.log(body);
		var projects = JSON.parse(body);
		console.log(projects);
		// res.render('project', { 'project': projects });
		// console.log(response);
		var fileUrl = "https://api.github.com/repos/" + req.user.username + "/" + req.body.parent + "/git/blobs/" + req.body.sha;
		request({
			url: fileUrl,
			method: 'GET',
			headers: {
				'User-Agent': 'Awesome-Octocat-App',
				"Authorization": "token " + req.user.access,
			}},
			function(error, response, body) {
				var projects = JSON.parse(body);
				var encodedString = new Buffer(projects.content, 'base64').toString();
				res.render('content', { content: encodedString, editing: false, project: projects.content.path, parent: req.body.parent, sha: projects.content.sha });
			});

	})
});

/* GET home page. */
router.get('/content', function(req, res, next) {
	var type = req.query.type;
	var path = req.query.path;
	if (type == "blob") {
		var fileUrl = "https://api.github.com/repos/" + req.user.username + "/" + req.query.parent + "/git/blobs/" + req.query.sha;
		request({
			url: fileUrl,
			method: 'GET',
			headers: {
				'User-Agent': 'Awesome-Octocat-App',
				"Authorization": "token " + req.user.access,
			}},
			function(error, response, body) {
				var projects = JSON.parse(body);
				var encodedString = new Buffer(projects.content, 'base64').toString();
				res.render('content', { content: encodedString, editing: false, project: path, parent: req.query.parent, sha: req.query.sha });
			});
	} else {
		// var fileUrl = "https://api.github.com/repos/Zulzaga/" + req.query.parent + "/git/blobs/" + req.query.path;
		// console.log(fileUrl)
		// request({
		// 	url: fileUrl,
		// 	method: 'GET',
		// 	headers: {
		// 		'User-Agent': 'Awesome-Octocat-App',
		// 		"Authorization": "token " + req.user.access,
		// 	}},
		// 	function(error, response, body) {
		// 		var projects = JSON.parse(body);
		// 		var encodedString = new Buffer(projects.content, 'base64').toString();
		// 		res.render('content', { content: encodedString });
		// 	});		
	}
});

router.post('/content', function (req, res, next) {
  console.log(req.json);
  console.log(req.body);
});

/* GET home page. */
router.get('/project/:name', function(req, res, next) {
	request({
		url:"https://api.github.com/repos/Zulzaga/" + req.params.name + "/git/trees/master",
		method: 'GET',
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
		}}, 
		function(error, response, body) {
			var projects = JSON.parse(body).tree;
			for (var i=0; i<projects.length; i++) {
				projects[i].url = projects[i].url.replace("https://", "")
				projects[i].parent = req.params.name
			}
			res.render('project', { 'project': projects });
		});
});


// /repos/:owner/:repo/contents/:path
/* GET home page. */
router.get('/home', function(req, res, next) {
	request({
		url:"https://api.github.com/users/" + req.user.username + "/repos",
		method: 'GET',
		headers: {
			'User-Agent': 'Awesome-Octocat-App'
		}}, 
		function(error, response, body) {
			var projects = JSON.parse(body);
			res.render('projects', { 'projects': projects });
		});
});

var renderProjects = function(req, res) {
	request({
		url:"https://api.github.com/users/" + req.user.username + "/repos",
		method: 'GET',
		headers: {
			'User-Agent': 'Awesome-Octocat-App'
		}}, 
		function(error, response, body) {
			var projects = JSON.parse(body);
			res.render('projects', { 'projects': projects });
		}); 
}

router.get('/auth/github',
  passport.authenticate('github'));
 
router.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
	renderProjects(req, res); 
  });

// route for logging out
router.get('/logout', function(req, res) {
    console.log("user " + req.session.user);
});

module.exports = router;
