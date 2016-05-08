var express = require('express');
var router = express.Router();
var passport = require('passport');
var request = require('request');
var PouchDB = require('pouchdb');
var db = new PouchDB('CMS_projects');
var remoteCouch = false;
var fs = require("fs");
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

/* GET home page. */
router.get('/sync', function(req, res, next) {
	checkSession(req, res);
	var data = "";
	var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_nipype/contents/.cms";
	var options = {
		method: "GET",
		url: fileUrl,
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
			'Content-Type': 'application/json',
		}
	}

	request(options, function(error, response, body) {
		var project = JSON.parse(body);
		var original_content = new Buffer(project.content, 'base64').toString();
		content = original_content.split(/\r?\n/);
		var newContents = [];
		for (var i=0; i<content.length; i++) {
			if (content[i] != "") {
				newContents.push(content[i])
			}
		}
		newContents.push("CMS_nipype")

		var searchq = "q=user:" + req.user.username
		request(
			{
				url: "https://api.github.com/users/" + req.user.username + "/repos",
				method: 'GET',
				headers: {
					'User-Agent': 'Awesome-Octocat-App'
				}
			},
			function(error, response, body) {
				var projects = JSON.parse(body);
				var contents = projects.content;
				var projects_ = [];

				for (var proj=0; proj<projects.length; proj++) {
					for (var j=0; j<newContents.length; j++) {
						if (projects[proj].name == newContents[j]) {
							projects_.push(projects[proj]);
						}
					}
				}

				for (var each=0; each<projects_.length; each++) {
					var fileUrl = "https://api.github.com/repos/" + req.user.username + "/" + projects_[each].name + "/contents/.cms";
					var options = {
						method: "GET",
						url: fileUrl,
						headers: {
							'User-Agent': 'Awesome-Octocat-App',
							"Authorization": "token " + req.user.access,
							'Content-Type': 'application/json',
						}
					}

					request(options, function(error, response, body) {
						var proj = JSON.parse(body);
						var data = original_content;
						var string = {
						    message: "Updating",
						    content: new Buffer(data).toString('base64'),
						    sha: proj.sha,
						};

						var options = {
							method: "PUT",
							form: JSON.stringify(string),
							url: proj.url,
							headers: {
								'User-Agent': 'Awesome-Octocat-App',
								"Authorization": "token " + req.user.access,
								'Content-Type': 'application/json',
							}
						}

						request(options, function(error, response, body) {
						});
					});
				}
				renderProjects(req, res);
			}
		); 
	});
});


router.get('/popup_project', function(req, res, next) {
	checkSession(req, res);
	res.render('popup_project');
});

router.post('/create_project', function(req, res, next) {
	var fileUrl = "https://api.github.com/user/repos"
	var string = {
	    name: req.body.file_name
	};
	options = {
		url: fileUrl,
		method: 'POST',
		form: JSON.stringify(string),
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
		}
	}

	request(options, function(error, response, body) {
		var projects = JSON.parse(body);
		var data = "";
		var fileUrl = "https://api.github.com/repos/" + req.user.username + "/" + req.body.file_name + "/contents/.cms";
		var string = {
		    message: "Updating",
		    content: new Buffer(data).toString('base64'),
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
			updateNipype(req, res, req.body.file_name);	
		});
	});
});


router.post('/add_new_project', function(req, res, next) {

	var url = req.body.file_name
	var user_info = url.split("https://github.com/")
	var repoUrl = "https://api.github.com/repos/" + user_info[1] + "/forks"

	options = {
		url: repoUrl,
		method: 'POST',
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
		}
	}

	request(options, function(error, response, body) {
		var projects = JSON.parse(body);
		var data = "";
		var fileUrl = "https://api.github.com/repos/" + req.user.username + "/" + projects.name + "/contents/.cms";
		console.log(fileUrl)
		var string = {
		    message: "Updating",
		    content: data,
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
			console.log(project);
			updateNipype(req, res, projects.name);	
		});
	});
});

var updateNipype = function(req, res, proj_name) {
	var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_nipype/contents/.cms";
	var options = {
		method: "GET",
		url: fileUrl,
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
			'Content-Type': 'application/json',
		}
	}

	request(options, function(error, response, body) {
		var project = JSON.parse(body);
		var content = new Buffer(project.content, 'base64').toString();
		var data = content + "\n" + proj_name;
		var string = {
		    message: "Updating",
		    content: new Buffer(data).toString('base64'),
		    sha: project.sha,
		};

		var new_options = {
			method: "PUT",
			form: JSON.stringify(string),
			url: fileUrl,
			headers: {
				'User-Agent': 'Awesome-Octocat-App',
				"Authorization": "token " + req.user.access,
				'Content-Type': 'application/json',
			}
		}

		request(new_options, function(error, response, body) {
			var project = JSON.parse(body);
			renderProjects(req, res);
		});
	});
}

