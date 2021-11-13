import { MessageType, WAConnection } from "@adiwajshing/baileys";
import fs from "fs";
import { evaluate } from "mathjs";
process.on("uncaughtException", function (err) {
  console.log(err);
});

async function connectToWhatsApp() {
  const conn = new WAConnection();
  let senders = [];
  conn.version = [3, 3234, 9];
  conn.browserDescription = ["Weekly Sharing", "Google Chrome", "95.0.4638.4"];
  conn.on("open", () => {
    // save credentials whenever updated
    console.log(`credentials updated!`);
    const authInfo = conn.base64EncodedAuthInfo(); // get all the auth info we need to restore this session
    fs.writeFileSync("./auth_info.json", JSON.stringify(authInfo, null, "\t")); // save this info to a file
  });
  conn.on("qr", (qr) => {
    console.log(qr);
  });
  // called when WA sends chats
  // this can take up to a few minutes if you have thousands of chats!
  conn.on("chats-received", async ({ hasNewChats }) => {
    console.log(
      `you have ${conn.chats.length} chats, new chats available: ${hasNewChats}`
    );

    const unread = await conn.loadAllUnreadMessages();
    console.log("you have " + unread.length + " unread messages");
  });
  // called when WA sends chats
  // this can take up to a few minutes if you have thousands of contacts!
  conn.on("contacts-received", () => {
    console.log("you have " + Object.keys(conn.contacts).length + " contacts");
  });
  if (fs.existsSync("./auth_info.json")) {
    conn.loadAuthInfo("./auth_info.json");
  }
  await conn.connect();
  conn.on("chat-update", async (chatUpdate) => {
    // `chatUpdate` is a partial object, containing the updated properties of the chat
    // received a new message
    if (chatUpdate.messages && chatUpdate.count) {
      const message = chatUpdate.messages.all()[0];
      let content = message.message.conversation;
      content = content.toLowerCase();
      if (content.startsWith("bot ")) {
        let temp = content.split(" ");
        let question = temp[1];
        let answer = evaluate(question);
        let res = conn.sendMessage(
          message.key.remoteJid,
          "" + answer,
          MessageType.text
        );
        console.log(res);
      }
    } else console.log(chatUpdate); // see updates (can be archived, pinned etc.)
  });
}
// run in main file
connectToWhatsApp().catch((err) => console.log("unexpected error: " + err)); // catch any errors
