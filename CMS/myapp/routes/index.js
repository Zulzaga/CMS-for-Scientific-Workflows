var express = require('express');
var router = express.Router();
var passport = require('passport');
var request = require('request');
var PouchDB = require('pouchdb');
var db = new PouchDB('CMS_projects');
var remoteCouch = false;
var Client = require('node-rest-client').Client;

var client = new Client();

var checkSession = function(req, res) {
	if (!req.user) {
		res.render('index', { title: 'Login', session: req.user });
	}
}

/* GET home page. */
router.get('/', function(req, res, next) {
	checkSession(req, res);
	renderProjects(req, res);
});

/* GET home page. */
router.get('/create', function(req, res, next) {
	checkSession(req, res);
	res.render('create', { });
});

/* GET home page. */
router.get('/projects', function(req, res, next) {
	checkSession(req, res);
	renderProjects(req, res);
});

/* GET home page. */
router.get('/popup', function(req, res, next) {
	checkSession(req, res);
	res.render('popup');
});

router.get('/popup_project', function(req, res, next) {
	checkSession(req, res);
	res.render('popup_project');
});

router.post('/create_project', function(req, res, next) {
	// console.log(req.files);
	var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_numpy"
	request({
		url: fileUrl,
		method: 'GET',
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
		}},
		function(error, response, body) {
			var response = JSON.parse(body);
			project = "";
			if (response.message != "Not Found") {
				project = JSON.parse(body);
				createProject(req, res, project);
			} else {
				var string = {
				    name: "CMS_numpy",
				    description: "CMS repo"
				};
				var options = {
					method: "POST",
					form: JSON.stringify(string),
					url: "https://api.github.com/user/repos",
					headers: {
						'User-Agent': 'Awesome-Octocat-App',
						"Authorization": "token " + req.user.access,
						'Content-Type': 'application/json',
					}
				}

				request(options, function(error, response, body) {
					project = JSON.parse(body);
					createProject(req, res, project);
				});
			}
		});
});

var createProject = function(req, res, project) {
	var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_numpy/contents/new_project/" + "hello";
	console.log(fileUrl)
	var string = {
	    message: "Updating",
	    content: new Buffer("New Project").toString('base64'),
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

	request(options, function(error, response, body) {
		var projects = JSON.parse(body);
		// res.render('project', { 'project': projects });
		// console.log(response);
		var fileUrl = "https://api.github.com/repos/" + req.user.username + "/" + req.body.parent + "/git/blobs/" + req.body.sha;
		renderProjects(req, res);
	});
};

/* GET home page. */
router.post('/save', function(req, res, next) {
	checkSession(req, res);
	// var request = JSON.parse(req.body);
	// /repos/:owner/:repo/contents/:path
	console.log(req.body)
	var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_numpy/" + req.body.parent + "contents/" + req.body.path;
	console.log("save" + fileUrl)
	var string = {
	    message: "Updating",
	    content: new Buffer(req.body.data).toString('base64'),
	    sha: req.body.sha,
	};
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

	request(options, function(error, response, body) {
		var project = JSON.parse(body);
		var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_numpy/git/blobs/" + req.body.sha;
		console.log(project)
		request({
			url: fileUrl,
			method: 'GET',
			headers: {
				'User-Agent': 'Awesome-Octocat-App',
				"Authorization": "token " + req.user.access,
			}},
			function(error, response, body) {
				var projects = JSON.parse(body);
				console.log(projects)
				var encodedString = new Buffer(projects.content, 'base64').toString();
				res.render('content', { content: encodedString, editing: false, project: project.name, sha: req.body.sha });
			});

	})
});

/* GET home page. */
router.get('/content', function(req, res, next) {
	checkSession(req, res);
	var type = req.query.type;
	var name = req.query.name;
	console.log(req.query)
	if (type == "blob" || type == "file") {
		var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_numpy/git/blobs/" + req.query.sha;
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
				console.log(projects);
				res.render('content', { content: encodedString, editing: false, project: name, parent: req.query.parent, sha: req.query.sha });
			});
	} else {
		var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_numpy/contents/" + req.query.path;
		console.log(fileUrl);
		console.log("token " + req.user.access);
		request({
			url: fileUrl,
			method: 'GET',
			headers: {
				'User-Agent': 'Awesome-Octocat-App',
				"Authorization": "token " + req.user.access,
			}},
			function(error, response, body) {
				var projects = JSON.parse(body);
				console.log(projects);
				res.render('project', { 'project': projects, 'title': req.query.path });
			});
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

/* GET home page. */
router.get('/project/:name', function(req, res, next) {
	checkSession(req, res);
	renderProject(req, res, req.params.name);
});

var renderProject = function(req, res, name) {
	console.log("https://api.github.com/repos/Zulzaga/CMS_numpy/" + name + "/git/trees/master")
	request({
		url:"https://api.github.com/repos/Zulzaga/CMS_numpy/" + name + "/git/trees/master",
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
			res.render('project', { 'project': projects, 'title': req.params.name });
		});
}
// /repos/:owner/:repo/contents/:path
/* GET home page. */
router.get('/home', function(req, res, next) {
	checkSession(req, res);
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
	checkSession(req, res);
	request({
		url:"https://api.github.com/repos/" + req.user.username + "/CMS_numpy/git/trees/master",
		method: 'GET',
		headers: {
			'User-Agent': 'Awesome-Octocat-App'
		}}, 
		function(error, response, body) {
			var projects = JSON.parse(body);
			console.log(projects);
			res.render('projects', { 'projects': projects.tree });
		}); 

	// db.allDocs({include_docs: true, descending: true}, function(err, doc) {
 //    	console.log("rows are here " + doc.rows.length);
 //    	// res.render('projects', { 'projects': doc.rows });
 //  	});
}

router.get("/search", function(req, res, next) {
	var searchText = req.query.search
	var queryString = "q=" + searchText + "+in:path+" + "repo:" + req.user.username + "/CMS_numpy"
	console.log("q " + queryString);
	request({
		url:"https://api.github.com/search/code?" + queryString,
		method: 'GET',
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
		}},
		function(error, response, body) {
			var projects = JSON.parse(body);
			console.log(projects);
			res.render('search_results', { 'results': projects.items, 'count': projects.total_count, 'search': searchText });
		}); 
});

router.get('/auth/github',
  passport.authenticate('github'));
 
router.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
  	console.log("callback");

	request({
		url:"https://api.github.com/repos/" + req.user.username + "/CMS_numpy/git/trees/master",
		method: 'GET',
		headers: {
			'User-Agent': 'Awesome-Octocat-App'
		}}, 
		function(error, response, body) {
			var projects = JSON.parse(body);
			console.log(projects);
			for (var i=0; i<projects.tree.length; i++) {
				var project = {
					_id: new Date().toISOString(),
					content: projects.tree[i],
				}

				// db.put(project, function callback(err, result) {
				// 	if (!err) {
				// 		console.log("Successfulyy createa a project!");
				// 	}
				// });
			}
			res.render('projects', { 'projects': projects.tree });
		}); 
	// db.allDocs({include_docs: true, descending: true}, function(err, doc) {
 //    	console.log("rows are here " + doc.rows[doc.rows.length - 1].doc.content.path);
 //    	// res.render('projects', { 'projects': doc.rows });
 //  	});
  });

// route for logging out
router.get('/logout', function(req, res) {
	checkSession(req, res);
    req.logout();
    res.render('index', { title: 'Login', session: req.user });
});

module.exports = router;
