angular.module('angular-file-gallery')
	.run(function (fileGallery, fileGalleryI18n)
	{
		fileGallery
			.filter('image', {
				message: ['file', '$scope', function (file, $scope)
				{
					return fileGalleryI18n('Invalid image format: ') + file.type + fileGalleryI18n('. Allowed: .jpg' + ' .png and .gif')
				}], fn:  function (item, options)
						 {
							 var type = item.type.slice(item.type.lastIndexOf('/') + 1);
							 return /png|jpg|jpeg|gif/i.test(type);
						 }
			})
			.filter('maxSize', {
				message: ['file', '$scope', function (file, $scope)
				{
					return fileGalleryI18n('Too big file size: ') + file.size + fileGalleryI18n('. Max size is 1MB.')
				}], fn:  function (item, options)
						 {
							 return item.size <= 1024 * 1024;
						 }
			})
	});
