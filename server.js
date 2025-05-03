// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// const { searchGoogle } = require("./utils/openaiService"); // Correct import
// require("dotenv").config(); // <-- Make sure you have dotenv installed: npm install dotenv

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     // IMPORTANT: For production, restrict this to your actual frontend URL
//     origin: process.env.FRONTEND_URL || "*", // Use env variable or allow all (less secure)
//     methods: ["GET", "POST"],
//   },
// });

// // --- In-Memory Chat History Storage ---
// // Key: socket.id
// // Value: Array of message objects [{ sender: 'user'/'bot', text?, title?, snippet?, link?, image?, timestamp }, ...]
// const chatHistories = new Map();

// app.use(cors()); // Apply CORS middleware
// app.use(express.json()); // Middleware to parse JSON bodies

// app.get("/", (req, res) => {
//   res.send("Backend is running smoothly!");
// });

// io.on("connection", (socket) => {
//   console.log(`✅ User connected: ${socket.id}`);

//   // 1. Initialize history for this connection
//   chatHistories.set(socket.id, []);
//   console.log(`[${socket.id}] Initialized empty history.`);

//   // Helper function to add entries to history safely
//   const addHistoryEntry = (entry) => {
//     const currentUserHistory = chatHistories.get(socket.id);
//     // Ensure history exists before pushing (it should, but good practice)
//     if (currentUserHistory) {
//       currentUserHistory.push(entry);
//       // Optional: Limit history size if needed
//       // if (currentUserHistory.length > MAX_HISTORY_LENGTH) {
//       //   currentUserHistory.shift(); // Remove the oldest entry
//       // }
//       chatHistories.set(socket.id, currentUserHistory); // Update the map
//       console.log(
//         `[${socket.id}] Stored ${entry.sender} entry. History size: ${currentUserHistory.length}`
//       );
//     } else {
//       console.warn(
//         `[${socket.id}] Attempted to add entry, but history was not found.`
//       );
//     }
//   };

//   socket.on("message", async (message) => {
//     console.log(`[${socket.id}] User message received: "${message}"`);

//     if (typeof message !== "string" || message.trim() === "") {
//       console.log(`[${socket.id}] Ignoring empty or invalid message.`);
//       return;
//     }

//     // 2. Store the user's message in their history
//     const userMessageEntry = {
//       sender: "user",
//       text: message,
//       timestamp: new Date().toISOString(),
//     };
//     addHistoryEntry(userMessageEntry);

//     try {
//       // 3. Call the Google Search function
//       const botResponses = await searchGoogle(message); // Expects an array or error string
//       console.log(`[${socket.id}] Google Search API Response received.`);

//       // 4. Store the bot's response(s) in history
//       const timestamp = new Date().toISOString();
//       if (Array.isArray(botResponses)) {
//         botResponses.forEach((resp) => {
//           // Ensure all potential fields are included, even if undefined
//           const botEntry = {
//             sender: "bot",
//             title: resp.title,
//             snippet: resp.snippet,
//             link: resp.link,
//             image: resp.image,
//             text: resp.text, // Include text if it's just a simple text response
//             timestamp: timestamp,
//           };
//           addHistoryEntry(botEntry);
//         });

//         // 5. Send bot response(s) back to the client
//         socket.emit("response", botResponses);
//         console.log(`[${socket.id}] Emitted 'response' to client.`);
//       } else if (typeof botResponses === "string") {
//         // Handle cases where searchGoogle returns a simple error string
//         const errorEntry = {
//           sender: "bot",
//           text: botResponses, // The error message string
//           timestamp: timestamp,
//         };
//         addHistoryEntry(errorEntry);
//         // Send the error message wrapped in an array like regular responses
//         socket.emit("response", [{ sender: "bot", text: botResponses }]);
//         console.log(`[${socket.id}] Emitted error 'response' to client.`);
//       } else {
//         // Handle unexpected response types from searchGoogle
//         console.error(
//           `[${socket.id}] Unexpected response type from searchGoogle:`,
//           botResponses
//         );
//         const errorEntry = {
//           sender: "bot",
//           text: "Sorry, received an unexpected response format from the search service.",
//           timestamp: new Date().toISOString(),
//         };
//         addHistoryEntry(errorEntry);
//         socket.emit("response", [{ sender: "bot", text: errorEntry.text }]);
//       }
//     } catch (error) {
//       console.error(`[${socket.id}] Error processing message:`, error);
//       const errorEntry = {
//         sender: "bot",
//         text: "Sorry, an internal error occurred while fetching results.",
//         timestamp: new Date().toISOString(),
//       };
//       addHistoryEntry(errorEntry);
//       socket.emit("response", [{ sender: "bot", text: errorEntry.text }]);
//     }
//   });

