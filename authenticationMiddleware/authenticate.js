function mustBeLoggedOut(req, res, next){
 if(req.isAuthenticated()){
   req.flash('danger', 'You are already logged in!');
   res.redirect('/news');
 } else{
   return next();
 }
}

function mustBeLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else{
    req.flash('danger', 'You must be logged in!');
    res.redirect('/login');
  }
}

module.exports.mustBeLoggedOut = mustBeLoggedOut;
module.exports.mustBeLoggedIn = mustBeLoggedIn;