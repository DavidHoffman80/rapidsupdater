'use strict';

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/rapidsupdater');
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

// Home route
app.get('/', function(req, res, next){
  return res.render('layout', {
    title: 'Home'
  });
});

app.get('/articles', function(req, res, next){
  
});

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