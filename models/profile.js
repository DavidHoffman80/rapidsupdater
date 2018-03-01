'use strict';

let mongoose = require('mongoose');

// Article Schema
let profileSchema = mongoose.Schema({
  phone:{
    type: String,
  },
  position:{
    type: String,
  },
  author:{
    type: String,
    required: true
  }
});

let Profile = module.exports = mongoose.model('Profile', profileSchema);