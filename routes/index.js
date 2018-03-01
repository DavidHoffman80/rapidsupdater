'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Bring in article model
let Article = require('../models/articles');
// Bring in user model
let User = require('../models/user');
// Bring in profile model
let Profile = require('../models/profile');
// Authentication middleware
let authentication = require('../authenticationMiddleware/authenticate');

// GET / Home
router.get('/', function(req, res, next){
  return res.render('index', {
    title: 'Home'
  });
});

// GET /register
router.get('/register', authentication.mustBeLoggedOut, function(req, res, next){
  return res.render('register', {
    title: 'Register'
  });
});

// POST /register
router.post('/register', authentication.mustBeLoggedOut, function(req, res, next){
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  req.checkBody('firstName', 'Your first name is required!').notEmpty();
  req.checkBody('lastName', 'Your last name is required!').notEmpty();
  req.checkBody('email', 'Your e-mail is required!').notEmpty();
  req.checkBody('email', 'Please provide a valid e-mail!').isEmail();
  req.checkBody('password', 'A password is required!').notEmpty();
  req.checkBody('confirmPassword', 'Passwords do not match!').equals(req.body.password);

  let errors = req.validationErrors();

  if(errors){
    let registrant = {};
    registrant.firstName = firstName;
    registrant.lastName = lastName;
    registrant.email = email;
    res.render('register_error', {
      title: 'Register',
      registrant: registrant,
      errors: errors
    });
  } else{
    let newUser = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password
    });

    bcrypt.genSalt(10, function(err, salt){
      bcrypt.hash(newUser.password, salt, function(err, hash){
        if(err){
          return next(err);
        }
        newUser.password = hash;
        newUser.save(function(err){
          if(err){
            return next(err);
          } else{
            req.flash('success', 'You are now registered');
            res.redirect('/login');
          }
        });
      });
    });
  }
});

// GET /about
router.get('/about', function(req, res, next){
  return res.render('about', {
    title: 'About'
  });
});

// GET /login
router.get('/login', authentication.mustBeLoggedOut, function(req, res, next){
  return res.render('login', {
    title: 'Login'
  });
});

