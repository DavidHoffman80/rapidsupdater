'use strict';

const express = require('express');
const router = express.Router();


// GET /
router.get('/', function(req, res){
  return res.render('index', { title: 'Home' });
});

// GET /register
router.get('/register', function(req, res){
  return res.render('register', { title: 'Register' });
});

// GET /login
router.get('/login', function(req, res){
  return res.render('login', { title: 'Login' });
});

// GET /about
router.get('/about', function(req, res){
  return res.render('about', { title: 'About' });
});

module.exports = router;