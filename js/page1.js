app.controller('Page1', ['$http',
    function ($http) {
        var self = this;

        self.userGroups = [];
        self.allGroups = {};
        self.chatMessages = {};
        self.openedGroup = null;
        self.message = {"text": ""};

        self.getUserGroups = function () {
            $http.get('/user/groups').then(
                function (rep) {
                    try {
                        self.userGroups = rep.data;
                    } catch (err) {
                    }
                },
                function (err) {
                }
            );
        }
        self.getUserGroups();

        self.getGroupNameFrom_id = function (_idgroup) {
            for (let k in self.allGroups) {
                if (self.allGroups[k]._id === _idgroup) {
                    return self.allGroups[k].name;
                }
            }
        }


        self.getChat = function (group_id) {
            $http.put('/groups', {_id: group_id}).then(
                function (rep) {
                    try {
                        self.chatMessages = rep.data;
                        self.openedGroup = group_id;
                    } catch (err) {
                    }
                },
                function (err) {
                }
            );
        }

        self.sendMessage = function () {
            console.log(self.message.text);
            $http.post('/group/messages', {text: self.message.text, group_id: self.openedGroup}).then(
                function (rep) {
                    try {
                        self.getChat(self.openedGroup);
                        self.message.text = "";
                    } catch (err) {
                    }
                },
                function (err) {
                }
            );
        }
    }
]);