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
	.filter('fgI18n', function (fileGalleryI18n)
	{
		return function (text)
		{
			return fileGalleryI18n(text);
		};
	})