import { exec } from "node:child_process";

const urls = [
    "http://localhost:5014/",
    "http://localhost:5173/",
];

setTimeout(() => {
    console.log("Opening dev URLs...");
    for (const url of urls) {
        exec(`cmd /c start "" "${url}"`);
    }
}, 1500);
