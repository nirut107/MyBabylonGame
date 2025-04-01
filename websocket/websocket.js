const { json } = require("stream/consumers");
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8081 });

let rooms = {};
let players = {};

wss.on("connection", (ws) => {
  const playerId = Date.now().toString();
  players[playerId] = { ws, roomId: null };

  console.log(`Player ${playerId} connected`);

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case "requestRooms":
        ws.send(
          JSON.stringify({ type: "roomList", rooms: getAvailableRooms() })
        );
        break;
      case "createRoom":
        createRoom(playerId);
        break;
      case "joinRoom":
        joinRoom(playerId, data.roomId);
        break;
      case "leaveRoom":
        leaveRoom(playerId);
        break;
      case "connetId":
        SentAllIdCheck(data.MyplayerId, data.otherPlayerId, playerId);
        break;
      case "snetToOther":
        players[data.otherPlayerId].ws.send(json.stringify({ type: "your" }));
        break;
      case "sentToOther":
        players[data.otherPlayerId].ws.send(
          JSON.stringify({ type: "setOther", playerId })
        );
        break;
      case "sentToMe":
        players[data.MyplayerId].ws.send(
          JSON.stringify({ type: "setMe", playerId })
        );
        break;
      case "readyToPlay":
        players[data.MyplayerId].ws.send(JSON.stringify({ type: "GameStart" }));
        players[data.otherPlayerId].ws.send(
          JSON.stringify({ type: "GameStart" })
        );
        break;
      case "spawnEnemy":
        players[data.otherPlayerId].ws.send(
          JSON.stringify({
            type: "spawnEnemy",
            name: data.name,
            text: data.text,
            randomNumber: data.randomNumber,
            randomPosition: data.randomPosition,
          })
        );
        break;
      case "delete_enermy":
        players[data.otherPlayerId].ws.send(
          JSON.stringify({
            type: "delete_enermy",
            index: data.indexCorrect,
          })
        );
        break;
      case "delete_heart":
        players[data.otherPlayerId].ws.send(
          JSON.stringify({
            type: "delete_heart",
            life: data.life,
          })
        );
        break;
      case "end":
        players[data.otherPlayerId].ws.send(
          JSON.stringify({
            type: "end",
          })
        );
        break;
      case "GameStartReal":
        console.log("startreal");
        players[data.otherPlayerId].ws.send(
          JSON.stringify({ type: "GameStartReal" })
        );
        break;
      default:
        console.log("Unknown message type:", data.type);
    }
  });

  ws.on("close", () => {
    leaveRoom(playerId);
    delete players[playerId];
    console.log(`Player ${playerId} disconnected`);
  });
});

// <======================== Create room =======================>
function createRoom(playerId) {
  const roomId = `room_${Date.now()}`;
  rooms[roomId] = [playerId];
  players[playerId].roomId = roomId;
  players[playerId].ws.send(
    JSON.stringify({
      type: "joinRoom",
      room: rooms[roomId],
      roomId: roomId,
      playerId: playerId,
    })
  );
  broadcastRooms();
}

function joinRoom(playerId, roomId) {
  console.log(playerId, roomId, players[playerId].roomId);

  if (!rooms[roomId] || rooms[roomId].length >= 2) {
    players[playerId].ws.send(
      JSON.stringify({ type: "roomFull", rooms: getAvailableRooms() })
    );
    return;
  }
  rooms[roomId].push(playerId);
  players[playerId].roomId = roomId;
  rooms[roomId].forEach((id) => {
    if (players[id]?.ws.readyState === WebSocket.OPEN) {
      players[id].ws.send(
        JSON.stringify({
          type: "joinRoom",
          room: rooms[roomId],
          roomId: roomId,
          playerId: id,
        })
      );
    }
  });
  broadcastRooms();
}

function leaveRoom(playerId) {
  const roomId = players[playerId]?.roomId;
  if (!roomId) return;
  console.log("Before:", rooms[roomId]);
  rooms[roomId] = rooms[roomId].filter((id) => id !== playerId);
  console.log("After:", rooms[roomId]);
  if (rooms[roomId].length === 0) delete rooms[roomId];
  players[playerId].roomId = null;
  rooms[roomId]?.forEach((id) => {
    if (players[id]?.ws.readyState === WebSocket.OPEN) {
      players[id].ws.send(
        JSON.stringify({
          type: "joinRoom",
          room: rooms[roomId],
          roomId,
          playerId: id,
        })
      );
    }
  });
  broadcastRooms();
}

function getAvailableRooms() {
  return Object.fromEntries(
    Object.entries(rooms).filter(([_, players]) => players.length < 3)
  );
}

function broadcastRooms() {
  const data = JSON.stringify({ type: "roomList", rooms: getAvailableRooms() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });
}

function SentAllIdCheck(MyplayerId, otherPlayerId, playerId) {
  const data = JSON.stringify({
    type: "checkId",
    MyplayerId,
    otherPlayerId,
    players,
    playerId,
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });
}
console.log("WebSocket server running on ws://localhost:8081");
