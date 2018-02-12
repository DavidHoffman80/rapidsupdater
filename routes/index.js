'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Article = require('../models/articles');
const mid = require('../middleware');

// GET /profile
router.get('/profile', mid.requiresLogin, function(req, res, next){
  User.findById(req.session.userId).exec(function(error, user){
    if(error){
      return next(error);
    } else{
      return res.render('profile', { title: 'Profile', name: user.firstName });
    }
  });
});

// GET /logout
router.get('/logout', mid.requiresLogin, function(req, res, next){
  // if there is a session, true if you are logged in
  if(req.session){
    // Then destroy that session
    req.session.destroy(function(err){
      if(err){
        return next(err);
      } else{
        // and redirect to the home page
        return res.redirect('/');
      }
    });
  }
});

// GET /login
router.get('/login', mid.loggedOut, function(req, res, next){
  return res.render('login', { title: 'Log In' });
});

// POST /login
router.post('/login', function(req, res, next){
  if(req.body.email && req.body.password){
    User.authenticate(req.body.email, req.body.password, function(error, user){
      if(error || !user){
        var err = new Error('Wrong E-mail or password.');
        err.status = 401;
        return next(err);
      } else{
        req.session.userId = user._id;
        return res.redirect('/articles');
      }
    });
  } else{
    var err = new Error('E-mail and password are required.');
    err.status = 401;
    return next(err);
  }
});

// GET /register
router.get('/register', mid.loggedOut, function(req, res){
  return res.render('register', { title: 'Register' });
});

// POST /register
router.post('/register', function(req, res, next){
  var userData = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password
  };
  // use shcema's 'create' method to insert document into mongo
  User.create(userData, function(error, user){
    if(error){
      return next(error);
    } else{
      req.session.userId = user._id;
      return res.redirect('/profile');
    }
  });
});

// GET /
router.get('/', function(req, res, next){
  return res.render('index', { title: 'Home' });
});

// GET /about
router.get('/about', function(req, res, next){
  return res.render('about', { title: 'About' });
});

// GET /articles
router.get('/articles', mid.requiresLogin, function(req, res, next){  
  Article.find({}, function(err, articles){
    if(err){
      return next(err);
    } else{
     return res.render('articles', {
       title: 'News',
       articles: articles
     }); 
    }
  });
});

// GET single article
router.get('/article/:id', mid.requiresLogin, function(req, res, next){
  Article.findById(req.params.id, function(err, article){
    if(err){
      return next(err);
    } else{
      User.findById(article.author, function(err, user){
        if(err){
          return next(err);
        } else{
          res.render('article', {
            article: article,
            author: user.firstName + ' ' + user.lastName,
            title: article.title
          });
        }
      });
    }
  });
});

// GET /articles/add
router.get('/articles/add', mid.requiresLogin, function(req, res, next){
  return res.render('add_article', {
    title: 'Add Info'
  });
});

// POST /articles/add
router.post('/articles/add', mid.requiresLogin, function(req, res, next){
  let article = new Article();
  article.title = req.body.title;
  article.author = req.session.userId;
  article.body = req.body.body;
  article.save(function(err){
    if(err){
      return next(err);
    } else{
      res.redirect('/articles');
    }
  });
});

// GET Edit single article
router.get('/article/edit/:id', mid.requiresLogin, function(req, res, next){
  Article.findById(req.params.id, function(err, article){
    if(err){
      return next(err);
    } else{
      res.render('edit_article', {
        title: 'Edit Info',
        article: article
      });
    }
  });
});

// DELETE delete single article
router.delete('/article/:id', mid.requiresLogin, function(req, res, next){
  let query = {_id:req.params.id};
  Article.remove(query, function(err){
    if(err){
      return next(err);
    } else{
      res.send('Success');
    }
  });
});

// POST /article/edit/"aritcle_ID"
router.post('/articles/edit/:id', mid.requiresLogin, function(req, res, next){
  let article = {};
  article.title = req.body.title;
  article.author = req.session.userId;
  article.body = req.body.body;
  
  let query = {_id:req.params.id};

  Article.update(query, article, function(err){
    if(err){
      return next(err);
    } else{
       res.redirect('/articles');
    }
  });
});

module.exports = router;