// POST /login
router.post('/login', authentication.mustBeLoggedOut, function(req, res, next){
  passport.authenticate('local', {
    successRedirect: '/news',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

// GET logout
router.get('/logout', authentication.mustBeLoggedIn, function(req, res, next){
  req.logout();
  req.flash('success', 'You have been logged out.');
  res.redirect('/login');
});

// GET /profile
router.get('/profile', authentication.mustBeLoggedIn, function(req, res, next){
  User.findById(req.user._id, function(err, user){
    if(err){
      return next(err);
    } else{
      let query = {author:req.user._id};
      Profile.findOne(query, function(err, profile){
        return res.render('profile', {
          name: user.firstName + ' ' + user.lastName,
          title: 'Profile | ' + user.firstName + ' ' + user.lastName,
          profile: profile
        });
      });
    }
  });
});

// GET /profile/edit
router.get('/profile/edit', authentication.mustBeLoggedIn, function(req, res, next){
  User.findById(req.user._id, function(err, user){
    if(err){
      return next(err);
    } else{
      let query = {author:req.user._id};
      Profile.findOne(query, function(err, profile){
        if(err){
          return next(err);
        }
        if(profile){    
          return res.render('edit_profile', {
            title: 'Edit Profile',
            user: user,
            profile: profile
          });
        } else{
          return res.render('edit_profile_no_info',{
            title: 'Edit Profile',
            user: user
          });
        }
      });
    }
  });
});

// POST /profile/edit
router.post('/profile/edit', authentication.mustBeLoggedIn, function(req, res, next){
  const email = req.body.email;

  req.checkBody('email', 'Your e-mail is required!').notEmpty();
  req.checkBody('email', 'Please provide a valid e-mail!').isEmail();

  let errors = req.validationErrors();

  if(errors){
    User.findById(req.user._id, function(err, user){
      if(err){
        return next(err);
      } else{
        let query = {author:req.user._id};
        Profile.findOne(query, function(err, profile){
          if(err){
            return next(err);
          }
          if(profile){
            res.render('edit_profile_error_info', {
              title: 'Edit Profile',
              user: user,
              errors: errors
            });
          } else{
            res.render('edit_profile_error_no_info', {
              title: 'Edit Profile',
              user: user,
              errors: errors
            });
          }
        });
      }
    });
  } else{
    User.findById(req.user._id, function(err, user){
      let userQuery = {_id:req.user._id};
      let userUpdate = {};
      userUpdate.email = req.body.email;
      User.update(userQuery, userUpdate, function(err){
        if(err){
          return next(err);
        }
      });
      let profileQuery = {author:req.user._id};
      Profile.findOne(profileQuery, function(err, profile){
        if(profile){
          let profile = {};
          profile.phone = req.body.phone;
          profile.position = req.body.position;
          Profile.update(profileQuery, profile, function(err){
            if(err){
              return next(err);
            } else{
              req.flash('success', 'Your profile has been updated!');
              res.redirect('/profile');
            }
          });
        } else{
          let profile = new Profile();
          profile.phone = req.body.phone;
          profile.position = req.body.position;
          profile.author = req.user._id;
        
          profile.save(function(err){
            if(err){
              return next(err);
            } else{
              req.flash('success', 'Your profile has been updated!');
              res.redirect('/profile');
            }
          });
        }
      });
    });
  }
});

router.get('/profile/edit/image', authentication.mustBeLoggedIn, function(req, res, next){
  return res.render('editProfileImage', {
    title: 'Profile Image'
  });
});

// GET /News
router.get('/news', authentication.mustBeLoggedIn, function(req, res, next){
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
router.get('/news/add', authentication.mustBeLoggedIn, function(req, res, next){
  return res.render('add_news', {
    title: 'Add News'
  });
});

// POST /news/add
router.post('/news/add', authentication.mustBeLoggedIn, function(req, res, next){
  req.checkBody('title', 'A title is required!').notEmpty();
  req.checkBody('body', 'The body is required!').notEmpty();

  // Get errors
  let errors = req.validationErrors();
  if(errors){
    let article = {};
    article.title = req.body.title;
    article.body = req.body.body;
    res.render('add_news_error', {
      title: 'Add News',
      article: article,
      errors: errors
    });
  } else{
    let article = new Article();
    article.title = req.body.title;
    article.author = req.user._id;
    article.body = req.body.body;

    article.save(function(err){
      if(err){
        return next(err);
      } else{
        req.flash('success', 'Your News has been added!');
        res.redirect('/news');
      }
    });
  }
});

// GET single news article
router.get('/news/:id', authentication.mustBeLoggedIn, function(req, res, next){
  Article.findById(req.params.id, function(err, article){    
    if(err){
      return next(err);
    } else{
      User.findById(article.author, function(err, user){
        if(err){
          return next(err);
        } else{
          return res.render('article', {
            title: article.title,
            article: article,
            author: user.firstName + ' ' + user.lastName
          });
        }
      });
    }
  });
});

// GET news edit
router.get('/news/edit/:id', authentication.mustBeLoggedIn, function(req, res, next){
  Article.findById(req.params.id, function(err, article){
    if(err){
      return next(err);
    } else if(article.author != req.user._id){
      req.flash('danger', 'Not Authorized!');
      res.redirect('/news/'+ req.params.id);
    } else{
      return res.render('edit_news', {
        title: 'Edit News',
        article: article
      });
    }
  });
});

// POST news edit
router.post('/news/edit/:id', authentication.mustBeLoggedIn, function(req, res, next){
  req.checkBody('title', 'A title is required!').notEmpty();
  req.checkBody('body', 'The body is required!').notEmpty();

  // Get errors
  let errors = req.validationErrors();
  if(errors){
    let article = {};
    article.title = req.body.title;
    article.body = req.body.body;
    res.render('edit_news_error', {
      title: 'Edit News',
      article: article,
      errors: errors
    });
  } else{
    Article.findById(req.params.id, function(err, article){
      if(err){
        return next(err);
      } else if(article.author == req.user._id){
        let editedArticle = {};
        editedArticle.title = req.body.title;
        editedArticle.author = req.user._id;
        editedArticle.body = req.body.body;

        let query = {_id:req.params.id};
        Article.update(query, editedArticle, function(err){
          if(err){
            return next(err);
          } else{
            req.flash('success', 'Your News article has been updated!');
            res.redirect('/news/'+article._id);
          }
        });
      } else{
        req.flash('danger', 'Not Authorized!');
        res.redirect('/news/'+ req.params.id);
      }
    });
  }
});

// DELETE a single article
router.delete('/news/:id', function(req, res, next){
  if(!req.user._id){
    res.status(500).send();
  }
  let query = {_id:req.params.id}
  Article.findById(req.params.id, function(err, article){
    if(article.author != req.user._id){
      res.status(500).send();
    } else{
      Article.remove(query, function(err){
        if(err){
          return next(err);
        }
        req.flash('success', 'Your News article has been deleted!');
        res.send('Success');        
      });
    }
  });
});

module.exports = router;