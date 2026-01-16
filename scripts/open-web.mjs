import { exec } from "node:child_process";

setTimeout(() => {
    exec('cmd /c start "" "http://localhost:5173/"');
}, 800);
