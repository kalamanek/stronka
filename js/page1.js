app.controller('Page1', ['$http', 'globals', 'ws',
    function ($http, globals,  ws) {
        var self = this;

        self.userGroups = [];
        self.chatMessages = {};
		self.currentGroup = {_id : null ,name:'' }
        self.message = {"text": ""};
		self.lastMessage = globals.lastMessage;
		self.messageAmount = 0;
		self.messageHolder = {};
		
			
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
						if(self.chatMessages !== 0){
							self.chatMessages.reverse();
						}
						self.chatMessages.forEach((v,i) =>{
						self.messageAmount++;
						});
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
			
        };
		self.reqChat = function (group_id){
			$http.put('/groups', {_id: group_id , amount : self.messageAmount}).then(
			
				function (rep) {
					try {
						self.messageHolder = rep.data;
						console.log(self.messageHolder );
						self.messageHolder.forEach((v,i) =>{
							addMessageStart(self.messageHolder[i].name,self.messageHolder[i].text);
						});
						scrollElement.scrollTop = 100;
					} catch (err) {
					}
				},
				function (err) {
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
			
		function addMessageEnd(a,b){
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
			self.messageAmount++ ;
			$("#table").append(r);
		};

		function addMessageStart(a,b){
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
			self.messageAmount++ ;
			$("#table").prepend(r);
		};

		var scrollElement = document.getElementById("scrollElement");
		var lastScrollTop = 0;
		
		scrollElement.addEventListener("scroll", (e) =>{
			var st = scrollElement.scrollTop;
			if(scrollElement.scrollTop == 0  &&  st < lastScrollTop){
				self.reqChat(self.currentGroup._id);
			}
			lastScrollTop = st <= 0 ? 0 : st;
		});
		
		
		
		function gotoBottom(){
				scrollElement.scrollTop = scrollElement.scrollHeight - scrollElement.clientHeight;
		}		
		webSocket = new WebSocket('ws://' + window.location.host);
		
		webSocket.onmessage = function(msg){ // TODO should reply that message seen and change color on server
			if(self.currentGroup._id === self.lastMessage.group_id){
				addMessageEnd(self.lastMessage.from,self.lastMessage.message);
				gotoBottom();
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