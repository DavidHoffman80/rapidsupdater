'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
});

// Authenticate input against database documents
UserSchema.statics.authenticate = function(email, password, callback){
  User.findOne({ email: email }).exec(function(error, user){
    if(error){
      return callback(error);
    } else if(!user){
      var err = new Error('User not found.');
      err.status = 401;
      return callback(err);
    }
    bcrypt.compare(password, user.password, function(error, result){
      if(result === true){
        return callback(null, user);
      } else{
        return callback();
      }
    });
  });
}

//hash password before saving to the DB
UserSchema.pre('save', function(next){
  var user = this;
  bcrypt.hash(user.password, 10, function(err, hash){
    if(err){
      return next(err);
    }
    user.password = hash;
    next();
  });
});

var User = mongoose.model('user', UserSchema);
module.exports = User;