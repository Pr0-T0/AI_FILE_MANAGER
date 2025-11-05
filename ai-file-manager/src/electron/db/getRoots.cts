import fs from "fs";
import os from "os";
import path from "path";

export function getRootScanPaths(): string[] {
  const platform = process.platform;
  const roots: string[] = [];

  if (platform === "win32") {
    // Scan all existing drives (C:\ D:\ etc)
    for (let i = 67; i <= 90; i++) { // C to Z
      const drive = `${String.fromCharCode(i)}:\\`;
      if (fs.existsSync(drive)) roots.push(drive);
    }
    return roots;
  }

  // macOS & Linux
  roots.push("/"); // root — we will filter subfolders inside scanner

  const home = os.homedir();
  const userRoot = path.dirname(home);

  // Priority directories
  const commonDirs = [
    home,
    path.join(userRoot),
    "/mnt",
    "/media",
    "/Volumes"
  ];

  for (const d of commonDirs) {
    if (fs.existsSync(d)) roots.push(d);
  }

  return [...new Set(roots)];
}
