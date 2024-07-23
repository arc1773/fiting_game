const express = require("express");
const path = require("path");
const { Socket } = require("socket.io");
const { isSet } = require("util/types");
const app = express();
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => console.log(`server on port ${PORT}`));

const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "public")));

var players = {};
var rooms = {
  room1: 0,
  room2: 0,
  room3: 0,
  room4: 0,
  room5: 0,
};

if (rooms) {
  for (let room in rooms) {
    rooms[room] = {
      num: 0,
      users: {
        user1: null,
        user2: null,
      },
      game: false
    };
  }
}

io.on("connection", onConnected);
function onConnected(socket) {
  players[socket.id] = {
    wait_f_e: false,
    game: false,
    room: "none",
    player: null
  };

  var data_to_r = {
    game: false,
    wait_f_e: NaN,
  };

  var data_to_p = {
    update_data: false,
    room: "none",
  };

  var data_to_e = {
  };

  console.log(Object.keys(players).length);

  //console.log(players);
  //console.log(rooms);
  socket.on("give_data", (data) => {
    var clients = io.sockets.adapter.rooms.get(players[socket.id].room);

    players[socket.id].wait_f_e = data.wait_f_e;
    players[socket.id].game = data.game;
    
    if (!players[socket.id].game && !players[socket.id].wait_f_e) {
      if (players[socket.id].room != "none") {
        //console.log(players)
        if (rooms[players[socket.id].room].users.user1 != null) {
          rooms[players[socket.id].room].users.user1 = null;
        } else if (rooms[players[socket.id].room].users.user2 != null) {
          rooms[players[socket.id].room].users.user2 = null;
        }
        players[socket.id].player = null
        rooms[players[socket.id].room].num--;
        socket.leave(players[socket.id].room);
        console.log('player is not looking for game')
        rooms[players[socket.id].room].game = false
        players[socket.id].room = "none";
      }
    }

    if (players[socket.id].game) {
      if (data.p_health < 1) {
        rooms[players[socket.id].room].game = false
        players[socket.id].game = false;
      }

      if (clients) {
        if (clients.size) {
          if (clients.size < 2) {
            rooms[players[socket.id].room].game = false
            players[socket.id].game = false;
          }
        }
      }
    }

    if (players[socket.id].wait_f_e) {
      if (players[socket.id].room == "none") {
        console.log('player is looking for game')
        for (key in rooms) {
          if (rooms[key].num < 2) {
            socket.join(key);
            rooms[key].num++;
            players[socket.id].room = key;
            break;
          } else {
            players[socket.id].room = "no_rooms_was_finded";
          }
        }
        if (rooms[players[socket.id].room].users.user1 == null) {
          rooms[players[socket.id].room].users.user1 = socket.id;
          players[socket.id].player = "first"
          data_to_p.update_data = true
        } 
        else if (rooms[players[socket.id].room].users.user2 == null) {
          rooms[players[socket.id].room].users.user2 = socket.id;
          data_to_p.update_data = true
          players[socket.id].player = "second"
        }
      }

      let secondUser;
      if (clients) {
        clients.forEach((clientId) => {
          if (clientId != socket.id) {
            secondUser = clientId;

            if (players[secondUser].wait_f_e) {
              console.log(`start game`);
              rooms[players[socket.id].room].game = true

              players[socket.id].game = true
              players[socket.id].wait_f_e = false

              players[secondUser].game = true
              players[secondUser].wait_f_e = false
            }
          }
        });
      }
    }

    data_to_e.position = data.position
    data_to_e.velocity = data.velocity
    data_to_e.p_health = data.p_health
    data_to_e.change_sprite_to = data.change_sprite_to
    
    socket.broadcast.to(players[socket.id].room).emit("get_to_enemy", data_to_e);

    if(players[socket.id].room != "none"){
      data_to_r.game = rooms[players[socket.id].room].game
      //data_to_r.game = players[socket.id].game;
      data_to_r.wait_f_e = players[socket.id].wait_f_e
      io.to(players[socket.id].room).emit("get_to_room", data_to_r);
    }
    

    data_to_p.user = players[socket.id].player
    data_to_p.room = players[socket.id].room;
    data_to_p.wait_f_e = data.wait_f_e;
    socket.emit("get_to_player", data_to_p);
    data_to_p = {
      update_data: false,
      room: "none",
    };
  });

  socket.on("disconnect", () => {
    if (players[socket.id].room != "none") {
      if (rooms[players[socket.id].room].users.user1 != null) {
        rooms[players[socket.id].room].users.user1 = null;
      } else if (rooms[players[socket.id].room].users.user2 != null) {
        rooms[players[socket.id].room].users.user2 = null;
      }
      rooms[players[socket.id].room].num--;
    }
    socket.leave(players[socket.id].room);
    delete players[socket.id];
    console.log(Object.keys(players).length);
  });
}
