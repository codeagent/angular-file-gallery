angular.module('angular-file-gallery')

	.constant('fileGalleryThumbail', 'data:image/jpeg;base64,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')
	.directive('fileGallery', function (fileGallery, $q, $timeout, $window, fileGalleryThumbail, $injector, fileGalleryI18n) {

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

	});