//   // --- Handle request for chat history --- <<<< THIS IS THE NEW HANDLER >>>>
//   socket.on("get_chat_history", () => {
//     console.log(`[${socket.id}] Received request 'get_chat_history'.`);
//     const userHistory = chatHistories.get(socket.id) || []; // Get history or empty array if not found
//     console.log(
//       `[${socket.id}] Sending history (${userHistory.length} items) via 'chat_history_data'.`
//     );
//     // Send the history data back ONLY to the client who asked for it
//     socket.emit("chat_history_data", userHistory);
//   });

//   socket.on("disconnect", (reason) => {
//     console.log(`❌ User disconnected: ${socket.id}. Reason: ${reason}`);
//     // 6. Clean up the history for the disconnected user
//     const deleted = chatHistories.delete(socket.id);
//     if (deleted) {
//       console.log(`[${socket.id}] Cleared history.`);
//     } else {
//       console.warn(
//         `[${socket.id}] Attempted to clear history on disconnect, but it was not found.`
//       );
//     }
//   });

//   socket.on("error", (error) => {
//     console.error(`[${socket.id}] Socket Error:`, error);
//     chatHistories.delete(socket.id); // Clean up on error too
//   });
// });

// // IMPORTANT: Use environment variable for port if available (for deployment)
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

// // --- Security Recommendation ---
// // Move your GOOGLE_API_KEY and SEARCH_ENGINE_ID to a .env file.
// // Access them using process.env.GOOGLE_API_KEY etc.
// // Add .env to your .gitignore file.

// backend/server.js
const express = require("express");
const cors = require("cors");
// Choose one:
// const axios = require('axios'); // Option 1: Use Axios
// Option 2: Use built-in fetch (uncomment if using Node 18+)
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // For older Node versions if needed

const app = express();
const PORT = 3001; // Backend port
const OLLAMA_API_URL = "http://localhost:11434/api/generate"; // Default Ollama endpoint
const OLLAMA_MODEL = "mistral"; // The model you ran with 'ollama run'

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Function to call Ollama ---
async function getLlmResponse(prompt) {
  console.log(`Sending prompt to Ollama (${OLLAMA_MODEL}): "${prompt}"`);
  try {
    const payload = {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false, // Get the full response at once
    };

    // --- Option 1: Using Axios ---
    // const response = await axios.post(OLLAMA_API_URL, payload, { timeout: 120000 }); // 120 second timeout
    // if (response.data && response.data.response) {
    //     return response.data.response.trim();
    // } else {
    //     console.error("Unexpected Ollama response format:", response.data);
    //     return "Error: Could not parse response from LLM.";
    // }

    // --- Option 2: Using built-in fetch (Node 18+) ---
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      // Node fetch doesn't have a direct timeout, use AbortController
      signal: AbortSignal.timeout(120000), // 120 second timeout
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Ollama API request failed with status ${response.status}: ${errorBody}`
      );
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data && data.response) {
      return data.response.trim();
    } else {
      console.error("Unexpected Ollama response format:", data);
      return "Error: Could not parse response from LLM.";
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.error(
        `Error connecting to Ollama at ${OLLAMA_API_URL}. Is Ollama running?`
      );
      return `Error: Could not connect to the local LLM. Please ensure it's running.`;
    } else if (
      error.name === "AbortError" ||
      error.message.includes("timed out")
    ) {
      console.error("Request to Ollama timed out.");
      return "Error: The request to the local LLM timed out.";
    } else {
      console.error("Error communicating with Ollama:", error.message);
      return `Error: An issue occurred while communicating with the local LLM.`;
    }
  }
}

// --- API Endpoint ---
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Message field is required" });
  }

  // Optional: Add context or a system prompt
  // const fullPrompt = `You are a helpful offline assistant. Keep responses concise.\n\nUser: ${userMessage}\nAssistant:`;
  const fullPrompt = userMessage; // Simple passthrough

  const botResponse = await getLlmResponse(fullPrompt);

  console.log("Sending LLM response:", botResponse);
  res.json({ response: botResponse });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
  console.log(
    `Expecting Ollama server at ${OLLAMA_API_URL} with model ${OLLAMA_MODEL}`
  );
});
