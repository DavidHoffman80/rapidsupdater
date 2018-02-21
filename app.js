'use strict';

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');
const MongoStore = require('connect-mongo')(session);

mongoose.connect(config.database);
let db = mongoose.connection;
// Check DB connection
db.once('open', function(){
  console.log('Connected to MongoDB');
});
// Check for DB errors
db.on('error', function(err){
  console.log(err);
});

// Initialize App(express)
var app = express();

// Bring in Models
let Article = require('./models/articles');

// Load view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Body-parser middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Set the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Express-session middleware
app.use(session({
  secret: 'rapids updater is for you',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

// Express-messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Express-validator middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value){
    var namespace = param.split('.'),
    root = namespace.shift(),
    formParam = root;
    while(namespace.length){
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param: formParam,
      msg: msg,
      value: value
    };
  }
}));

// Passport config
require('./config/passport')(passport);
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Allow the app to have the user id
app.use(function(req, res, next){
  res.locals.user = req.user;
  next();
});

// Include routes
var routes = require('./routes/index');
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Server started on port 3000
app.listen(3000, function(){
  console.log('Express app listening on port 3000');
});