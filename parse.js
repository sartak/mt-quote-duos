#!/usr/bin/env node
const fs = require("fs");

const duos = {};

const keepCase = {};
const allowed = {};
[
  [keepCase, "keep-case.txt"],
  [allowed, "allowed.txt"],
].forEach(([dict, file]) => {
  fs.readFileSync(file, "utf-8")
    .split("\n")
    .forEach((word) => {
      dict[word] = true;
    });
});

const wordify = (token) => {
  let word = token;

  if (!keepCase[word]) {
    word = word.toLowerCase();
  }

  if (allowed[word] || keepCase[word]) {
    return word;
  }

  if (word.match(/\d|^\s*'\s*$/)) {
    return undefined;
  }
  if (!word.match(/^[a-z-]+('s|s'|'ll|'d|'ve|n't|'re|in')?$/)) {
    return null;
  }
  return word;
};

const tidy = (input) => {
  let output = input.replaceAll(/[‘’]/g, "'");

  output = output.replaceAll(/[“”"](.+?)[“”"]/g, "\n$1\n");
  output = output.replaceAll(/[“”"]/g, "\n");
  output = output.replaceAll(/\((.+?)\)/g, "\n$1\n");
  output = output.replaceAll(/\(|\)/g, "\n");
  output = output.replaceAll(/\[(.+?)\]/g, "\n$1\n");
  output = output.replaceAll(/\[|\]/g, "\n");

  output = output.replaceAll(/(?<=^|\W)'([^']+)'(?=$|\W)/g, "\n$1\n");
  output = output.replaceAll(/(?<=^|\W)'(.+)'(?=$|\W)/g, "\n$1\n");
  output = output.replaceAll(/(?<=^|\W)'(\w+)/g, "\n$1");
  output = output.replaceAll(/(\w+)(?<!s)'(?=$|\W)/g, "$1\n");

  output = output.replaceAll(/\\n/g, "\n");

  output = output.replaceAll(/ - /g, "\n");
  output = output.replaceAll(/[.,…?!;:–—&+=]/g, "\n");

  return output;
};

JSON.parse(fs.readFileSync("english.json")).quotes.forEach(({ text }) => {
  const lines = [];

  tidy(text)
    .split("\n")
    .forEach((chunk) => {
      let line = [];
      chunk.split(" ").forEach((token) => {
        const word = wordify(token);
        if (word === undefined) {
          lines.push(line);
          line = [];
          return;
        }
        if (word === null) {
          throw new Error(`Unhandled token ${token} in text ${text}`);
        }

        if (word.length) {
          line.push(word);
        }
      });
      lines.push(line);
    });

  lines.forEach((line) => {
    for (let i = 0, max = line.length - 1; i < max; i++) {
      const duo = [line[i], line[i + 1]].join(" ");
      duos[duo] = (duos[duo] || 0) + 1;
    }
  });
});

Object.entries(duos)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .forEach(([duo, count]) => {
    if (count > 1) {
      console.log(`${count} ${duo}`);
    }
  });
