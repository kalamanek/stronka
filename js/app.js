var app = angular.module('app', ['ngRoute', 'ngCookies']);

app.value('globals', { session: '' });

app.service('common', ['$http', 'globals', function($http, globals) {

	this.getSession = function(callback) {
		$http.get('/auth').then(
			function(response) {
				callback(response.data);
			},
			function(err) {
				callback({});
			}
		);
	}
	
}]);