import NotifyService from "../services/notify.service";
import UserService from "../services/user.service";
import sendFcmMessage from "../services/fcm";

class MySocket {
  static userActice = {};
  init(io) {
    this.io = io;
    io.on("connection", async function (socket) {
      // Create a new room
      let userID = socket.handshake.query.id;
      MySocket.userActice[userID] = socket.id;
      // notify all friend you online
      await NotifyService.notifyFriendActiveChange(userID, "online");
      await NotifyService.notifyAll();
      socket.on("typing", async (data) => {
        await NotifyService.notifyTyping(userID, data.conversationID);
      });
      
      // socket.on("incoming-call", async (data) => {
      //   await NotifyService.notifyIncomingCall(userID, data.caller);
      // });

      console.log(MySocket.userActice);

      socket.on("disconnect", async (data) => {
        delete MySocket.userActice[userID];
        // noti all friend offline
        console.log("disconnected" + data);
        await NotifyService.notifyFriendActiveChange(userID, "offline");
      });
    });
  }

  async getClientUserId(userId) {
    if (MySocket.userActice[userId] !== undefined) {
      return MySocket.userActice[userId];
    } else {
      const user = await UserService.findID(userId);
      user.fcm.map((token) => {
        sendFcmMessage({
          message: {
            token: token,
            data: {},
            android: {
              direct_boot_ok: true,
            },
          },
        });
      });
      return;
    }

    //
  }

  emit(id, channel, data) {
    this.io.to(id).emit(channel, data);
  }
}

export default new MySocket();