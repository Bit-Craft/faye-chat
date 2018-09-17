const express = require("express");
const faye = require("faye");
const http = require("http");
const path = require("path");

const fayePort = 8000;
const telnetPort = 8001;

const app = express();
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../client/dist/index.html")));
app.use(express.static(__dirname + "/../client/dist"));
const server = http.createServer(app);

const bayeux = new faye.NodeAdapter({ mount: "/bayeux" });
bayeux.attach(server);

server.listen(fayePort, () => {
	console.log("Faye server is running on port", fayePort);
});

bayeux.on("handshake", clientId => {
	console.log("User connected: ", clientId);
});

bayeux.on("subscribe", (clientId, channel) => {
	console.log("User [" + clientId + "] subscribed to channel: " + channel);
});

bayeux.on("unsubscribe", (clientId, channel) => {
	console.log("User [" + clientId + "] unsubscribed from channel: " + channel);
});

bayeux.on("publish", (clientId, channel, data) => {
	console.log("User [" + clientId + "] published to channel: " + channel);
});

bayeux.on("disconnect", clientId => {
	console.log("User disconnected: ", clientId);
});

const net = require("net");
const channel = "/CHANNEL_1";
const sockets = [];

const registerTelnetClient = socket => {
	socket.write("Please enter username: \n");

	let name;
	let client;
	socket.on("data", data => {
		const text = data.toString().replace(/\r?\n|\r/g, "");

		if(name)
			client.publish(channel, { name, text });
		else {
			if(text.length < 1)
				socket.write("Please enter username: \n");
			else {
				name = text;

				sockets.push(socket);
				
				client = new faye.Client("http://localhost:8000/bayeux");
				client.subscribe(channel, message => {
					socket.write("[" + message.name + "] " + message.text + "\n");
				});

				socket.write("You have entered the chat! \n\n");
			}
		}
	});
	socket.on("end", () => {
		const index = sockets.indexOf(socket);
		if(index > -1) {
			client.unsubscribe(channel);
			client.disconnect();

			sockets.splice(index, 1);
		}
	});
};

const telnetServer = net.createServer(registerTelnetClient);
telnetServer.listen(telnetPort, () => {
	console.log("Telnet server is running on port", telnetPort);
});