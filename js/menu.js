app.constant('routes', [
    {route: '/', templateUrl: 'html/home.html', controller: 'Home', controllerAs: 'ctrl', onlyLoggedIn: false},
    {route: '/1',templateUrl: 'html/page1.html',controller: 'Page1',controllerAs: 'ctrl',menu: 'Current active Chats',onlyLoggedIn: true},
    {route: '/2',templateUrl: 'html/page2.html',controller: 'Page2',controllerAs: 'ctrl',menu: 'add/remove chat',onlyLoggedIn: true}
]);

app.config(['$routeProvider', 'routes', function ($routeProvider, routes) {
    for (var i in routes) {
        $routeProvider.when(routes[i].route, routes[i]);
    }
    $routeProvider.otherwise({redirectTo: '/'});
}]);

app.controller('Menu', ['$http', '$location', '$cookies', 'common', 'globals', 'routes', 'ws',
    function ($http, $location, $cookies, common, globals, routes, ws) {


        var self = this;
		self.lastMessage = globals.lastMessage;
		
        self.refreshMenu = function () {

            self.menu = [];

            for (var i in routes) {
                if (routes[i].menu && (self.loggedUser || !routes[i].onlyLoggedIn)) {
                    self.menu.push({route: routes[i].route, title: routes[i].menu});
                }
            }
        }
		if(!globals.session.id) {
			common.getSession(function (session) {
				globals = session;
				self.loggedUser = session.login;
				self.loggedName = session.firstName + ' ' + session.lastName;
				ws.init();
				self.refreshMenu();
			});
		}else{
			self.loggedUser = session.login;
		}
        self.navClass = function (page) {
            return page === $location.path() ? 'active' : '';
        }

        self.logIn = function () {
            self.loginMsg = '';
            self.login = '';
            self.password = '';
            $("#loginDialog").modal();
        };

        self.logOut = function () {
            self.loggedUser = '';
            self.login = '';
            self.password = '';
            $http.delete('/auth').then(
                function (rep) {},
                function (err) {}
            );
            $("#confirmDialog").modal('hide');
            self.refreshMenu();
        }

        self.confirmLogOut = function () {
            self.confirmText = 'Are you sure to log out?';
            self.confirmAction = self.logOut;
            $("#confirmDialog").modal();
        }

        self.register = function () {
            self.registerFirstName = '';
            self.registerLastName = '';
            self.registerEmail = '';
            self.registerPassword = '';
            $("#registerDialog").modal();
        };

        self.validateRegisterCredentials = function () {
            $http.put('/auth', {
                firstName: self.registerFirstName,
                lastName: self.registerLastName,
                email: self.registerEmail,
                password: self.registerPassword
            }).then(
                function (rep) {
                    try {
                        self.registerEmail = rep.data.registerEmail;
                        $("#registerDialog").modal('hide');
                    } catch (err) {
                        self.registerMsg = 'Something goes wrong.';
                    }
                },
                function (err) {
                    self.registerMsg = err.data.registerMsg;
                }
            );
        }

        self.validateCredentials = function () {
            $http.post('/auth', {login: self.login, password: self.password}).then(
                function (rep) {
                    try {
                        self.loggedUser = rep.data.email;
                        self.loggedName = rep.data.firstName + ' ' + rep.data.lastName;
                        $("#loginDialog").modal('hide');
                        self.refreshMenu();
                    } catch (err) {
                        self.loginMsg = 'cannot recive inrfomation about account.';
                        self.loggedUser = '';
                        self.loggedName = '';
                        self.refreshMenu();
                    }
                },
                function (err) {
                    self.loginMsg = 'Wrong login or password.';
                    self.loggedUser = '';
                    self.loggedName = '';
                    self.refreshMenu();
                }
            );
        }

    }
]);