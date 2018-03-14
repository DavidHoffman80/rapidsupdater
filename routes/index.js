'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const bodyParser = require('body-parser');

const multer = require('multer');
// Set Multer Storage Engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
// Initialize Multer Upload
const upload = multer({
  storage: storage,
  limits: {fileSize: 5256438},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
});
// Check File Type
function checkFileType(file, cb){
  // Allowed ext types
  const filetypes = /jpeg|jpg|png|gif/;
  // Check the ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);
  if(mimetype && extname){
    return cb(null, true);
  } else{
    cb('Error: Images Only!');
  }
}

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
    res.render('register', {
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
            return res.redirect('/login');
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
        if(err){
          return next(err);
        } else{
          return res.render('profile', {
            name: user.firstName + ' ' + user.lastName,
            title: 'Profile | ' + user.firstName + ' ' + user.lastName,
            user: user,
            profile: profile
          });
        }
      });
    }
  });
});

// GET /profile/edit
router.get('/profile/edit', authentication.mustBeLoggedIn, function(req, res, next){
  User.findById(req.user._id, function(err, user){
    if(err){
    } else{
      let query = {author:req.user._id};
      Profile.findOne(query, function(err, profile){
        if(err){
          return next(err);
        } else{
          return res.render('edit_profile', {
            title: 'Edit Profile',
            user: user,
            profile: profile
          });
        }
      });
    }
  });
});

// POST /profile/edit
router.post('/profile/edit', authentication.mustBeLoggedIn, function(req, res, next){
  var upload2 = upload.single('profileImage');
  upload2(req, res, function(err){
    const email = req.body.email;
    const phone = req.body.phone;
    req.checkBody('email', 'Your e-mail is required!').notEmpty();
    req.checkBody('email', 'Please provide a valid e-mail!').isEmail();
    let errors = req.validationErrors();
    if(errors){
      let user = {};
      let profile = {};
      user.email = req.body.email;
      profile.phone = req.body.phone;
      profile.position = req.body.position;
      return res.render('edit_profile', {
        title: 'Edit Profile',
        profile: profile,
        user: user,
        errors: errors
      });
    // There is no image to upload
    } else if(req.file == undefined){
      // Update the user
      User.findById(req.user._id, function(err, user){
        let userQuery = {_id:req.user._id};
        let userUpdate = {};
        userUpdate.email = req.body.email;
        User.update(userQuery, userUpdate, function(err){
          if(err){
            return next(err);
          }
        });
      });
      // Update the profile if there is one
      // If there isn't a profile create a new profile
      let profileQuery = {author:req.user._id};
      Profile.findOne(profileQuery, function(err, profile){
        if(err){
          return next(err);
        //There is a profile
        } else if(profile){
          let profileQuery = {author:req.user._id};
          let profile = {};
          profile.phone = req.body.phone;
          profile.position = req.body.position;
          Profile.update(profileQuery, profile, function(err){
            if(err){
              return next(err);
            } else{
              req.flash('success', 'Your profile has been updated!');
              return res.redirect('/profile');
            }
          });
        // There is not profile, so create a profile
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
              return res.redirect('/profile');
            }
          });
        }
      });
    // There is an image file to upload
    } else{
      // Update the user
      let user = {};
      user.email = req.body.email;
      let userQuery = {_id:req.user._id};
      User.update(userQuery, user, function(err){
        if(err){
          return next(err);
        }
      });
      // Update the profile if there is one
      // If there isn't a profile create a new profile
      let profileQuery = {author:req.user._id};
      Profile.findOne(profileQuery, function(err, profile){
        if(err){
          return next(err);
        //There is a profile 
        } else if(profile){
          let profile = {};
          profile.phone = req.body.phone;
          profile.position = req.body.position;
          profile.profileImageName = '/uploads/' + req.file.filename;
          Profile.update(profileQuery, profile, function(err){
            if(err){
              return next(err);
            } else{
              req.flash('success', 'Your profile has beeupdated!');
              return res.redirect('/profile');
            }
          });
        // There is not a profile, so create a profile
        } else{
          let profileNew = new Profile();
          profileNew.phone = req.body.phone;
          profileNew.position = req.body.position;
          profileNew.profileImageName = '/uploads/' + req.file.filename;
          profileNew.author = req.user._id;
          profileNew.save(function(err){
            if(err){
              return next(err);
            } else{
              req.flash('success', 'Your profile has beeupdated!');
              return res.redirect('/profile');
            }
          });
        }
      });
    }
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
  var upload2 = upload.single('articleImage');
  upload2(req, res, function(err){
    req.checkBody('title', 'A title is required!').notEmpty();
    req.checkBody('body', 'The body is required!').notEmpty();
    // Get errors
    let errors = req.validationErrors();
    if(errors){
      let article = {};
      article.title = req.body.title;
      article.body = req.body.body;
      return res.render('add_news', {
        title: 'Add News',
        article: article,
        errors: errors
      });
    } else if(req.file == undefined){
      let article = new Article();
      article.title = req.body.title;
      article.author = req.user._id;
      article.body = req.body.body;
      article.timestamp = new Date().toDateString();

      article.save(function(err){
        if(err){
          return next(err);
        } else{
          req.flash('success', 'Your News has been added!');
          res.redirect('/news');
        }
      });
    } else{
      let article = new Article();
      article.title = req.body.title;
      article.author = req.user._id;
      article.body = req.body.body;
      article.timestamp = new Date().toDateString();
      article.articleImage = '/uploads/' + req.file.filename;

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
          let query = {author:user._id};
          Profile.findOne(query, function(err, profile){
            if(err){
              return next(err);
            } else{
              return res.render('article', {
                title: article.title,
                article: article,
                profile: profile,
                author: user.firstName + ' ' + user.lastName
              });
            }
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
  var upload2 = upload.single('articleImage');
  upload2(req, res, function(err){
    req.checkBody('title', 'A title is required!').notEmpty();
    req.checkBody('body', 'The body is required!').notEmpty();

    // Get errors
    let errors = req.validationErrors();
    if(errors){
      let article = {};
      article.title = req.body.title;
      article.body = req.body.body;
      res.render('edit_news', {
        title: 'Edit News',
        article: article,
        errors: errors
      });
    } else if(req.file == undefined){
      Article.findById(req.params.id, function(err, article){
        if(err){
          return next(err);
        } else if(article.author == req.user._id){
          let editedArticle = {};
          editedArticle.title = req.body.title;
          editedArticle.body = req.body.body;
          editedArticle.timestamp = new Date().toDateString();

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
    } else{
      Article.findById(req.params.id, function(err, article){
        if(err){
          return next(err);
        } else if(article.author == req.user._id){
          let editedArticle = {};
          editedArticle.title = req.body.title;
          editedArticle.body = req.body.body;
          editedArticle.timestamp = new Date().toDateString();
          editedArticle.articleImage = '/uploads/' + req.file.filename;

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
        req.flash('danger', 'Your News article has been deleted!');
        res.send('Success');        
      });
    }
  });
});

module.exports = router;