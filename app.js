const express = require("express");
const http = require("http");
const cors = require("cors");
const router = require("./router/router");
require("./store/rooms");
require("./store/activePeers");
const initSocket = require("./utils/socket");

const PORT = process.env.PORT || 30001;
const app = express();
app.use(cors());
app.use("/", router);

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
