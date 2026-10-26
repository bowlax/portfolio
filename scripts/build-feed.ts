// Run with: bun scripts/build-feed.ts

const SITE = "https://lbconsulting.tech";

const root = new URL("..", import.meta.url);
const writingHtml = await Bun.file(new URL("writing.html", root)).text();

type Post = {
  href: string;
  title: string;
  summary: string;
  updated: string;
};

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function textOf(block: string, tag: string, className: string): string {
  const match = block.match(
    new RegExp(`<${tag} class="${className}">([\\s\\S]*?)</${tag}>`),
  );
  if (!match) {
    throw new Error(`Missing .${className} in a post row`);
  }
  return decodeEntities(match[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function toTimestamp(dateText: string): string {
  const match = dateText.match(/^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/);
  if (!match) {
    throw new Error(`Unrecognised date: ${dateText}`);
  }
  const month = MONTHS[match[2]];
  if (!month) {
    throw new Error(`Unrecognised month in date: ${dateText}`);
  }
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}T00:00:00Z`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const posts: Post[] = [];
const rowPattern = /<a href="([^"]+)" class="post-row">([\s\S]*?)<\/a>/g;

for (const match of writingHtml.matchAll(rowPattern)) {
  const href = match[1];
  const block = match[2];
  if (!href.startsWith("posts/") || href.includes("..")) {
    throw new Error(`Unexpected post href: ${href}`);
  }
  posts.push({
    href,
    title: textOf(block, "h2", "post-row-title"),
    summary: textOf(block, "p", "post-row-excerpt"),
    updated: toTimestamp(textOf(block, "span", "post-date")),
  });
}

if (posts.length === 0) {
  throw new Error("No posts found in writing.html");
}

posts.sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0));

const entries = posts.map((post) => {
  const url = `${SITE}/${post.href}`;
  return [
    "  <entry>",
    `    <title>${escapeXml(post.title)}</title>`,
    `    <link rel="alternate" type="text/html" href="${escapeXml(url)}"/>`,
    `    <id>${escapeXml(url)}</id>`,
    `    <updated>${post.updated}</updated>`,
    `    <summary>${escapeXml(post.summary)}</summary>`,
    "  </entry>",
  ].join("\n");
});

const feed = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<feed xmlns="http://www.w3.org/2005/Atom">`,
  `  <title>Lee Ball: Writing</title>`,
  `  <id>${SITE}</id>`,
  `  <updated>${posts[0].updated}</updated>`,
  `  <author>`,
  `    <name>Lee Ball</name>`,
  `  </author>`,
  `  <link rel="alternate" type="text/html" href="${SITE}"/>`,
  `  <link rel="self" type="application/atom+xml" href="${SITE}/feed.xml"/>`,
  ...entries,
  `</feed>`,
  ``,
].join("\n");

await Bun.write(new URL("feed.xml", root), feed);
console.log(`Wrote feed.xml with ${posts.length} entries`);
