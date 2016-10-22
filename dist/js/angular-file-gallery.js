angular.module('angular-file-gallery', [
		'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'angularFileUpload', 'file-gallery-templates'
	])

	.provider('fileGallery', function () {

		var provider = this;

		this.config = {
			uploader: {
				url:               '/',
				autoUpload:        false,
				queueLimit:        99,
				filters:           ['image', 'maxSize'],
				removeAfterUpload: true
			},
			gallery:  {
				url:           '/',
				pageSize:      18,
				page:          1,
				pageSizeParam: 'page-size',
				pageParam:     'page',
				filterParam:   'filter',
				filter:        {},
				format:        function (response) {
					return {total: response.headers('X-Pagination-Total-Count'), items: response.data};
				},
				operations: ['crop', 'resize', 'reflection', 'grayscale']
			}
		};

		this.filterConfig = {
			message: 'Error',
			icon:    'glyphicon glyphicon-exclamation-sign',
			fn:      function (item) {
				return true;
			}
		};

		this.operationConfig = {
			name: 'Operation',
			icon: 'glyphicon glyphicon-cog',
			templateUrl: '',
			controller: ['$scope', function($scope) {}],
			params: {},
			operation: function(imageData) { return imageData; }
		};

		this.$get = ["FileUploader", "$http", function (FileUploader, $http) {
			var galleryRegistry = {},
				filterRegistry  = {},
				operationRegistry = {};

			function Gallery(config) {
				this.config = config;
				this.page = function (page) {
					config.page = page;
					return this;
				};
				this.pageSize = function (pz) {
					config.pageSize = pz;
					return this;
				};
				this.filter = function (filter) {
					config.filter = filter;
					return this;
				};
				this.fetch = function () {
					var url = {};
					url[provider.config.gallery.pageSizeParam] = config.pageSize;
					url[provider.config.gallery.filterParam] = config.filter;
					url[provider.config.gallery.pageParam] = config.page;
					url = jQuery.param(url);
					if(config.url.indexOf("?") === -1)
					{
						url = config.url + "?" + url;
					}
					else
					{
						url= config.url + "&" + url;
					}

					return $http
						.get(url)
						.then(function (response) {
							return config.format(response);
						});
				};

			}

			var factory = function (name) {
				if (name in galleryRegistry)
					return galleryRegistry[name];

				throw new Error('Unknown gallery :"' + name + '"');
			};

			return angular.extend(factory, {
				register: function (name, config) {

					config = angular.merge({}, provider.config, config);

					angular.forEach(config.uploader.filters, function (filter, i) {
						if (angular.isString(filter))
							config.uploader.filters[i] = filterRegistry[filter];
					});

					angular.forEach(config.gallery.operations, function (operation, i) {
						if (angular.isString(operation))
							config.gallery.operations[i] = operationRegistry[operation];
					});

					galleryRegistry[name] = {
						uploader: new FileUploader(config.uploader),
						gallery:  new Gallery(config.gallery)
					};
					return this;
				},
				filter:   function (name, config) {
					filterRegistry[name] = angular.merge({name: name}, provider.filterConfig, config);
					return this;
				},
				operation: function(id, config) {
					operationRegistry[id] = angular.merge({id: id}, provider.operationConfig, config);
					return this;
				}
			});

		}];
	})

angular.module('angular-file-gallery')
	.provider('fileGalleryI18n', function ()
	{
		var translations = {};
		this.load = function (lang, t)
		{
			if (!translations[lang])
				translations[lang] = {};

			for (var i in t)
				translations[lang][i] = t[i];
		};

		this.language = 'en';
		var provider = this;
		this.$get = function ()
		{
			return function (key)
			{
				if (translations[provider.language] && translations[provider.language][key])
					return translations[provider.language][key];
				return key;
			};
		};
	})
	.filter('fgI18n', ["fileGalleryI18n", function (fileGalleryI18n)
	{
		return function (text)
		{
			return fileGalleryI18n(text);
		};
	}])
angular.module('angular-file-gallery')
  .provider('fileGalleryModal', function() {
    var provider = this;

    this.templateUrl = 'templates/file-gallery/modal.tpl.html',
    this.pickAttribute = 'name';
    this.galleryConfig = {};
    this.uploaderConfig = {};
    this.multiple = true;

    var instanceCount = 0;

    this.$get = ["$rootScope", "$uibModal", "fileGallery", "$q", function($rootScope, $uibModal, fileGallery, $q) {

      return {
        open: function(config) {
          config = angular.merge({}, {
            templateUrl: provider.templateUrl,
            pickAttribute : provider.pickAttribute,
            gallery: provider.galleryConfig,
            uploader: provider.uploaderConfig,
            multiple: provider.multiple
          }, config);

          var name = ++instanceCount + "file-gallery-modal",
              $scope = $rootScope.$new();
          angular.extend($scope, {name: name}, config);

          fileGallery
            .register(name, {
                gallery: config.gallery,
                uploader : config.uploader
              });

          return $uibModal
            .open({
              templateUrl: config.templateUrl,
              scope: $scope,
              size: 'lg'
            });
        }
      };

    }];
  });

