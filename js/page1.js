app.controller('Page1', ['$http',
    function ($http) {
        var self = this;

        self.userGroups = [];
        self.chatMessages = {};
        self.currentGroup_id = null;
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

        self.getChat = function (group_id) {
            $http.put('/groups', {_id: group_id}).then(
                function (rep) {
                    try {
                        self.chatMessages = rep.data;
                        self.currentGroup_id = group_id;
                    } catch (err) {
                    }
                },
                function (err) {
                }
            );
        }

        self.sendMessage = function () {
            $http.post('/group/messages', {text: self.message.text, group_id: self.currentGroup_id}).then(
                function (rep) {
                    try {
                        self.getChat(self.currentGroup_id);
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