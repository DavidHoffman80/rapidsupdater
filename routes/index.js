'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Article = require('../models/articles');
const mid = require('../middleware');
const bcrypt = require('bcryptjs');

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
  req.flash('success', 'You have been logged out!');
  // if there is a session, true if you are logged in
  if(req.session.userId){
    // Then destroy that session
    req.session.destroy(function(err){
      if(err){
        return next(err);
      } else{
        // clear the cookie
        res.clearCookie('connect.sid');
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
  const firstName = req.body.firstName;
  const laststName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  
  req.checkBody('firstName', 'Your first name is required.').notEmpty();
  req.checkBody('lastName', 'Your last name is required.').notEmpty();
  req.checkBody('email', 'Your E-mail is required.').notEmpty();
  req.checkBody('email', 'Your E-mail is not valid.').isEmail();
  req.checkBody('password', 'Password is required.').notEmpty();
  req.checkBody('confirmPassword', 'Passwords do not match.').equals(req.body.password);
  
  let errors = req.validationErrors();
  
  if(errors){
    let registration = {};
    registration.firstName = req.body.firstName;
    registration.lastName = req.body.lastName;
    registration.email = req.body.email;
    res.render('register_error', {
      title: 'Register',
      registration: registration,
      errors: errors
    });
  } else{
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
  }
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
  req.checkBody('title', 'The title is required.').notEmpty();
  req.checkBody('body', 'The body is required.').notEmpty();

  // Get errors
  let errors = req.validationErrors();
  if(errors){
    let article = {};
    article.title = req.body.title;
    article.body = req.body.body;
    res.render('add_article_error', {
      title: 'Add Info',
      article: article,
      errors: errors
    });
  } else{
    let article = new Article();
    article.title = req.body.title;
    article.author = req.session.userId;
    article.body = req.body.body;
    article.save(function(err){
      if(err){
        return next(err);
      } else{
        req.flash('success', 'News Article Added!');
        res.redirect('/articles');
      }
    });
  }
});

// GET Edit single article
router.get('/article/edit/:id', mid.requiresLogin, function(req, res, next){
  Article.findById(req.params.id, function(err, article){
    if(err){
      return next(err);
    }
    if(article.author != req.session.userId){
      req.flash('danger', 'Not Authorized');
      res.redirect('/articles');
    }
    else{
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
  Article.findById(req.params.id, function(err, article){
    if(err){
      return next(err);
    }
    if(article.author != req.session.userId){
      res.status(500).send();
    } else{
      Article.remove(query, function(err){
        if(err){
          return next(err);
        } else{
          res.send('Success');
        }
      });
    }
  });
});

// POST /article/edit/"aritcle_ID"
router.post('/articles/edit/:id', mid.requiresLogin, function(req, res, next){
  req.checkBody('title', 'The title is required.').notEmpty();
  req.checkBody('body', 'The body is required.').notEmpty();
  
  // Get errors
  let errors = req.validationErrors();
  if(errors){
    let article = {};
    article.title = req.body.title;
    article.body = req.body.body;
    res.render('edit_article_error', {
      title: 'Edit Article',
      article: article,
      errors: errors
    });
  } else{
    let article = {};
    article.title = req.body.title;
    article.author = req.session.userId;
    article.body = req.body.body;

    let query = {_id:req.params.id};

    Article.update(query, article, function(err){
      if(err){
        return next(err);
      } else{
        req.flash('success', 'News Article has been updated!');
        res.redirect('/articles');
      }
    });
  }
});

module.exports = router;