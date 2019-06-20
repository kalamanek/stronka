app.controller('Page5', ['$http', 'globals', 'ws',
    function ($http, globals,  ws) {
        var self = this;
        self.allGroups = {};
		self.data = [];
		self.labels =[];
		
        self.getAllGroups = function () {
            $http.get('/groups').then(
                function (rep) {
                    try {
                        self.allGroups = rep.data;
						for (let k in self.allGroups) {
						$http.put('/admin/groupusers', {_id: self.allGroups[k]._id}).then(
							function (rep) {
								try {
									self.labels.push(self.allGroups[k].name);
									self.data.push(typeof rep.data.length == "undefined" ? 0 :rep.data.length );
								} catch (err) {
								}
							},
							function (err) {
							});
						}
						console.log(rep.data);
                    } catch (err) {
                    }
                },
                function (err) {
                }
            );
        }
		self.getAllGroups();
		
	}
]);
