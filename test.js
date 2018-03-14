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
          article.timestamp = new Date().toDateString();

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
          article.timestamp = new Date().toDateString();
          article.articleImage = '/uploads/' + req.file.filename;

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
    }
  });
});