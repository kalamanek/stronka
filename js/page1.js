app.controller('Page1', ['$http', 'globals', 'ws',
    function ($http, globals,  ws) {
        var self = this;

        self.userGroups = [];
        self.chatMessages = {};
		self.currentGroup = {_id : null ,name:'' }
        self.message = {"text": ""};
		self.lastMessage = globals.lastMessage;

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
			var Table = document.getElementById("table");
			$("#table tr").remove(); 
			self.userGroups.forEach((v, i) => {
				if(self.userGroups[i]._id === self.currentGroup._id){
					self.userGroups[i].color = 'black';
				}
			});
			
        $http.put('/groups', {_id: group_id}).then(
			
			function (rep) {
				try {
					self.chatMessages = rep.data;
					self.currentGroup._id = group_id;
				} catch (err) {
				}
			},
			function (err) {
			}
            );
			self.userGroups.forEach((v, i) => {
				if(self.userGroups[i]._id === group_id){
					self.currentGroup.name = self.userGroups[i].name;
				}
			});
        }

        self.sendMessage = function () {
            $http.post('/group/messages', {text: self.message.text, group_id: self.currentGroup._id}).then(
                function (rep) {
                    try {
                        self.message.text = "";
                    } catch (err) {
                    }
                },
                function (err) {
                }
            );
        }
			
		function addMessage(a,b){
			var r = document.createElement("TR");
			var ca = document.createElement('td');
			var cb = document.createElement('td');
			var ta = document.createTextNode(a);
			var tb = document.createTextNode(b);
			ca.appendChild(ta);
			cb.appendChild(tb);	
			 var t  = document.getElementById('tbl');


			ca.appendChild(ta);
			cb.appendChild(tb);
		
			r.appendChild(ca);
			r.appendChild(cb);

			$("#table").append(r);
		};
		
		webSocket = new WebSocket('ws://' + window.location.host);
		
		webSocket.onmessage = function(msg){ // TODO should reply that message seen and change color on server
			if(self.currentGroup._id === self.lastMessage.group_id){
				addMessage(self.lastMessage.from,self.lastMessage.message);
			}else{
				self.userGroups.forEach((v, i) => {
					if(self.userGroups[i]._id === self.lastMessage.group_id){
						self.userGroups[i].color = 'blue';
					}
				});
			}
		}

    }
]);