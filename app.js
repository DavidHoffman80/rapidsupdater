'use strict';

const express = require('express');

var app = express();
// Server started on port 3000
app.listen(3000, function(){
  console.log('Express app listening on port 3000');
});