app.controller('Page4', ['$http', 'globals', 'ws',
    function ($http, globals,  ws,$scope) {
        var self = this;

		self.groupsUser = {};
		self.currentGroup = {_id : null ,name:'' }
		
        self.allGroups = {};

        self.getAllGroups = function () {
            $http.get('/groups').then(
                function (rep) {
                    try {
                        self.allGroups = rep.data;
                    } catch (err) {
                    }
                },
                function (err) {
                }
            );
        }
		self.getAllGroups();
		
        self.getGroupUsers = function (group_id) {
			self.currentGroup._id = group_id;
			$http.put('/admin/groupusers', {_id: group_id}).then(
				function (rep) {
					try {
						console.log(rep.data);
						self.groupsUser = rep.data;
					} catch (err) {
					}
				},
				function (err) {
			});
			//chat name
			self.allGroups.forEach((v, i) => {
				if(self.allGroups[i]._id === group_id){
					self.currentGroup.name = self.allGroups[i].name;
				}
			});
        };
		self.removeUserFromGroup = function(user_id){
			
			$http.put('/admin/removeuserfromgroup', {user_id: user_id , group_id: self.currentGroup._id}).then(
				function (rep) {
					try {
						console.log(rep.data);
						self.removeUserFromList(user_id);
					} catch (err) {
					}
				},
				function (err) {
			});
		}
		self.removeUserFromList = function(user_id){
			for (let k in self.groupsUser) {
                if (self.groupsUser[k]._id === user_id) {
                    self.groupsUser.splice(k, 1);
					return;
                }
            }
		}
	}
]);
