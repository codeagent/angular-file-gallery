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

		this.$get = function (FileUploader, $http) {
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

		};
	})
