const ws = new WebSocket("ws://localhost:8081");

ws.onopen = () => {
  console.log("Connected to WebSocket");
};
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
  if (data.type === "roomList") updateRoomList(data.rooms);
  if (data.type === "roomFull") {
    updateRoomList(data.rooms);
  }
  if (data.type == "joinRoom") {
    inRoom(data.room, data.roomId, data.playerId);
  }
  if (data.type === "setOther") {
    otherPlayerId = data.playerId;
    if (setupPairReay == 0) {
      setupPairReay = 1;
    } else {
      setupPairReay = 0;
      ws.send(JSON.stringify({ type: "readyToPlay", MyplayerId ,otherPlayerId}));
    }
  }
  if (data.type === "setMe") {
    MyplayerId = data.playerId;
    if (setupPairReay == 0) {
      setupPairReay = 1;
    } else {
      setupPairReay = 0;
      ws.send(JSON.stringify({ type: "readyToPlay", MyplayerId ,otherPlayerId}));
    }
  }
};

let MyplayerId = null;
let otherPlayerId = null;
let setupPairReay = 0;

const singlePlayBtn = document.getElementById("singlePlayBtn");
const matchingBtn = document.getElementById("matchingBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");

// singlePlayBtn.addEventListener("click", singleplay);
matchingBtn.addEventListener("click", matching);
createRoomBtn.addEventListener("click", createRoom);
leaveRoomBtn.addEventListener("click", leaveRoom);

function updateRoomList(rooms) {
  const roomList = document.getElementById("roomList");
  roomList.innerHTML = "";
  Object.keys(rooms).forEach((roomId) => {
    const li = document.createElement("li");
    li.innerHTML = `Room ${roomId} - ${rooms[roomId].length}/2 `;

    const joinButton = document.createElement("img");
    joinButton.src = "image/join.png";
    joinButton.alt = "Clickable Image";
    joinButton.addEventListener("click", () => joinRoom(roomId));
    li.appendChild(joinButton);
    roomList.appendChild(li);
  });
}

function createRoom() {
  ws.send(JSON.stringify({ type: "createRoom" }));
}

function joinRoom(roomId) {
  console.log(roomId);
  ws.send(JSON.stringify({ type: "joinRoom", roomId }));
}
function inRoom(room, roomId, playerId) {
  console.log(room);
  document.getElementById("roomView").style.display = "none";
  document.getElementById("inRoomView").style.display = "";
  document.getElementById("roomIdDisplay").textContent = roomId;
  updatePlayerList(room, playerId);
}

function leaveRoom() {
  MyplayerId = null;
  otherPlayerId = null;
  ws.send(JSON.stringify({ type: "leaveRoom" }));
  document.getElementById("roomView").style.display = "";
  document.getElementById("inRoomView").style.display = "none";
}

function updatePlayerList(players, playerId) {
  const otherPlayer = players.find((id) => id !== playerId);
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = "";
  players.forEach((player) => {
    const li = document.createElement("li");
    playerList.appendChild(li);
    li.textContent = `Player: ${player}`;
    if (players.length === 2) {
      MyplayerId = playerId;
      otherPlayerId = otherPlayer;
      console.log("+++", otherPlayer);
    }
    let startButton = document.getElementById("startGameButton");
    if (players.length === 2 && playerId === players[0]) {
      if (!startButton) {
        startButton = document.createElement("img");
        startButton.id = "startGameButton";
        startButton.src = "image/start.png";
        startButton.alt = "Clickable Image";
        startButton.addEventListener("click", () => {
          ws.send(
            JSON.stringify({ type: "connetId", MyplayerId, otherPlayerId })
          );
        });
        const startbtn = document.getElementById("startbtn");
        startbtn.appendChild(startButton);
      }
      else 
      {
        startButton.style.display = "";
      }
    }
    else
    {
      if (startButton)
        startButton.style.display = "none";
    }
  });
}

function matching() {
  document.getElementById("MenuGame").style.display = "none";
  document.getElementById("roomView").style.display = "";
  ws.send(JSON.stringify({ type: "requestRooms" }));
}

export { MyplayerId, otherPlayerId };
