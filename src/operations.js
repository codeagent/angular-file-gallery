angular.module('angular-file-gallery')
	.run(function (fileGallery, fileGalleryI18n)
	{
		fileGallery
			.operation('crop', {
				name:        fileGalleryI18n('Crop'),
				icon:        'fa fa-crop',
				templateUrl: 'templates/file-gallery/operation/crop.tpl.html',
				controller:  ['$scope', function ($scope)
				{
				}],
				params:      {
					top: 0, left: 0, right: 0, bottom: 0
				},
				operation:   function (imageData)
							 {
								 this.params.top = Math.max(0, Math.min(imageData.height - 1, this.params.top));
								 this.params.left = Math.max(0, Math.min(imageData.width - 1, this.params.left));

								 this.params.right = Math.max(0, this.params.right);
								 this.params.bottom = Math.max(0, this.params.bottom);

								 var tmp = document.createElement('canvas'), ctxt = tmp.getContext('2d'), width = Math.abs(imageData.width - this.params.right - this.params.left), height = Math.abs(imageData.height - this.params.bottom - this.params.top);
								 var newImageData = ctxt.createImageData(width, height);
								 tmp.remove();

								 for (var i = this.params.top, bottom = i + height - 1, destOffset = 0; i <= bottom; i++) {
									 for (var j = this.params.left, right = j + width - 1; j <= right; j++) {
										 var srcOffset = (i * imageData.width + j) * 4;
										 newImageData.data[destOffset] = imageData.data[srcOffset];     // red
										 newImageData.data[destOffset + 1] = imageData.data[srcOffset + 1]; // green
										 newImageData.data[destOffset + 2] = imageData.data[srcOffset + 2]; // blue
										 newImageData.data[destOffset + 3] = imageData.data[srcOffset + 3];	// alpha
										 destOffset += 4;
									 }
								 }
								 return newImageData;
							 }
			})
			.operation('resize', {
				name:        fileGalleryI18n('Resize'),
				icon:        'fa fa-expand',
				templateUrl: 'templates/file-gallery/operation/resize.tpl.html',
				controller:  ['$scope', function ($scope)
				{
				}],
				params:      {
					width: 0, height: 0, saveAspectRatio: true
				},
				operation:   function (imageData)
							 {
								 if (!this.params.width)
									 this.params.width = imageData.width;
								 if (!this.params.height)
									 this.params.height = imageData.height;
					
								 this.params.width = Math.max(1, Math.min(imageData.width, +this.params.width));
								 this.params.height = Math.max(1, Math.min(imageData.height, +this.params.height));
								 var aspectRatio = imageData.width / imageData.height;
								 if (this.params.saveAspectRatio) {
									 this.params.height = Math.round(this.params.width / aspectRatio);
								 }
								 var src = document.createElement('canvas'), dest = document.createElement('canvas');
								 src.width = imageData.width;
								 src.height = imageData.height;
								 src.getContext('2d').putImageData(imageData, 0, 0);
					
								 dest.width = this.params.width;
								 dest.height = this.params.height;
								 dest.getContext('2d').drawImage(src, 0, 0, dest.width, dest.height);
					
								 var newImageData = dest.getContext('2d').getImageData(0, 0, dest.width, dest.height);
								 src.remove();
								 dest.remove();
								 return newImageData;
							 }
			})
			.operation('reflection', {
				name:        fileGalleryI18n('Reflection'),
				icon:        'fa fa-retweet',
				templateUrl: 'templates/file-gallery/operation/reflection.tpl.html',
				controller:  ['$scope', function ($scope)
				{
				}],
				params:      {
					reflectHorizontal: false, reflectVertical: false
				},
				operation:   function (imageData)
							 {
								 var halfWidth = parseInt(imageData.width / 2), halfHeight = parseInt(imageData.height / 2);

								 if (this.params.reflectHorizontal) {
									 for (var i = 0; i < imageData.height; i++) {
										 for (var j = 0; j <= halfWidth; j++) {
											 var srcOffset = (i * imageData.width + j) * 4, destOffset = (i * imageData.width + imageData.width - j) * 4;

											 var tmpRed = imageData.data[destOffset], tmpGreen = imageData.data[destOffset + 1], tmpBlue = imageData.data[destOffset + 2], tmpAlpha = imageData.data[destOffset + 3];
								
											 imageData.data[destOffset] = imageData.data[srcOffset];				// red
											 imageData.data[destOffset + 1] = imageData.data[srcOffset + 1]; // green
											 imageData.data[destOffset + 2] = imageData.data[srcOffset + 2]; // blue
											 imageData.data[destOffset + 3] = imageData.data[srcOffset + 3];	// alpha
								
											 imageData.data[srcOffset] = tmpRed;
											 imageData.data[srcOffset + 1] = tmpGreen;
											 imageData.data[srcOffset + 2] = tmpBlue;
											 imageData.data[srcOffset + 3] = tmpAlpha;
										 }
									 }
								 }
								 if (this.params.reflectVertical) {
									 for (var i = 0; i < halfHeight; i++) {
										 for (var j = 0; j <= imageData.width; j++) {
											 var srcOffset = (i * imageData.width + j) * 4, destOffset = ((imageData.height - i) * imageData.width + j) * 4;

											 var tmpRed = imageData.data[destOffset], tmpGreen = imageData.data[destOffset + 1], tmpBlue = imageData.data[destOffset + 2], tmpAlpha = imageData.data[destOffset + 3];
								
											 imageData.data[destOffset] = imageData.data[srcOffset];				// red
											 imageData.data[destOffset + 1] = imageData.data[srcOffset + 1]; // green
											 imageData.data[destOffset + 2] = imageData.data[srcOffset + 2]; // blue
											 imageData.data[destOffset + 3] = imageData.data[srcOffset + 3];	// alpha
								
											 imageData.data[srcOffset] = tmpRed;
											 imageData.data[srcOffset + 1] = tmpGreen;
											 imageData.data[srcOffset + 2] = tmpBlue;
											 imageData.data[srcOffset + 3] = tmpAlpha;
										 }
									 }
								 }
								 return imageData;
							 }
			})
			.operation('grayscale', {
				name:        fileGalleryI18n('Grayscale'),
				icon:        'fa fa-star-half-o',
				templateUrl: 'templates/file-gallery/operation/grayscale.tpl.html',
				controller:  ['$scope', function ($scope)
				{
				}],
				params:      {
					red: 0.299, green: 0.587, blue: 0.114
				},
				operation:   function (imageData)
							 {
								 this.params.red = Math.max(0.0, Math.min(1.0, +this.params.red));
								 this.params.green = Math.max(0.0, Math.min(1.0, +this.params.green));
								 this.params.blue = Math.max(0.0, Math.min(1.0, +this.params.blue));
					
								 for (var i = 0; i < imageData.data.length; i += 4) {
									 var avg = Math.min(255, imageData.data[i] * this.params.red + imageData.data[i + 1] * this.params.green + imageData.data[i + 2] * this.params.blue);
									 imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = avg;
								 }
								 return imageData;
							 }
			});
	});
