'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

var app = express();

// Mongodb connection
mongoose.connect('mongodb://localhost:27017/rapidsupdater', { useMongoClient: true });
var db = mongoose.connection;
// Mongo error
db.on('error', console.error.bind(console, 'connection error:'));

// Use sessions for tracking logins
app.use(session({
  secret: 'communication is key',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  }),
  unset: 'destroy'
}));

// Make user ID available in PUG templates
app.use(function(req, res, next){
  res.locals.currentUser = req.session.userId;
});

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve static files from /public
app.use(express.static(__dirname + '/public'));

// view engine setup
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

// include routes
var routes = require('./routes/index');
app.use('/', routes);

// Catch 404 and forward to error handler
app.use(function(req, res, next){
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// Error handler
app.use(function(err, req, res, next){
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