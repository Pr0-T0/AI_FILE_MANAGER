import fs from "fs";
import os from "os";
import path from "path";

// Read XDG user dirs (Linux)
function readXDGDirs(home: string): string[] {
  const file = path.join(home, ".config/user-dirs.dirs");
  const dirs: string[] = [];

  if (!fs.existsSync(file)) return dirs;

  const content = fs.readFileSync(file, "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/XDG_(.+?)_DIR="(.+?)"/);
    if (match) {
      let dir = match[2].replace("$HOME", home);
      if (fs.existsSync(dir)) dirs.push(dir);
    }
  }
  return dirs;
}

export function getRootScanPaths(): string[] {
  const home = os.homedir();
  const platform = process.platform;

  let scanDirs: string[] = [home]; // shallow scan here

  if (platform === "linux") {
    scanDirs = scanDirs.concat(readXDGDirs(home));
  }

  if (platform === "darwin") {
    const macDirs = ["Documents", "Downloads", "Desktop", "Pictures"];
    macDirs.forEach(dir => {
      const p = path.join(home, dir);
      if (fs.existsSync(p)) scanDirs.push(p);
    });
  }

  if (platform === "win32") {
    const winDirs = ["Documents", "Downloads", "Desktop", "Pictures", "Videos", "Music"];
    winDirs.forEach(dir => {
      const p = path.join(home, dir);
      if (fs.existsSync(p)) scanDirs.push(p);
    });
  }

  return Array.from(new Set(scanDirs.filter(fs.existsSync)));
}
