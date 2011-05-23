

	var	http		= require('http'),
			io			= require('socket.io'),
			fs			= require('fs'),
			url		= require('url'),
			path		= require('path'),
			sys		= require('sys')
			;
	// CREATE IO SERVER
	var server		= http.createServer(function(req,res){
		res.writeHead(200,{"Content-Type":"text/html"});
		res.write("Nothing to see here. Move along.");
		res.end();
	})
	
	var users	= [];
	var clientips = [];
	
	server.listen(1337);
	server	= io.listen(server);
	server.on("connection", function(client){		
		
		client.on('connect', function(){
			//client.broadcast('someone connected! users: ' + users.length
			/** CUSTOM WELCOME **/		
		})
		
		client.on('disconnect', function(){
			//users.splice(users.indexOf(client), 1);
			//client.broadcast('client disconnected : <br>' + client);
			for(var i = 0; i < users.length; i++){
				if(users[i].client == client){
					var user	= users[i].name;
					var handler = handlers['/disconnect/'];
					if(handler){
						handler(client, user);
						sys.log(("<{USER}> has disconnected."))
					}
					
					users.splice(i, 1);
					
					handler = handlers['/userlist/'];
					if(handler){
						handler(client, user);
					}
					return;
				}
			}
		})
		
		client.on('message', function(data){
			// APP RULE THERE SHOULD ONLY BE TWO JSON PROPERTIES
			// method and value
			if(!data.method || !data.value) return;
			
			// custom welcome
			if(data.method == '/username/'){
				setTimeout(function(){
					botSay(client, "Irrashaimase! Welcome, " + data.value + "!<br> Thanks for checking out my chat server. I'm still working on the code as of the moment. And if you see this message, it means that I am already asleep. So feel free to test around and provide feedback if possible. I'll check the logs later. Thanks!", true)
				},1000)
				sys.log(("<{USER}> has connected.").replace("{USER}", data.value))
			}
			
			if(data.method == '/message222/'){
				var profanity = "tits,fuck,cock,twat,cum,pussy,shit,fuck you";
				if(profanity.match(data.value.toLowerCase()))
				{
					var user = getClient(client).name;
					if(user == "undefined"){
						handlers['/reconnect/'](client, '');
						return;
					}
					var warning_msgs = [
						"Watch your language, {USER}!",
						"Hey {USER}, You kiss your mother with that mouth?",
						"Like a sumboooodee.. Mr. {USER}. Watch the profanity",
						"Please no profanity in this chatroom, {USER}. K thanks...",
						"Everybody, look at {USER}! He needs some attention. Seriously, watch your language."
					]
					var warningmsg = warning_msgs[Math.round(Math.random() * warning_msgs.length)];
					setTimeout(function(){
						botSay(client, warningmsg.replace("{USER}", user));
					}, 2000)
					
				}
			}
			if(data.method == '/message/'){
				var user = getClient(client).name;
				if(user == "undefined"){
					handlers['/reconnect/'](client, '');
					return;
				}
				var logggs = "<{USER}> {MESSAGE}";
				sys.log(logggs.replace("{USER}", user).replace("{MESSAGE}", data.value));
			}
			
			
			var handler = handlers[data.method];
			
			if(handler){
				handler(client, data.value);
			}
		})
		
	})
	
	function botSay(client, msg, clientonly){
		var value	= "<p style='color:#444;'>" + msg +"</p>";
		var user		= "<p style='color:#c0ffee;'>JamesAdmin</p>";
		client.send({
			'method': '/message/',
			'value': value,
			'user' : user
		})
		if(!clientonly){
			client.broadcast({
				'method': '/message/',
				'value': value,
				'user' : user
			})
		}
	}
	
	//
	var handlers	= {
		'/username/' : function(client, value){
			users.push({
				'name'	: value,
				'client': client
			});
			
			client.broadcast({
				'method': '/username/',
				'value': value
			})
			
			client.send({
				'method': '/username/',
				'value': value
			})
		},
		'/disconnect/' : function(client, value){
			client.broadcast({
				'method': '/disconnect/',
				'value': value
			})
		},
		'/reconnect/' : function(client, value){
			client.send({
				'method': '/reconnect/',
				'value': value
			})
		},
		'/message/' : function(client, value){
			var user	= getClient(client).name;
			if(user == "undefined"){
				handlers['/reconnect/'](client, '');
				return;
			}
			client.broadcast({
				'method': '/message/',
				'value': value,
				'user' : user
			})			
			client.send({
				'method': '/message/',
				'value': value,
				'user' : user
			})	
		},
		'/message2/' : function(client, value){
			var user	= getClient(client).name;
			if(user == "undefined"){
				handlers['/reconnect/'](client, '');
				return;
			}
			client.broadcast({
				'method': '/message2/',
				'value': value,
				'user' : user
			})			
			client.send({
				'method': '/message2/',
				'value': value,
				'user' : user
			})	
		},
		'/userlist/' : function(client, value){
			var list = getClients();
			client.broadcast({
				'method': '/userlist/',
				'value': list
			})
			client.send({
				'method': '/userlist/',
				'value': list
			})
		}
	}
	
	function getClients(){
		var list	= [];
		for(var i = 0; i < users.length; i++){
			list.push({
				'name' : users[i].name
			});
		}
		return list;
	}
	
	function getClient(client){
		for(var i = 0 ; i < users.length; i++){
			if(users[i].client == client)
				return users[i];
		}
		return {'name':'undefined'};
	}
	
	
	
	
	
	
	
	
	
	// CORE SERVER WHERE EVERYTHING RUNS
	var core		= http.createServer(function(req,res){

		if(req.connection.remoteAddress.match(clientips.join("_")) == ""){
			clientips.push(req.connection.remoteAddress);
		}
		
		var	uri	= url.parse(req.url).pathname;		
		if(uri == '/server.js' || uri	== '/'){
			uri 	= '/index.html'
		}
		
		if(uri == '/getipaddress'){
			res.writeHeader(200, {"Content-Type" : "application/json"});
			res.write(JSON.stringify({'address' : clientips}))
			res.end();
			return;
		}
		
		var	file	= path.join(process.cwd(), uri);
		
		// check if file exists in the server
		path.exists(file, function(exists){
			if(!exists){
				res.writeHeader(404, {"Content-Type" : "text/plain"});
				res.end("404 not found? :-(");
			}
		})
		// readfile and check for errors
		fs.readFile(file, "binary", function(error, data){
			if(error){
				res.writeHeader(500, {"Content-Type" : "text/plain"});
				res.end(error + "\n");
				return;
			}
			res.writeHead(200);
			res.write(data, "binary");
			res.end();
		})
	})
	core.listen(80);
