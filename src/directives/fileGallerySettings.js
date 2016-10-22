angular.module('angular-file-gallery')
	.factory('fileGalleryHelper', function ($q) {
		var canvasBuffer = document.createElement('canvas');
		return {
			getImageData:  function (file) {
				return $q(function (resolve, reject) {
					if (!window.FileReader)
						reject();
					var fileReader = new FileReader();
					fileReader.onloadend = function () {
						var image = new Image();
						image.onerror = reject;
						image.onload = function () {
							canvasBuffer.width = this.width;
							canvasBuffer.height = this.height;
							var context = canvasBuffer.getContext('2d');
							context.drawImage(image, 0, 0);
							resolve(context.getImageData(0, 0, this.width, this.height));
						};
						image.src = fileReader.result;
					};
					fileReader.onerror = reject;
					fileReader.readAsDataURL(file);
				});
			},
			dataURItoBlob: function (dataURI) {
				var byteString;
				if (dataURI.split(',')[0].indexOf('base64') >= 0)
					byteString = atob(dataURI.split(',')[1]);
				else
					byteString = unescape(dataURI.split(',')[1]);
				var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
				var ia = new Uint8Array(byteString.length);
				for (var i = 0; i < byteString.length; i++) {
					ia[i] = byteString.charCodeAt(i);
				}
				return new Blob([ia], {type: mimeString});
			},
			imageDataToFile:  function (data, fileName) {
				canvasBuffer.width = data.width;
				canvasBuffer.height = data.height;
				canvasBuffer.getContext('2d').putImageData(data, 0, 0);
				var file = this.dataURItoBlob(canvasBuffer.toDataURL());
				file.lastModifiedDate = new Date();
				file.name = fileName.substr(0, fileName.lastIndexOf(".")) + ".png";
				return file;
			},
			drawResponsive: function (src, target) {
				var aspectRatio = src.width / src.height,
					width, height, top, left;
				if (target.width < src.width || target.height < src.height) {
					if (src.width < src.height) {
						height = target.height;
						width = Math.round(height * aspectRatio);
					}
					else {
						width = target.width;
						height = Math.round(width / aspectRatio);
					}
				}
				else {
					width = src.width;
					height = src.height;
				}
				top = Math.round((target.height - height) / 2);
				left = Math.round((target.width - width) / 2);

				var context = target.getContext('2d');
				context.fillStyle = "rgb(0,0,0)";
				context.fillRect (0, 0, target.width, target.height);
				context.drawImage(src, left, top, width, height);
			},
			putImageData: function (data, canvas) {
				canvasBuffer.width = data.width;
				canvasBuffer.height = data.height;
				canvasBuffer.getContext('2d').putImageData(data, 0, 0);
				this.drawResponsive(canvasBuffer, canvas);
			}
		};
	})
	.directive('fileGallerySettings', function (fileGallery, fileGalleryHelper) {

		return {
			scope: {
				file:    '=?',
				gallery: '@',
				apply:   '&'
			},
			restrict:    'E',
			templateUrl: 'templates/file-gallery/settings-pane.tpl.html',
			replace:     true,
			link:        function ($scope, $element) {
				if (!$scope.file)
					return;

				var sourceCanvas = $element.find('canvas.fg-source-canvas')[0],
					resultCanvas = $element.find('canvas.fg-result-canvas')[0],
					previewSize   = $element.find('.fg-preview-container').width(),
					bufferCanvas  = document.createElement('canvas');

				$scope.previewSize = previewSize;
				sourceCanvas.width = resultCanvas.width = previewSize;
				sourceCanvas.height = resultCanvas.height = previewSize;

				$scope.$watch('file', function() {
					fileGalleryHelper
						.getImageData($scope.file)
						.then(function (data) {
							bufferCanvas.width = data.width;
							bufferCanvas.height = data.height;
							bufferCanvas.getContext('2d').putImageData(data, 0, 0);
							fileGalleryHelper.putImageData(data, sourceCanvas);
							$scope.redraw();
						});
				});

				var gallery = fileGallery($scope.gallery).gallery;
				$scope.operations = {
					all:      angular.copy(gallery.config.operations),
					selected: []
				};

				var imageData;
				$scope.redraw = function () {
					// Make operations
					imageData = bufferCanvas.getContext('2d').getImageData(0, 0, bufferCanvas.width, bufferCanvas.height);
					angular.forEach($scope.operations.selected, function (o) {
						if (o.disabled)
							return;
						imageData = o.operation.call(o, imageData);
					});
					fileGalleryHelper.putImageData(imageData, resultCanvas);
				};
				$scope.make = function () {
					var file = fileGalleryHelper.imageDataToFile(imageData, $scope.file.name);
					$scope.apply({file: file});
				};
				$scope.reset = function () {
					$scope.operations.selected.length = 0;
				};
				$scope.add = function (operation) {
					$scope.operations.selected.push(angular.copy(operation));
				};
				$scope.down = function (index) {
					var length = $scope.operations.selected.length,
						next   = Math.min(length - 1, index + 1),
						tmp    = $scope.operations.selected[next];
					$scope.operations.selected[next] = $scope.operations.selected[index];
					$scope.operations.selected[index] = tmp;
				};
				$scope.up = function (index) {
					var prev = Math.max(0, index - 1),
						tmp  = $scope.operations.selected[prev];
					$scope.operations.selected[prev] = $scope.operations.selected[index];
					$scope.operations.selected[index] = tmp;
				};

				$scope.$watch('operations.selected', function (n, o) {
					if (n === o)
						return;
					$scope.redraw();
				}, true);
			}
		};
	});