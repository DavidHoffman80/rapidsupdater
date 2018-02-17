$(document).ready(function(){
  $('.delete-article').on('click', function(e){
    $target = $(e.target);
    const id = $target.attr('data-id');
    $.ajax({
      type: 'DELETE',
      url: '/news/'+id,
      success: function(){
        window.location.href='/news';
      },
      error: function(err){
        console.log(err);
      }
    });
  });
  $('.alert-success').delay(3000).fadeOut('slow');
});