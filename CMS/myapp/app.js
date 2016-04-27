var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var multipart = require('multipart');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var GitHubStrategy = require('passport-github').Strategy;
var mongodb = require('mongodb');
var routes = require('./routes/index');
var login = require('./routes/login');
var users = require('./routes/users');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:8000/data';
var mongoose = require('mongoose');
var User = require('./models/User.js');
var multer = require('multer');
var PouchDB = require('pouchdb');
// var User = mongoose.model('User');
var app = express();
var busboy = require('connect-busboy');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));
var multer = require('multer');
var upload = multer({ dest: './uploads' });
app.use(multer({dest:'./uploads/'}).array('multiInputFileName'));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/users', users);
app.use('/login', login);
app.use(busboy());
// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    console.log("passport")
    done(null, user);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

passport.use(new GitHubStrategy({
    clientID: 'd4b1a86871d7237aad69',
    clientSecret: '379eaaec03f32340975aa6ddc9637c3414208561',
    callbackURL: "http://localhost:8080/auth/github/callback",
    scope: ["repo", "user"],
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(accessToken)
    var user = {
      "githubId": profile.id,
      "username": profile.username,
      "access": accessToken,
    }
    return cb(null, user);
  }
));

// used to deserialize the user
passport.deserializeUser(function(user, done) {
  done(null, user);
    // User.findById(id, function(err, user) {
    //     done(err, user);
    // });
});

MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);

    // Get the documents collection
    var collection = db.collection('users');

    //Create some users
    var user1 = {name: 'modulus admin', age: 42, roles: ['admin', 'moderator', 'user']};
    var user2 = {name: 'modulus user', age: 22, roles: ['user']};
    var user3 = {name: 'modulus super admin', age: 92, roles: ['super-admin', 'admin', 'moderator', 'user']};

    // Insert some users
    collection.insert([user1, user2, user3], function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
      }
      //Close connection
      db.close();
    });
  }
});

function sync() {
  var remoteCouch = "https://api.github.com/repos/Zulzaga/CMS_numpy/";
  syncDom.setAttribute('data-sync-state', 'syncing');
  var opts = {live: true};
  db.replicate.to(remoteCouch, opts, syncError);
  db.replicate.from(remoteCouch, opts, syncError);
}

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
