import { exec } from "node:child_process";

setTimeout(() => {
  exec('cmd /c start "" "http://localhost:5014/"');
}, 1200);
