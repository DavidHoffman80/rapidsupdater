'use strict';

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

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

// Body-parser middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Set the public folder
app.use(express.static(path.join(__dirname, 'public')));

// GET / Home
app.get('/', function(req, res, next){
  return res.render('index', {
    title: 'Home'
  });
});

// GET /register
app.get('/register', function(req, res, next){
  return res.render('register', {
    title: 'Register'
  });
});

// GET /about
app.get('/about', function(req, res, next){
  return res.render('about', {
    title: 'About'
  });
});

// GET /News
app.get('/news', function(req, res, next){
  Article.find({}, function(err, articles){
    if(err){
      return next(err);
    } else{
      return res.render('news', {
        title: 'News',
        articles: articles
      });
    }
  });
});

// GET /news/add
app.get('/news/add', function(req, res, next){
  return res.render('add_news', {
    title: 'Add News'
  });
});

// POST /news/add
app.post('/news/add', function(req, res, next){
  let article = new Article();
  article.title = req.body.title;
  article.author = req.body.author;
  article.body = req.body.body;

  article.save(function(err){
    if(err){
      return next(err);
    } else{
      res.redirect('/news');
    }
  });
});

// GET single news article
app.get('/news/:id', function(req, res, next){
  Article.findById(req.params.id, function(err, article){
    if(err){
      return next(err);
    } else{
      return res.render('article', {
        title: article.title,
        article: article
      });
    }
  });
});

// GET news edit
app.get('/news/edit/:id', function(req, res, next){
  Article.findById(req.params.id, function(err, article){
    if(err){
      return next(err);
    } else{
      return res.render('edit_news', {
        title: 'Edit News',
        article: article
      });
    }
  });
});

// POST news edit
app.post('/news/edit/:id', function(req, res, next){
  let article = {};
  article.title = req.body.title;
  article.author = req.body.author;
  article.body = req.body.body;

  let query = {_id:req.params.id};
  Article.update(query, article, function(err){
    if(err){
      return next(err);
    }
  });
  Article.findById(req.params.id, function(err, article){
    if(err){
      return next(err);
    } else{
      res.redirect('/news/'+article._id);
    }
  });
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