angular.module('angular-file-gallery')
	.run(["fileGallery", "fileGalleryI18n", function (fileGallery, fileGalleryI18n)
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
	}]);

angular.module('angular-file-gallery')
	.run(["fileGallery", "fileGalleryI18n", function (fileGallery, fileGalleryI18n)
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
	}]);

angular.module('angular-file-gallery')

	.constant('fileGalleryThumbail', 'data:image/jpeg;base64,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')
	.directive('fileGallery', ["fileGallery", "$q", "$timeout", "$window", "fileGalleryThumbail", "$injector", "fileGalleryI18n", function (fileGallery, $q, $timeout, $window, fileGalleryThumbail, $injector, fileGalleryI18n) {

		function readImageAsBase64(image) {
			return $q(function (resolve, reject) {
				if ($window.FileReader) {
					var fileReader = new FileReader();
					fileReader.onloadend = function () {
						resolve(fileReader.result);
					}
					fileReader.readAsDataURL(image);
				}
				else
					reject(null);
			});
		}

		return {
			restrict:    'E',
			scope:       {
				name:          '@',
				pickAttribute: '@',
				selected:      '=?'
			},
			templateUrl: 'templates/file-gallery/layout.tpl.html',

			link: function ($scope, $element, $attrs) {

				var gallery = fileGallery($scope.name).gallery,
					uploader = fileGallery($scope.name).uploader;

				$scope.uploader = uploader;

				$scope.pending = false;
				$scope.multiple = /^true$/i.test($attrs.multiple);

				// model
				$scope.selected = {};
				// active pane id
				$scope.pane = 'gallery'; // 'gallery'|'uploader'|'settings'
				// filter
				$scope.filter = gallery.config.filter;

				$scope.typeFilterOptions = [
					{id: '', label: fileGalleryI18n('All')},
					{id: 'jpg', label: 'Jpg'},
					{id: 'png', label: 'Png'},
					{id: 'gif', label: 'Gif'},
				];
				$scope.filter.type = $scope.typeFilterOptions[0].id;

				// gallery view type
				$scope.view = 'tile'; // 'tile'|'list'

				$scope.page = gallery.config.page;
				$scope.pageSize = gallery.config.pageSize;

				// fetch result
				$scope.items = [];
				$scope.total = 0;

				function loadGallery() {
					$scope.pending = true;
					return gallery
						.page($scope.page)
						.pageSize($scope.pageSize)
						.filter($scope.filter)
						.fetch()
						.then(function (data) {
							$scope.items = data.items;
							$scope.total = data.total;
							return data;
						})
						.finally(function () {
							$scope.pending = false;
						});
				}

				$scope.resetGallery = function () {
					if ($scope.page != 1 || $scope.filter.name || $scope.filter.type) {
						$scope.page = 1;
						$scope.filter = {name: '', type: ''};
					}
					else {
						loadGallery();
					}
				};

				$scope.$watchGroup(['filter.name', 'filter.type', 'page', 'pageSize'], function (n, o) {
					if (n === o)
						return;
					loadGallery();
				}, true);

				$scope.selected = [];
				$scope.pickAttribute = $scope.pickAttribute || "name";
				$scope._pickedKeys = {};

				$scope.pick = function (item) {
					if ($scope._pickedKeys[item[$scope.pickAttribute]]) {
						var index = $scope.selected.indexOf(item);
						$scope.selected.splice(index, 1);
						delete $scope._pickedKeys[item[$scope.pickAttribute]];
					}
					else {
						if (!$scope.multiple) {
							$scope.selected.length = 0;
							$scope._pickedKeys = {};
						}
						$scope.selected.push(item);
						$scope._pickedKeys[item[$scope.pickAttribute]] = true;
					}
				}

				// uploader callbacks:
				uploader.onAfterAddingAll = function (items) {
					$scope.view = 'tile';
					$scope.pending = true;

					var images = [];
					angular.forEach(items, function (item) {
						images.push(readImageAsBase64(item._file)
							.catch(function () {
								item._base64 = fileGalleryThumbail;
								return item;
							})
							.then(function (base64) {
								item._base64 = base64;
								return item;
							}));
						item.onSuccess = function (response) {
							var index = $scope.items.indexOf(item);
							if (index >= 0) {
								$scope.items[index] = response;
							}
						};
					});

					$q
						.all(images)
						.then(function (r) {
							$scope.pane = 'gallery';
							$scope.items = items.reverse().concat($scope.items);
						})
						.finally(function () {
							$scope.pending = false;
						});
				};

				uploader.onWhenAddingFileFailed = function (item, filter) {
					var message = filter.message;
					if (angular.isArray(message) || angular.isFunction(message))
						message = $injector.invoke(message, null, {'$scope': $scope, file: item});

					$scope.pane = 'gallery';
					$scope.view = 'tile';

					item._error = {icon: filter.icon, message: message};
					$scope.items.unshift(item);
				}

				$scope.targetItem = null;
				$scope.openSettings = function(file) {
					$scope.targetItem = file;
					$scope.pane = 'settings';
				};
				$scope.collapseSettings = function() {
					$scope.pane = 'gallery';
				};
				$scope.appySettings = function(file) {
					$scope.pane = 'gallery';
					$timeout(function() {
						$scope.targetItem._file = $scope.targetItem.file = file;
					});
					readImageAsBase64(file)
						.catch(function () {
							$scope.targetItem._base64 = fileGalleryThumbail;
						})
						.then(function (base64) {
							$scope.targetItem._base64 = base64;
						});
				};

				// bootstrap
				loadGallery();
			}
		};

	}]);

