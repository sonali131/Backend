// models/ChatMessage.js (Example)
const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  userId: {
    // The permanent user ID
    type: String,
    required: true,
    index: true, // Index for faster querying
  },
  sender: {
    // 'user' or 'bot'
    type: String,
    required: true,
  },
  text: {
    // For user messages or simple bot text
    type: String,
  },
  // Add fields from bot responses if needed
  title: String,
  snippet: String,
  link: String,
  image: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
const ChatMessage = require("./models/ChatMessage"); // Import model
const socketIdToUserId = new Map(); // Map socket.id -> userId

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // *** NEW: Listen for user identification ***
  socket.on("identify_user", (userId) => {
    if (userId) {
      console.log(`[${socket.id}] Identified as User ID: ${userId}`);
      socketIdToUserId.set(socket.id, userId);
      // You could potentially fetch initial history here if needed
    } else {
      console.warn(
        `[${socket.id}] Received invalid User ID for identification.`
      );
    }
  });

  socket.on("message", async (message) => {
    const userId = socketIdToUserId.get(socket.id); // *** Get permanent userId ***
    if (!userId) {
      console.log(`[${socket.id}] Ignored message: User not identified.`);
      // Optionally send an error back to client
      // socket.emit('error_message', 'Please identify yourself first.');
      return;
    }

    if (typeof message !== "string" || message.trim() === "") {
      return; // Ignore empty
    }

    console.log(
      `[User: ${userId}, Socket: ${socket.id}] Message: "${message}"`
    );

    // *** Store USER message in DB ***
    try {
      await ChatMessage.create({
        userId: userId,
        sender: "user",
        text: message,
        timestamp: new Date(),
      });
    } catch (dbError) {
      console.error(`[User: ${userId}] DB Error saving user message:`, dbError);
    }

    // Process message and get bot response(s)
    try {
      const botResponses = await searchGoogle(message); // Expects array or string

      // *** Store BOT response(s) in DB ***
      if (Array.isArray(botResponses)) {
        const timestamp = new Date();
        for (const resp of botResponses) {
          try {
            await ChatMessage.create({
              userId: userId,
              sender: "bot",
              text: resp.text || resp.snippet, // Store some text content
              title: resp.title,
              snippet: resp.snippet,
              link: resp.link,
              image: resp.image,
              timestamp: timestamp,
            });
          } catch (dbError) {
            console.error(
              `[User: ${userId}] DB Error saving bot response:`,
              dbError
            );
          }
        }
        socket.emit("response", botResponses); // Send to client
      } else if (typeof botResponses === "string") {
        // Handle error string response
        try {
          await ChatMessage.create({
            userId: userId,
            sender: "bot",
            text: botResponses,
            timestamp: new Date(),
          });
        } catch (dbError) {
          console.error(
            `[User: ${userId}] DB Error saving bot response:`,
            dbError
          );
        }
        socket.emit("response", [{ sender: "bot", text: botResponses }]);
      }
      // ... handle other response types if necessary
    } catch (error) {
      console.error(`[User: ${userId}] Error processing message:`, error);
      try {
        await ChatMessage.create({
          userId: userId,
          sender: "bot",
          text: "Internal error occurred.",
          timestamp: new Date(),
        });
      } catch (dbError) {
        console.error(dbError);
      }
      socket.emit("response", [
        { sender: "bot", text: "Sorry, an internal error occurred." },
      ]);
    }
  });

  // *** NEW: Fetch Persistent History ***
  socket.on("get_my_history", async () => {
    const userId = socketIdToUserId.get(socket.id);
    if (!userId) {
      console.log(
        `[${socket.id}] Request for history failed: User not identified.`
      );
      socket.emit("chat_history_data", {
        history: [],
        error: "User not identified.",
      });
      return;
    }

    try {
      // Fetch sorted history for the user, limit results for performance
      const userHistory = await ChatMessage.find({ userId: userId })
        .sort({ timestamp: 1 }) // Sort oldest to newest
        .limit(200); // Limit number of messages fetched

      console.log(
        `[User: ${userId}] Sending ${userHistory.length} history items.`
      );
      // Send history back (ensure frontend expects this format)
      socket.emit("chat_history_data", { history: userHistory, error: null });
    } catch (dbError) {
      console.error(`[User: ${userId}] DB error fetching history:`, dbError);
      socket.emit("chat_history_data", {
        history: [],
        error: "Failed to retrieve history.",
      });
    }
  });

  socket.on("disconnect", () => {
    const userId = socketIdToUserId.get(socket.id);
    console.log(
      `❌ User disconnected: ${socket.id} (User ID: ${userId || "N/A"})`
    );
    socketIdToUserId.delete(socket.id); // Clean up the map
  });
});
