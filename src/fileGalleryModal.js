angular.module('angular-file-gallery')
  .provider('fileGalleryModal', function() {
    var provider = this;

    this.templateUrl = 'templates/file-gallery/modal.tpl.html',
    this.pickAttribute = 'name';
    this.galleryConfig = {};
    this.uploaderConfig = {};
    this.multiple = true;

    var instanceCount = 0;

    this.$get = function($rootScope, $uibModal, fileGallery, $q) {

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

    };
  });