angular.module('angular-file-gallery')
	.factory('fileGalleryHelper', ["$q", function ($q) {
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
	}])
	.directive('fileGallerySettings', ["fileGallery", "fileGalleryHelper", function (fileGallery, fileGalleryHelper) {

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
	}]);
angular.module("file-gallery-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("templates/file-gallery/layout.tpl.html","<div class=\"file-gallery\">\r\n	<div class=\"btn-toolbar panes-bar\" role=\"toolbar\" aria-label=\"\">\r\n\r\n		<div class=\"btn-group btn-group-sm\" role=\"group\" aria-label=\"\">\r\n			<button ng-disabled=\"pane == \'uploader\' && pending\" type=\"button\" ng-click=\"pane = \'gallery\';\"\r\n					class=\"btn btn-default\">\r\n				<i class=\"glyphicon glyphicon-picture\"></i>\r\n				{{\"Gallery\" | fgI18n}}\r\n			</button>\r\n\r\n			<button ng-disabled=\"pane == \'gallery\' && pending\" type=\"button\" ng-click=\"pane = \'uploader\';\"\r\n					class=\"btn btn-default\">\r\n				<i class=\"glyphicon glyphicon-upload\"></i>\r\n				{{\"Upload\" | fgI18n}}\r\n			</button>\r\n		</div>\r\n\r\n	</div>\r\n	<hr/>\r\n	<div class=\"fg-pane\" ng-include=\"\'templates/file-gallery/_gallery-pane.tpl.html\'\" ng-if=\"pane == \'gallery\'\"></div>\r\n	<div class=\"fg-pane\" ng-include=\"\'templates/file-gallery/_upload-pane.tpl.html\'\" ng-if=\"pane == \'uploader\'\"></div>\r\n	<div class=\"fg-pane\" ng-include=\"\'templates/file-gallery/_settings-pane.tpl.html\'\" ng-if=\"pane == \'settings\'\"></div>\r\n\r\n</div>\r\n");
$templateCache.put("templates/file-gallery/modal.tpl.html","<div class=\"modal-header\">\r\n	<h3 class=\"modal-title\">\r\n		<i class=\"glyphicon glyphicon-picture\"></i>\r\n		{{\'File gallery\' | fgI18n}}\r\n	</h3>\r\n</div>\r\n<div class=\"modal-body\">\r\n	<file-gallery name=\"{{name}}\" selected=\"selected\" multiple=\"{{multiple}}\"\r\n				  pick-attribute=\"{{pickAttribute}}\"></file-gallery>\r\n</div>\r\n<div class=\"modal-footer\">\r\n	<button class=\"btn btn-primary\" type=\"button\" ng-show=\"selected.length\" ng-click=\"$close(selected)\">{{\'Pick\' | fgI18n}}</button>\r\n	<button class=\"btn btn-warning\" type=\"button\" ng-click=\"$dismiss(true)\">{{\'Close\' | fgI18n}}</button>\r\n</div>\r\n");
$templateCache.put("templates/file-gallery/settings-pane.tpl.html","<div class=\"fg-settings-pane\">\r\n	<div class=\"row\">\r\n		<div class=\"col-xs-6\">\r\n			<div class=\"btn-group btn-group-sm\" uib-dropdown>\r\n				<button id=\"single-button\" type=\"button\" class=\"btn btn-default\" uib-dropdown-toggle\r\n						ng-disabled=\"disabled\">\r\n					<i class=\"glyphicon glyphicon-cog\"></i> {{\'Operation\' | fgI18n}} <span class=\"caret\"></span>\r\n				</button>\r\n				<ul class=\"uib-dropdown-menu\" role=\"menu\" aria-labelledby=\"single-button\">\r\n					<li role=\"menuitem\" ng-repeat=\"operation in operations.all track by $index\">\r\n						<a href=\"\" ng-click=\"add(operation)\">\r\n							<small><i class=\"{{operation.icon}}\"></i> {{operation.name}}</small>\r\n						</a>\r\n					</li>\r\n				</ul>\r\n			</div>\r\n			<div class=\"btn-toolbar btn-group-sm pull-right\" ng-if=\"operations.selected.length\">\r\n				<button class=\"btn btn-default\" uib-popover-template=\"\'templates/file-gallery/_reset-popover.tpl.html\'\"\r\n						popover-is-open=\"popover\"\r\n						popover-placement=\"right\"\r\n						popover-append-to-body=\"true\"\r\n						popover-trigger=\"focus\">\r\n					<i class=\"glyphicon glyphicon-refresh\"></i>\r\n					{{\'Reset\' | fgI18n}}\r\n				</button>\r\n				<button class=\"btn btn-warning\" ng-click=\"make()\">\r\n					<i class=\"glyphicon glyphicon-ok\"></i>\r\n					{{\'Apply\' | fgI18n}}\r\n				</button>\r\n			</div>\r\n			<hr/>\r\n			<div class=\"fg-op-list-container\" ng-style=\"{\'max-height\': previewSize + \'px\'}\">\r\n				<div class=\"fg-op-wrapper\" ng-repeat=\"operation in operations.selected track by $index\"\r\n					 ng-include=\"\'templates/file-gallery/_operation.tpl.html\'\"></div>\r\n			</div>\r\n		</div>\r\n		<div class=\"col-xs-6 fg-preview-container\">\r\n			<ul class=\"nav nav-tabs\">\r\n				<li role=\"presentation\" ng-class=\"{active: source}\">\r\n					<a href=\"\" ng-click=\"source=true\">{{\'Source\' | fgI18n}}</a>\r\n				</li>\r\n				<li role=\"presentation\" ng-class=\"{active: !source}\">\r\n					<a href=\"#\" ng-click=\"source=false\">{{\'Result\' | fgI18n}}</a>\r\n				</li>\r\n			</ul>\r\n			<br/>\r\n\r\n			<div class=\"tab-content\">\r\n				<div role=\"tabpanel\" class=\"tab-pane\" ng-class=\"{active: source}\">\r\n					<canvas class=\"fg-source-canvas\"></canvas>\r\n				</div>\r\n				<div role=\"tabpanel\" class=\"tab-pane\" ng-class=\"{active: !source}\">\r\n					<canvas class=\"fg-result-canvas\"></canvas>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("templates/file-gallery/_gallery-pane.tpl.html","<div class=\"fg-gallery-toolbar text-right\">\r\n	<form class=\"form-inline\">\r\n		<div class=\"form-group\">\r\n			<input type=\"text\" class=\"form-control input-sm\" ng-disabled=\"pending\" ng-model-options=\"{debounce: 1000}\"\r\n				   placeholder=\"{{\'Name\' | fgI18n}}\" ng-model=\"$parent.filter.name\">\r\n		</div>\r\n		<div class=\"form-group\">\r\n			<select class=\"form-control input-sm\" ng-disabled=\"pending\" ng-model=\"$parent.filter.type\"\r\n					ng-options=\"option.id as option.label for option in typeFilterOptions\"></select>\r\n		</div>\r\n		<button type=\"button\" class=\"btn btn-default btn-sm\" ng-disabled=\"pending\" ng-click=\"resetGallery()\"\r\n				title=\"{{\'Reload\' | fgI18n}}\">\r\n			<i class=\"glyphicon glyphicon-refresh\"></i>&nbsp;\r\n		</button>\r\n		<button type=\"button\" class=\"btn btn-default btn-sm \" ng-click=\"$parent.view = \'list\';\"\r\n				ng-show=\"view == \'tile\';\" title=\"{{\'List\' | fgI18n}}\">\r\n			<i class=\"glyphicon glyphicon-th-list\"></i>&nbsp;\r\n		</button>\r\n		<button type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"$parent.view = \'tile\';\" ng-show=\"view == \'list\';\"\r\n				title=\"{{\'Tile\' | fgI18n}}\">\r\n			<i class=\"glyphicon glyphicon-th-large\"></i>&nbsp;\r\n		</button>\r\n	</form>\r\n</div>\r\n<hr/>\r\n<div class=\"fg-gallery\">\r\n	<div class=\"fg-pagination text-right\" ng-include=\"\'templates/file-gallery/_pagination.tpl.html\'\"></div>\r\n	<div class=\"fg-list-items\" ng-if=\"view == \'list\';\" ng-include=\"\'templates/file-gallery/_items-list.tpl.html\'\"></div>\r\n	<div class=\"fg-list-items\" ng-if=\"view == \'tile\';\" ng-include=\"\'templates/file-gallery/_items-grid.tpl.html\'\"></div>\r\n	<div class=\"fg-pagination text-right\" ng-include=\"\'templates/file-gallery/_pagination.tpl.html\'\"></div>\r\n</div>\r\n<div class=\"fg-picked\" ng-show=\"selected.length\">\r\n	<hr/>\r\n	<strong>{{\"Picked\"|fgI18n}}:</strong>\r\n	<a href title=\"{{\'Remove from list\' | fgI18n}}\" class=\"fg-picked-item\" ng-repeat=\"item in selected track by item[pickAttribute]\"\r\n	   ng-style=\"{\'background-image\': \'url(\' + item.img + \')\'}\" ng-click=\"pick(item)\"></a>\r\n</div>\r\n");
$templateCache.put("templates/file-gallery/_items-grid.tpl.html","<div class=\"row\">\r\n\r\n	<div class=\"col-xs-4 col-sm-3 col-md-2\" ng-repeat=\"item in items track by $index\">\r\n		<div class=\"fg-grid-item\"\r\n			 ng-click=\"pick(item);\"\r\n			 ng-class=\"{selected: _pickedKeys[item[pickAttribute]]}\"\r\n			 ng-if=\"!item._file && !item._error\"\r\n			 ng-style=\"{\'background-image\': \'url(\' + item.img + \')\'}\">\r\n			<div class=\"fg-grid-item-name\">\r\n				{{item.name}}\r\n			</div>\r\n		</div>\r\n\r\n		<div class=\"fg-grid-item fg-grid-item-loading\"\r\n			 ng-if=\"item._file && !item._error && item.isUploading\"\r\n			 ng-style=\"{\'background-image\': \'url(\' + item._base64 + \')\'}\">\r\n			<div class=\"progress\" style=\"margin-bottom: 0;\" ng-show=\"uploader.isHTML5\">\r\n				<div class=\"progress-bar\" role=\"progressbar\" ng-style=\"{ \'width\': item.progress + \'%\' }\"></div>\r\n			</div>\r\n			<div class=\"fg-grid-item-name\">\r\n				{{item.file.name}}\r\n			</div>\r\n		</div>\r\n\r\n		<div class=\"fg-grid-item fg-grid-item-ready\"\r\n			 ng-if=\"item._file && !item._error && !item.isUploading\"\r\n			 ng-style=\"{\'background-image\': \'url(\' + item._base64 + \')\'}\">\r\n\r\n			<div class=\"fg-item-toolbar clearfix\">\r\n				<div class=\"btn-group btn-group-xs\">\r\n					<button type=\"button\" class=\"btn btn-default\" title=\"{{\'Cancel\' | fgI18n}}\"\r\n							ng-click=\"item.remove();items.splice($index, 1);\">\r\n						<i class=\"glyphicon glyphicon-ban-circle\"></i>&nbsp;\r\n					</button>\r\n					<button type=\"button\" class=\"btn btn-default\" title=\"{{\'Upload\' | fgI18n}}\" ng-click=\"item.upload()\">\r\n						<i class=\"glyphicon glyphicon-upload\"></i>&nbsp;\r\n					</button>\r\n				</div>\r\n				<div class=\"btn-group btn-group-xs pull-right\">\r\n					<button type=\"button\" class=\"btn btn-default\" title=\"{{\'Settings\' | fgI18n}}\" ng-click=\"openSettings(item)\">\r\n						<i class=\"glyphicon glyphicon-cog\"></i>&nbsp;\r\n					</button>\r\n				</div>\r\n			</div>\r\n		</div>\r\n\r\n		<div class=\"fg-grid-item fg-grid-item-error text-center\" ng-if=\"item._error\">\r\n			<br/>\r\n\r\n			<p class=\"text-danger\">\r\n				<i class=\"{{item._error.icon}}\"></i> {{item._error.message}}\r\n			</p>\r\n		</div>\r\n\r\n	</div>\r\n\r\n	<div class=\"col-xs-12 text-center\" ng-if=\"!items.length\">\r\n		<p>\r\n			<i class=\"glyphicon glyphicon-picture\"></i>\r\n			{{\'No images found.\' | fgI18n}}\r\n		</p>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("templates/file-gallery/_items-list.tpl.html","<table class=\"table table-condensed table-hover table-bordered table-stripped\">\r\n	<thead>\r\n	<tr>\r\n		<th></th>\r\n		<th>{{\'Image\' | fgI18n}}</th>\r\n		<th>{{\'Name\' | fgI18n}}</th>\r\n		<th>{{\'Type\' | fgI18n}}</th>\r\n		<th>{{\'Url\' | fgI18n}}</th>\r\n	</tr>\r\n	</thead>\r\n	<tbody>\r\n	<tr ng-repeat=\"item in items\" ng-if=\"!item._file && !item._error\" ng-class=\"{\'info\': _pickedKeys[item[pickAttribute]]}\">\r\n		<td class=\"text-left\">\r\n			<a href class=\"text-primary\" ng-click=\"pick(item)\" ng-show=\"_pickedKeys[item[pickAttribute]]\">\r\n				<i class=\"glyphicon glyphicon-check\"></i>\r\n			</a>\r\n			<a href class=\"text-muted\" ng-click=\"pick(item)\" ng-show=\"!_pickedKeys[item[pickAttribute]]\">\r\n				<i class=\"glyphicon glyphicon-unchecked\"></i>\r\n			</a>\r\n		</td>\r\n		<td><img alt=\"{{item.name}}\" class=\'img-responsive\' ng-src=\"{{item.img}}\" style=\"max-height: 32px\"/></td>\r\n		<td>{{item.name}}</td>\r\n		<td>{{item.type}}</td>\r\n		<td>\r\n			<a ng-href=\"{{item.img}}\" target=\"_blank\" title=\"{{item.img}}\">\r\n				<i class=\"glyphicon glyphicon-globe\"></i> {{item.img}}\r\n			</a>\r\n		</td>\r\n	</tr>\r\n	<tr ng-show=\"!items.length\">\r\n		<td colspan=\"5\" class=\"text-center\">\r\n			<i class=\"glyphicon glyphicon-picture\"></i>\r\n			{{\'No images found.\' | fgI18n}}\r\n		</td>\r\n	</tr>\r\n	</tbody>\r\n</table>\r\n");
$templateCache.put("templates/file-gallery/_operation.tpl.html","<div class=\"panel panel-default\">\r\n	<div class=\"panel-heading\">\r\n		<h4 class=\"panel-title\">\r\n			<i class=\"{{operation.icon}}\"></i>\r\n			<span>{{operation.name}}</span>\r\n\r\n			<div class=\"btn-group pull-right\">\r\n				<a href=\"\" ng-click=\"operation.disabled=!operation.disabled\">\r\n					<i class=\"glyphicon\" ng-class=\"{\r\n                        \'glyphicon-unchecked text-muted\':operation.disabled,\r\n                        \'glyphicon-check\':!operation.disabled\r\n                    }\"></i>\r\n				</a>\r\n				<a href=\"\" ng-click=\"up($index)\" ng-if=\"$index > 0\">\r\n					<i class=\"glyphicon glyphicon-arrow-up\"></i>\r\n				</a>\r\n				<a href=\"\" ng-click=\"down($index)\" ng-if=\"$index < operations.selected.length - 1\">\r\n					<i class=\"glyphicon glyphicon-arrow-down\"></i>\r\n				</a>\r\n				<a href=\"\" ng-click=\"operations.selected.splice($index, 1)\">\r\n					<i class=\"text-danger glyphicon glyphicon-remove-circle\"></i>\r\n				</a>\r\n				<a href=\"\" ng-click=\"operation.collapsed = !operation.collapsed\">\r\n					<i class=\"glyphicon\" ng-class=\"{\r\n                        \'glyphicon-collapse-up\':!operation.collapsed,\r\n                        \'glyphicon-collapse-down\':operation.collapsed\r\n                    }\"></i>\r\n				</a>\r\n			</div>\r\n		</h4>\r\n	</div>\r\n	<div class=\"panel-body\" ng-include=\"operation.templateUrl\" ng-controller=\"operation.controller\"\r\n		 ng-show=\"!operation.collapsed\">\r\n	</div>\r\n</div>");
$templateCache.put("templates/file-gallery/_pagination.tpl.html","<uib-pagination\r\n		ng-show=\"total > pageSize\"\r\n		total-items=\"total\"\r\n		items-per-page=\"pageSize\"\r\n		ng-model=\"$parent.$parent.$parent.page\"\r\n		max-size=\"4\"\r\n		class=\"pagination-sm\"\r\n		direction-links=\"false\"\r\n		boundary-links=\"true\"\r\n		first-text=\"&laquo;\"\r\n		last-text=\"&raquo;\"\r\n		ng-disabled=\"pending\">\r\n</uib-pagination>\r\n");
$templateCache.put("templates/file-gallery/_reset-popover.tpl.html","<div>\r\n	<h4><i class=\"glyphicon glyphicon-warning-sign\"></i> {{\'Warning!\' | fgI18n}}</h4>\r\n\r\n	<p>{{\'Reset any changes?\' | fgI18n}}</p>\r\n\r\n	<div class=\"btn-toolbar btn-group-sm\">\r\n		<button class=\"btn btn-default\" ng-click=\"reset()\">\r\n			{{\'Yes\' | fgI18n}}\r\n		</button>\r\n		<button class=\"btn btn-default pull-right\">\r\n			{{\'No\' | fgI18n}}\r\n		</button>\r\n	</div>\r\n</div>");
$templateCache.put("templates/file-gallery/_settings-pane.tpl.html","<h4>\r\n	<i class=\"glyphicon glyphicon-cog\"></i>\r\n	{{\'File settings\' | fgI18n}}\r\n	<a href=\"\" ng-click=\"collapseSettings()\" class=\"btn btn-default btn-sm pull-right\" title=\"{{\'Collapse\'|fgI18n}}\">\r\n		<i class=\"glyphicon glyphicon-triangle-left\"></i>\r\n	</a>\r\n</h4>\r\n<hr/>\r\n<file-gallery-settings gallery=\"{{name}}\" file=\"targetItem._file\" apply=\"appySettings(file)\"></file-gallery-settings>");
$templateCache.put("templates/file-gallery/_upload-pane.tpl.html","<div class=\"fg-dropzone-container\">\r\n	<div class=\"fg-dropzone\" nv-file-over nv-file-drop uploader=\"uploader\">\r\n		<div class=\"fg-dropzone-text\">\r\n			<h2>{{\'Drop files here\' | fgI18n}}</h2>\r\n\r\n			<p>{{\'or pick\' | fgI18n}}\r\n				<small><input multiple type=\"file\" nv-file-select uploader=\"uploader\" class=\"inline\"/></small>\r\n			</p>\r\n		</div>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("templates/file-gallery/operation/crop.tpl.html","<form class=\"form-horizontal\">\r\n	<div class=\"row\">\r\n		<div class=\"col-xs-6\">\r\n			<div class=\"form-group\">\r\n				<label for=\"fg-crop-top\" class=\"col-sm-4 control-label\">{{\'Top:\' | fgI18n}} </label>\r\n\r\n				<div class=\"col-sm-8\">\r\n					<input type=\"number\" ng-model=\"operation.params.top\" ng-model-options=\"{debounce: 500}\" step=\"1\"\r\n						   min=\"0\" class=\"form-control input-sm\" id=\"fg-crop-top\">\r\n				</div>\r\n			</div>\r\n			<div class=\"form-group\">\r\n				<label for=\"fg-crop-left\" class=\"col-sm-4 control-label\">{{\'Left:\' | fgI18n}} </label>\r\n\r\n				<div class=\"col-sm-8\">\r\n					<input type=\"number\" ng-model=\"operation.params.left\" ng-model-options=\"{debounce: 500}\" step=\"1\"\r\n						   min=\"0\" class=\"form-control input-sm\" id=\"fg-crop-left\">\r\n				</div>\r\n			</div>\r\n		</div>\r\n		<div class=\"col-xs-6\">\r\n			<div class=\"form-group\">\r\n				<label for=\"fg-crop-right\" class=\"col-sm-4 control-label\">{{\'Right:\' | fgI18n}} </label>\r\n\r\n				<div class=\"col-sm-8\">\r\n					<input type=\"number\" ng-model=\"operation.params.right\" ng-model-options=\"{debounce: 500}\" step=\"1\"\r\n						   min=\"0\" class=\"form-control input-sm\" id=\"fg-crop-right\">\r\n				</div>\r\n			</div>\r\n			<div class=\"form-group\">\r\n				<label for=\"fg-crop-bottom\" class=\"col-sm-4 control-label\">{{\'Bottom:\' | fgI18n}} </label>\r\n\r\n				<div class=\"col-sm-8\">\r\n					<input type=\"number\" ng-model=\"operation.params.bottom\" ng-model-options=\"{debounce: 500}\" step=\"1\"\r\n						   min=\"0\" class=\"form-control input-sm\" id=\"fg-crop-bottom\">\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</form>");
$templateCache.put("templates/file-gallery/operation/grayscale.tpl.html","<form class=\"form-horizontal\">\r\n	<div class=\"row\">\r\n		<div class=\"col-xs-12\">\r\n			<div class=\"form-group\">\r\n				<label for=\"fg-grayscale-red\" class=\"col-sm-5 control-label\">{{\'Red weight:\' | fgI18n}} </label>\r\n\r\n				<div class=\"col-sm-4\">\r\n					<input type=\"number\" ng-model=\"operation.params.red\" ng-model-options=\"{debounce: 500}\" step=\"0.01\"\r\n						   min=\"0.0\" max=\"1.0\" class=\"form-control input-sm\" id=\"fg-grayscale-red\">\r\n				</div>\r\n			</div>\r\n			<div class=\"form-group\">\r\n				<label for=\"fg-grayscale-green\" class=\"col-sm-5 control-label\">{{\'Green weight:\' | fgI18n}} </label>\r\n\r\n				<div class=\"col-sm-4\">\r\n					<input type=\"number\" ng-model=\"operation.params.green\" ng-model-options=\"{debounce: 500}\"\r\n						   step=\"0.01\" min=\"0.0\" max=\"1.0\" class=\"form-control input-sm\" id=\"fg-grayscale-green\">\r\n				</div>\r\n			</div>\r\n			<div class=\"form-group\">\r\n				<label for=\"fg-grayscale-blue\" class=\"col-sm-5 control-label\">{{\'Blue weight:\' | fgI18n}} </label>\r\n\r\n				<div class=\"col-sm-4\">\r\n					<input type=\"number\" ng-model=\"operation.params.blue\" ng-model-options=\"{debounce: 500}\" step=\"0.01\"\r\n						   min=\"0.0\" max=\"1.0\" class=\"form-control input-sm\" id=\"fg-grayscale-blue\">\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</form>");
$templateCache.put("templates/file-gallery/operation/reflection.tpl.html","<form class=\"form-horizontal\">\r\n	<div class=\"row\">\r\n		<div class=\"col-xs-12\">\r\n			<label class=\"col-sm-8\">\r\n				<input type=\"checkbox\" ng-model=\"operation.params.reflectHorizontal\"/>\r\n				{{\'Reflect horizontal\' | fgI18n}}\r\n			</label>\r\n			<label class=\"col-sm-8\">\r\n				<input type=\"checkbox\" ng-model=\"operation.params.reflectVertical\"/>\r\n				{{\'Reflect vertical\' | fgI18n}}\r\n			</label>\r\n		</div>\r\n	</div>\r\n</form>");
$templateCache.put("templates/file-gallery/operation/resize.tpl.html","<form class=\"form-horizontal\">\r\n	<div class=\"row\">\r\n		<div class=\"col-xs-6\">\r\n			<div class=\"form-group\">\r\n				<label class=\"col-sm-12 control-label\">\r\n					<input type=\"checkbox\" ng-model=\"operation.params.saveAspectRatio\"/>\r\n					{{\'Save orientation\' | fgI18n}}\r\n				</label>\r\n			</div>\r\n		</div>\r\n		<div class=\"col-xs-6\">\r\n			<div class=\"form-group\">\r\n				<label for=\"fg-resize-width\" class=\"col-sm-4 control-label\">{{\'Width:\' | fgI18n}} </label>\r\n\r\n				<div class=\"col-sm-8\">\r\n					<input type=\"number\" ng-model=\"operation.params.width\" ng-model-options=\"{debounce: 500}\" step=\"1\"\r\n						   min=\"0\" class=\"form-control input-sm\" id=\"fg-resize-right\">\r\n				</div>\r\n			</div>\r\n			<div class=\"form-group\">\r\n				<label for=\"fg-resize-height\" class=\"col-sm-4 control-label\">{{\'Height:\' | fgI18n}} </label>\r\n\r\n				<div class=\"col-sm-8\">\r\n					<input type=\"number\" ng-model=\"operation.params.height\" ng-model-options=\"{debounce: 500}\" step=\"1\"\r\n						   min=\"0\" class=\"form-control input-sm\" id=\"fg-resize-height\">\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</form>");}]);