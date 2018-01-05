'use strict';

const express = require('express');
const bodyParser = require('body-parser');

var app = express();

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

// Server started on port 3000
app.listen(3000, function(){
  console.log('Express app listening on port 3000');
});