/* deletes the content of a file */
router.post('/delete_repo', function(req, res, next) {
	checkSession(req, res);
	var repo_name = req.body.actual_title;
	res.redirect("https://github.com/" + req.user.username + "/" + repo_name + "/settings");
});

router.get('/add_file', function(req, res, next) {
	var repo = req.query.repo;
	var path = req.query.path;
	var name = repo;
	var isrepo = (repo == path);
	if (repo != path) {
		name = repo + "/" + name;
	}
	res.render('add_file', { path: name, isrepo: isrepo, repo: repo });
});
/* deletes the content of a file */
router.post('/add_file', function(req, res, next) {
	checkSession(req, res);
	var file = req.files[0];
	var name = req.body.file_name;
	var path = req.body.path + "/";
	if (req.body.isrepo == "true") {
		path = "";
	}
	var repo = req.body.repo_name;

	var file_path = file.path;
	fs.readFile(file_path, function (err, data) {

		var fileUrl = "https://api.github.com/repos/" + req.user.username + "/" + repo + "/contents/" + path + name;
		var string = {
		    message: "Updating",
		    content: new Buffer(data).toString('base64'),
		    path: path + name,
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
			if (req.body.isrepo) {
				res.redirect("/project/" + repo);
			} else {
				res.redirect("/content?path=" + path + "&repo=" + repo + "&url=" + project.content.git_url);
			}	
		});
   });
});

/* deletes the content of a file */
router.post('/delete', function(req, res, next) {
	checkSession(req, res);
	var fileUrl = "https://github.com/" + req.user.username + "/" + req.body.repo + "/blob/master/" + req.body.path;
	res.redirect(fileUrl);
});

/* saves changes to a content of a file */
router.post('/save', function(req, res, next) {
	checkSession(req, res);
	var fileUrl = "https://api.github.com/repos/" + req.user.username + "/" + req.body.repo + "/contents/" + req.body.path;
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
		var projects = JSON.parse(body);
		var encodedString = new Buffer(projects.content, 'base64').toString();
		res.render('content', {
			content: encodedString,
			editing: false,
			project: req.body.repo + "/" + req.body.path,
			path: req.body.path,
			repo: req.body.repo,
			sha: projects.sha,
		});
	})
});

/* GET home page. */
router.get('/create_project', function(req, res, next) {
	res.render('create_project');
});

/* GET home page. */
router.get('/add_new_project', function(req, res, next) {
	res.render('add_new');
});

/* GET home page. */
router.get('/content', function(req, res, next) {
	checkSession(req, res);
	var path = req.query.path;
	var repo = req.query.repo;
	var username = req.user.username;
	request({
		url: req.query.url,
		method: 'GET',
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
		}},
		function(error, response, body) {
			var projects = JSON.parse(body);
			if (projects.tree) {
				for (var i=0; i<projects.tree.length; i++) {
					projects.tree[i].name = projects.tree[i].path
					projects.tree[i].path = path + "/" + projects.tree[i].name
					projects.tree[i].repo = repo
				}
				res.render('project', { 
					'project': projects.tree,
					'title': repo + "/" + path,
					'isrepo': false,
					'repo': repo,
					'path': path,
					"sha": projects.sha,
				});
			} else {
				var encodedString = new Buffer(projects.content, 'base64').toString();
				res.render('content', {
					content: encodedString,
					editing: false,
					project: repo + "/" + req.query.path,
					path: path,
					repo: repo,
					sha: projects.sha,
				});
			}
		});
});

router.get('/project/:name', function(req, res, next) {
	checkSession(req, res);
	var name = req.params.name
	request({
		url: "https://api.github.com/repos/Zulzaga/" + name + "/git/trees/master",
		method: 'GET',
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
		}},

		function(error, response, body) {
			var results = JSON.parse(body);
			projects = [];
			if (results.tree) {
				projects = results.tree
				for (var i=0; i<results.tree.length; i++) {
					projects[i].url = projects[i].url
					projects[i].name = projects[i].path
					projects[i].path = projects[i].path
				}
			}
			res.render('project', { 
				'project': projects,
				'title': name,
				'isrepo': true, 
				'repo': name,
				'path': "",
				"sha": projects.sha });
		});
});

