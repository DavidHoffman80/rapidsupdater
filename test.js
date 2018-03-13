// Original code just in case
router.post('/profile/edit', authentication.mustBeLoggedIn, function(req, res, next){
  const email = req.body.email;

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
      user: user,
      profile: profile,
      errors: errors
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
        if(err){
          return next(err);
        } else if(profile){
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
    });
  }
});


// GET /profile/edit/image
router.get('/profile/edit/image', authentication.mustBeLoggedIn, function(req, res, next){
  return res.render('editProfileImage', {
    title: 'Profile Image'
  });
});

// POST /profile/edit/image
router.post('/profile/edit/image', authentication.mustBeLoggedIn, function(req, res, next){
  upload(req, res, function(err){
    if(err){
      return res.render('edit_profile', {
        title: 'Profile Image',
        uploaderrors: err
      });
    } else{
      if(req.file == undefined){
        let profileQuery = {author:req.user._id};
        Profile.findOne(profileQuery, function(err, profile){
          if(err){
            return next(err);
          }
          if(profile){
            if(profile.profileImageName == null){
              let profile = {};
              profile.profileImageName = '/images/avatar.png';
              Profile.update(profileQuery, profile, function(err){
                if(err){
                  return next(err);
                } else{
                  req.flash('success', 'Your profile has been updated!');
                  return res.redirect('/profile');
                }
              });
            }
          }
        });
      } else{
        let profileQuery = {author:req.user._id};
        Profile.findOne(profileQuery, function(err, profile){
          if(err){
            return next(err);
          } else if(profile){
            let profile = {};
            profile.profileImageName = '/uploads/' + req.file.filename;
            Profile.update(profileQuery, profile, function(err){
              if(err){
                return next(err);
              } else{
                req.flash('success', 'Your profile image has been uploaded!');
                return res.redirect('/profile');
              }
            });
          } else{
            let profile = new Profile();
            profile.profileImageName = '/uploads/' + req.file.filename;
            profile.author = req.user._id;

            profile.save(function(err){
              if(err){
                return next(err);
              } else{
                req.flash('success', 'Your profile image has been uploaded!');
                return res.redirect('/profile');
              }
            });
          }
        });
      }
    }
  });
});

// editProfileImage.pug
extends layout

block content
  .main
    if uploaderrors
      .alert.alert-danger.messageCont #{uploaderrors}
    .mainHeading
      h2 #{title}
    form(method='POST', action='/profile/edit/image', enctype='multipart/form-data')
      #form-group
        label Edit Profile Image:
        input.form-control(name='profileImage', type='file')
      input.btn.btn-primary(type='submit', value='Submit')
      a.btn.btn-danger.cncl(href='/profile') Cancel

// New test code for profile
router.post('/profile/edit', upload.single('profileImage'), authentication.mustBeLoggedIn, function(req, res, next){
  const email = req.body.email;
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
        Profile.save(function(err){
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
    upload(req, res, function(err){
      if(err){
        let user = {};
        let profile = {};
        user.email = req.body.email;
        profile.phone = req.body.phone;
        profile.position = req.body.position;
        return res.render('edit_profile', {
          title: 'Edit Profile',
          user: user,
          profile: profile,
          uploaderrors: err
        });
      } else{
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
            let profile = {};
            profile.phone = req.body.phone;
            profile.position = req.body.position;
            profile.profileImageName = '/uploads/' + req.file.filename;
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
            profile.profileImageName = '/uploads/' + req.file.filename;
            profile.author = req.user._id;
            Profile.save(function(err){
              if(err){
                return next(err);
              } else{
                req.flash('success', 'Your profile has been updated!');
                return res.redirect('/profile');
              }
            });
          }
        });
      }
    });
  }
});



upload(req, res, function(err){
      if(err){
        let user = {};
        let profile = {};
        user.email = req.body.email;
        profile.phone = req.body.phone;
        profile.position = req.body.position;
        return res.render('edit_profile', {
          title: 'Edit Profile',
          user: user,
          profile: profile,
          uploaderrors: err
        });
      }
    });


    , upload