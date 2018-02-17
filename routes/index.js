'use strict';

const express = require('express');
const router = express.Router();

// GET / Home
router.get('/', function(req, res, next){
  return res.render('index', {
    title: 'Home'
  });
});

// GET /register
router.get('/register', function(req, res, next){
  return res.render('register', {
    title: 'Register'
  });
});

// GET /about
router.get('/about', function(req, res, next){
  return res.render('about', {
    title: 'About'
  });
});

// GET /News
router.get('/news', function(req, res, next){
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
router.get('/news/add', function(req, res, next){
  return res.render('add_news', {
    title: 'Add News'
  });
});

// POST /news/add
router.post('/news/add', function(req, res, next){
  req.checkBody('title', 'A title is required!').notEmpty();
  req.checkBody('author', 'An author is required!').notEmpty();
  req.checkBody('body', 'The body is required!').notEmpty();

  // Get errors
  let errors = req.validationErrors();
  if(errors){
    let article = {};
    article.title = req.body.title;
    article.author = req.body.author;
    article.body = req.body.body;
    res.render('add_news_error', {
      title: 'Add News',
      article: article,
      errors: errors
    });
  } else{
    let article = new Article();
    article.title = req.body.title;
    article.author = req.body.author;
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
router.get('/news/:id', function(req, res, next){
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
router.get('/news/edit/:id', function(req, res, next){
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
router.post('/news/edit/:id', function(req, res, next){
  req.checkBody('title', 'A title is required!').notEmpty();
  req.checkBody('author', 'An author is required!').notEmpty();
  req.checkBody('body', 'The body is required!').notEmpty();

  // Get errors
  let errors = req.validationErrors();
  if(errors){
    let article = {};
    article.title = req.body.title;
    article.author = req.body.author;
    article.body = req.body.body;
    res.render('edit_news_error', {
      title: 'Edit News',
      article: article,
      errors: errors
    });
  } else{
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
        req.flash('success', 'Your News article has been updated!');
        res.redirect('/news/'+article._id);
      }
    });
  }
});

// DELETE a single article
router.delete('/news/:id', function(req, res, next){
  let query = {_id:req.params.id}
  Article.remove(query, function(err){
    if(err){
      return next(err);
    }
    req.flash('success', 'Your News article has been deleted!');
    res.send('Success');
    
  });
});

module.exports = router;