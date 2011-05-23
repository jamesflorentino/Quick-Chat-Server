	$(document).ready(connect);
	var host = "111.68.56.244";
	function connect(){
		var __title	= document.title;
		var last = '';
		var unread	= 0;
		var focused = true;
		var connect_attempts = 0;
		var user	= Math.random() * 5 + "";
		var	socket	= new io.Socket(host, {'port' : 1337});
		var handlers	= {
			'/disconnect/'	: "<div class='disconnect extend'><strong>{val}</strong> has disconnected.</div>",
			'/totalusers/'	: "<span class='totalusers'>Total users online: {t}</span>",
			'/userlist/'	: "<li>{val}</li>",
			'/username/'	: "<div class='connecting extend'><strong>{val}</strong> has connected!</div>",
			'/reconnect/'	: "<div class='connecting extend'><strong>{val}</strong> is reconnecting...</div>",
			'/message/'		: "<div class='entermessage'><strong>{user}</strong><span>{message}<span></div>",
			'/message2/'	: "<div class='entermessage extend'><span>{message}<span></div>",
			'/messageme/'	: "<div class='entermessage right'><strong>{user}</strong><span>{message}<span></div>",
			'/messageme2/'	: "<div class='entermessage right extend'><span>{message}<span></div>"
		}
	
		socket.on('connect', function(){
			if(connect_attempts > 0){
				sendMessage({
					method:'/username/', 
					value:user
				})
				sendMessage({
					method:'/userlist/', 
					value:"1"
				})
			}
			connect_attempts++;
			console.log(">connect");
		})
	
		socket.on('message', function(data){
			JSONparser(data);
		})
	
		socket.on('disconnect', function(){
			console.log(">disconnect");
		})
	
		socket.connect();
		function messageHandler(data){
			var handler = handlers['/message/']
			if(data.user == user){
				handler	= handlers['/messageme/'];	
			}
			
			if(data.user == last){
				handler = handlers['/message2/'];
				if(last == user){
					handler = handlers['/messageme2/'];
				}
			}
			
			last = data.user;
			
			
			update(handler.replace("{user}", data.user).replace("{message}", data.value))
			return;
		}
		function JSONparser(data){
			if(!data.method || !data.value){
				return false;
			} 
			var handler	= handlers[data.method];
			if(handler){
				if(data.method == '/message/'){
					messageHandler(data);
					return;
				}
				if(data.method == '/userlist/'){
					listUsers(data.value);
					return;
				}
				if(data.method == '/reconnect/'){
					
				}
				update(handler.replace("{val}", data.value))
				last = '/';
			}
		}
		function listUsers(list){
		
			$("#ulist").text('');
			$("#ulist").append(("<li class='faint'>{val} users connected.</li>").replace("{val}", list.length));
			for(var i = 0; i<list.length; i++){
				var handler	= handlers['/userlist/'];
				$("#ulist").append(handler.replace('{val}', list[i].name));
			}
		}
	
		function sendMessage(msg){
			socket.send(msg);
		}
	
		var defaultchattext		= "Press enter after your message";
	
		$("#typename").focus(function(e){
			$("#typename").val("");
			$("#typename").removeClass("chatfont2");
			$("#typename").addClass("chatfont");
		});
	
		$("#typein").focus(function(e){
			if($("#typein").val() == defaultchattext){
				$("#typein").val("");
				$("#typein").removeClass("chatfont2");
				$("#typein").addClass("chatfont");
			}
		});
	
		$("#typein").focusout(function(e){
			if($("#typein").val() == ""){
				$("#typein").val(defaultchattext);
				$("#typein").removeClass("chatfont");
				$("#typein").addClass("chatfont2");
			}
		});
	
		$("#typein").bind("keydown", function(e){
			if(e.which == 13){
				sendMessage({
					method:'/message/',
					value: htmlEntities($("#typein").val())
				})
				$("#typein").val('');
			};
		})
	
		$("#typename").bind("keydown", function(e){
			if(e.which == 13){
				if($("#typename").val().length < 1){
					return;
				}
				user = htmlEntities($("#typename").val());
				sendMessage({
					method:'/username/', 
					value:htmlEntities($("#typename").val())
				})
				sendMessage({
					method:'/userlist/', 
					value:"1"
				})
				$("#username strong").text($("#typename").val());
				$("#overlay").hide();
				$("#typename").unbind('keydown');
				$(document).click(function(e){
					$("#typein").focus();
				})
			};
		})
		
		$(document).click(function(e){
			$("#typename").focus();
		})
		
		
		$(window).focus(function(){
			focused = true;
			unread = 0;
			clearInterval(blink_interval);
			document.title = __title;
		})
		$(window).blur(function(){
			focused = false;
		})
	
		$("#typein").val(defaultchattext);
		$("#typein").removeClass("chatfont");
		$("#typein").addClass("chatfont2");
		$("#typename").val("Type your name then press enter.");
		$("#typename").removeClass("chatfont");
		$("#typename").addClass("chatfont2");
		$("#typename").focus();
		$("#overlay").fadeTo(0, .85)
		
		//$("#overlay").fadeTo(0, 0);
		function htmlEntities(str) {
		    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}
		function update(msg){

			//$("#textbox").html(msg + "<br> <strong>" + this.user +"</strong> " + $("#textbox").html());
			//$("#textbox").html(msg + "<br>" + $("#textbox").html())
			$("#contenttext").append(replaceURLWithHTMLLinks(msg) + "");
			$("#textbox").animate({ 'scrollTop' : $("#contenttext").height() }, 200);
			if(!focused){
				unread++;
				document.title = ("({UNREAD}) - {TITLE}").replace("{UNREAD}", unread +"").replace("{TITLE}", __title);
				clearInterval(blink_interval)
				blink_interval = setInterval(blink, 1500);
			}
		}
		var blink_interval;
		var blink_toggle = false;
		function blink(){
			if(!blink_toggle){
				document.title = "New messages!";	
				blink_toggle = true;
			}
			else{
				document.title = ("({UNREAD}) - {TITLE}").replace("{UNREAD}", unread +"").replace("{TITLE}", __title);
				blink_toggle = false;
			}
		}
		function replaceURLWithHTMLLinks(text) {
		  var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		  return text.replace(exp,"<a href='$1'>$1</a>"); 
		}
	
	}
	