var renderProjects = function(req, res) {
	checkSession(req, res);
	var data = "";
	var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_nipype/contents/.cms";
	var options = {
		method: "GET",
		url: fileUrl,
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
			'Content-Type': 'application/json',
		}
	}

	request(options, function(error, response, body) {
		var project = JSON.parse(body);
		var content = new Buffer(project.content, 'base64').toString();
		content = content.split(/\r?\n/);
		var newContents = [];
		for (var i=0; i<content.length; i++) {
			if (content[i] != "") {
				newContents.push(content[i])
			}
		}
		newContents.push("CMS_nipype")

		var searchq = "q=user:" + req.user.username
		request(
			{
				url: "https://api.github.com/users/" + req.user.username + "/repos",
				method: 'GET',
				headers: {
					'User-Agent': 'Awesome-Octocat-App',
					"Authorization": "token " + req.user.access,
					'Content-Type': 'application/json',
				}
			},
			function(error, response, body) {
				var projects = JSON.parse(body);
				var contents = projects.content;
				var forked_projects = [];
				var own_projects = [];

				for (var proj=0; proj<projects.length; proj++) {
					for (var j=0; j<newContents.length; j++) {
						if (projects[proj].name == newContents[j]) {
							if (projects[proj].fork) {
								forked_projects.push(projects[proj]);
							} else {
								own_projects.push(projects[proj]);
							}
						}
					}
				}

				res.render('projects', { 'own_projects': own_projects, 'forked_projects': forked_projects });
			}
		); 
	});
}

router.get("/search", function(req, res, next) {
	var searchText = req.query.search
	var queryString = "q=" + searchText + "+in:path+" + "user:" + req.user.username
	request({
		url:"https://api.github.com/search/code?" + queryString,
		method: 'GET',
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
		}},
		function(error, response, body) {
			var projects = JSON.parse(body);
			var data = "";
			var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_nipype/contents/.cms";
			var options = {
				method: "GET",
				url: fileUrl,
				headers: {
					'User-Agent': 'Awesome-Octocat-App',
					"Authorization": "token " + req.user.access,
					'Content-Type': 'application/json',
				}
			}

			request(options, function(error, response, body) {
				var project = JSON.parse(body);
				var content = new Buffer(project.content, 'base64').toString();
				content = content.split(/\r?\n/);
				var newContents = [];
				for (var i=0; i<content.length; i++) {
					if (content[i] != "") {
						newContents.push(content[i])
					}
				}
				newContents.push("CMS_nipype")


				var onlyCMSProjects = [];
				if (projects.items.length > 0) {
					for (var i=0; i<projects.items.length;i++) {
						var repo = projects.items[i].repository;
						var repo_name = repo.name;
						for (var j=0; j<newContents.length; j++) {
							if (newContents[j] == repo_name) {
								if (projects.items[i].path.substr(0, 1) == "/") {
									projects.items[i].path = projects.items[i].path.substr(1, projects.items[i].path.length)
								}
								projects.items[i].repo = repo_name;
								onlyCMSProjects.push(projects.items[i]);
							}
						}
					}
				}
				res.render('search_results', {
					'results': onlyCMSProjects,
					'count': onlyCMSProjects.length,
					'search': searchText 
				});
			});
		}); 
});

router.get('/auth/github',
  passport.authenticate('github'));
 
router.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
  	var fileUrl = "https://api.github.com/user/repos"
	var string = {
	    name: "CMS_nipype"
	};

	options = {
		url: fileUrl,
		method: 'POST',
		form: JSON.stringify(string),
		headers: {
			'User-Agent': 'Awesome-Octocat-App',
			"Authorization": "token " + req.user.access,
		}
	}

	request(options, function(error, response, body) {
		var projects = JSON.parse(body);
		if (projects.message != "Validation Failed") {
			var data = "";
			var fileUrl = "https://api.github.com/repos/" + req.user.username + "/CMS_nipype/contents/.cms";
			var string = {
			    message: "Updating",
			    content: new Buffer(data).toString('base64'),
			    path: ".cms",
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
				renderProjects(req, res);
			});
		} else {
			renderProjects(req, res);
		}
	});
  });

// route for logging out
router.get('/logout', function(req, res) {
	checkSession(req, res);
    req.logout();
    res.render('index', { title: 'Login', session: req.user });
});

module.exports = router;
