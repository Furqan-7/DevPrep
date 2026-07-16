import express from "express";
import path = require("node:path");
import { WebSocket, WebSocketServer } from "ws";

const app = express();
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (client) => {
    console.log("New Client Connected");

    client.on("message", (message) => {
        const parsedMessage = JSON.parse(message.toString());
        console.log("Received Message : ", parsedMessage);

        if (parsedMessage.type == "generate") {
            // create a new interview session 
        }
        else if (parsedMessage.type == "answer") {
            // Evalueate the current questions and return the next questions 
        }
        else if (parsedMessage.type == "feedback") {
            // generate the feeback and return it to the user 
        }
    });
});


