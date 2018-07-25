$(document).ready(function(){
	$('.delete-query').on('click', function(){
		var id = $(this).data('id');
		var url = '/delete/'+id;
		if(confirm('Delete Query?')){
			$.ajax({
				url: url,
				type:'DELETE',
				success: function(result){
					console.log('Deleting Query...');
					window.location.href='/query';
				},
				error: function(err){
					console.log(err);
				}
			});
		}
	});

	$('.edit-query').on('click', function(){
		$('#edit-form-name').val($(this).data('name'));
		$('#edit-form-query').val($(this).data('query'));
		$('#edit-form-des').val($(this).data('des'));
		$('#edit-form-id').val($(this).data('id'));
	});
});
