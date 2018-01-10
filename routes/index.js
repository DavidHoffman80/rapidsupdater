'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/user');
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
router.get('/logout', function(req, res, next){
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
        return res.redirect('/profile');
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
  if(req.body.firstName &&
    req.body.lastName &&
    req.body.email &&
    req.body.password &&
    req.body.confirmPassword){
    // Confirm that the password and confirmPassword match
    if(req.body.password !== req.body.confirmPassword){
      var err = new Error('Passwords do not match.');
      err.status = 400;
      return next(err);
    }
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
    
  } else{
    var err = new Error('All fields must be filled out.');
    err.status = 400;
    return next(err);
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

module.exports = router;