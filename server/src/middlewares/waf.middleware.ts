// middlewares/waf.ts

import { Request, Response, NextFunction } from "express";

const blockedPatterns: RegExp[] = [
  // ---------------- SQL Injection ----------------
  /\bUNION\b.*\bSELECT\b/i,
  /\bDROP\b.*\bTABLE\b/i,
  /\bINSERT\b.*\bINTO\b/i,
  /\bDELETE\b.*\bFROM\b/i,
  /\bUPDATE\b.*\bSET\b/i,
  /\bOR\s+1=1\b/i,
  /\bAND\s+1=1\b/i,
  /--/,
  /;/,

  // ---------------- XSS ----------------
  /<script.*?>.*?<\/script>/i,
  /javascript:/i,
  /onerror=/i,
  /onload=/i,
  /alert\(/i,

  // ---------------- Command Injection ----------------
  /\$\(/,
  /`.*`/,
  /\b(bash|curl|wget|powershell|nc|netcat)\b/i,

  // ---------------- Path Traversal ----------------
  /\.\.\//,
  /\.\.\\/,

  // ---------------- SSRF ----------------
  /169\.254\.169\.254/,
  /127\.0\.0\.1/,
  /localhost/i,

  // ---------------- Sensitive Files ----------------
  /\.env/i,
  /\.git/i,
  /wp-admin/i,
  /xmlrpc\.php/i,

  // ---------------- Log4j ----------------
  /\$\{jndi:/i,
];

const blockedAgents = [
  // API Clients
  "postman",
  "postmanruntime",
  "insomnia",
  "thunder client",
  "thunderclient",
  "paw/",
  "httpie",
  "curl",
  "wget",
  // Security / Vulnerability Scanners
  "sqlmap",
  "nikto",
  "nmap",
  "masscan",
  "zmap",
  "acunetix",
  "nessus",
  "openvas",
  "qualys",
  "wpscan",
  "netsparker",
  "arachni",
  "jaeles",
  "wapiti",
  "whatweb",
  "commix",
  "havij",
  "bbqsql",
  "xsser",
  "feroxbuster",
  "dirbuster",
  "gobuster",
  "ffuf",
  "wfuzz",
  "fimap",
  "skipfish",
  "burpsuite",
  "burp",
  "owasp zap",
  "zap",
  "metasploit",
  "cobalt strike",
  "beef",
  "hydra",
  "medusa",
  "patator",

  // Headless Browsers / Automation
  "headless",
  "headlesschrome",
  "phantomjs",
  "slimerjs",
  "selenium",
  "webdriver",
  "playwright",
  "puppeteer",
  "pyppeteer",
  "chromedriver",
  "geckodriver",
  "undetected_chromedriver",
  "electron",
  "cefsharp",
  "nightmare",
  "htmlunit",
  "mechanize",

  // AI Crawlers / LLM Bots
  "gptbot",
  "chatgpt",
  "openai",
  "claudebot",
  "anthropic-ai",
  "google-extended",
  "googleother",
  "bard",
  "gemini",
  "bytespider",
  "ccbot",
  "amazonbot",
  "omgili",
  "omgilibot",
  "perplexitybot",
  "youbot",
  "cohere-ai",
  "diffbot",
  "facebookbot",
  "meta-externalagent",
  "imagesiftbot",
  "timpibot",

  // Crawlers / Scrapers
  "crawler",
  "crawl",
  "spider",
  "scraper",
  "scrapy",
  "curl",
  "wget",
  "python-requests",
  "aiohttp",
  "httpx",
  "axios",
  "node-fetch",
  "okhttp",
  "libwww-perl",
  "perl",
  "go-http-client",
  "java/",
  "apache-httpclient",
  "httpclient",
  "feedfetcher",
  "rss",
  "fetch",
  "python-urllib",
  "urllib",
  "lwp",
  "guzzlehttp",

  // SEO / Archive Bots
  "ahrefsbot",
  "semrushbot",
  "mj12bot",
  "dotbot",
  "blexbot",
  "seznambot",
  "yandexbot",
  "petalbot",
  "applebot",
  "bingbot",
  "bingpreview",
  "duckduckbot",
  "baiduspider",
  "sogou",
  "exabot",
  "facebot",
  "ia_archiver",
  "archive.org_bot",
  "slurp",

  // Recon / Generic
  "scanner",
  "probe",
  "recon",
  "scan",
  "monitor",
  "checker",
  "validator",
  "analyzer",

  // Suspicious Empty / Fake
  "bot",
  "python",
  "curl/",
  "wget/",
  "libcurl",
  "powershell",
];

const suspiciousHeaders = [
  "x-forwarded-host",
  "x-rewrite-url",
  "x-original-url",
];

const ipMemory = new Map<
  string,
  {
    count: number;
    blockedUntil: number;
    lastRequest: number;
  }
>();

const MAX_REQUESTS = 200;
const BLOCK_TIME = 1000 * 60 * 15;

const scan = (value: any): boolean => {
  if (!value) return false;

  if (typeof value === "string") {
    return blockedPatterns.some((pattern) => pattern.test(value));
  }

  if (Array.isArray(value)) {
    return value.some(scan);
  }

  if (typeof value === "object") {
    return Object.values(value).some(scan);
  }

  return false;
};

export const waf = (req: Request, res: Response, next: NextFunction) => {
  try {
    // IP

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();

    // RATE LIMIT

    if (!ipMemory.has(ip)) {
      ipMemory.set(ip, {
        count: 1,
        blockedUntil: 0,
        lastRequest: now,
      });
    } else {
      const record = ipMemory.get(ip)!;

      if (record.blockedUntil > now) {
        return res.status(429).json({
          success: false,
          message: "IP temporarily blocked",
        });
      }

      // Reset every minute
      if (now - record.lastRequest > 60_000) {
        record.count = 0;
      }

      record.count++;
      record.lastRequest = now;

      if (record.count > MAX_REQUESTS) {
        record.blockedUntil = now + BLOCK_TIME;

        return res.status(429).json({
          success: false,
          message: "Too many requests",
        });
      }
    }

    // USER AGENT

    const userAgent = (req.headers["user-agent"] || "")
      .toString()
      .toLowerCase();

    if (!userAgent || userAgent.length < 10) {
      return res.status(403).json({
        success: false,
        message: "Blocked anonymous request",
      });
    }

    // BLOCK BOTS / SCANNERS

    const isBlockedAgent = blockedAgents.some((agent) =>
      userAgent.includes(agent),
    );

    if (isBlockedAgent) {
      return res.status(403).json({
        success: false,
        message: "Automated agents blocked",
      });
    }

    // BLOCK SUSPICIOUS HEADERS

    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        return res.status(403).json({
          success: false,
          message: "Suspicious header blocked",
        });
      }
    }

    // URL SCAN

    const decodedUrl = decodeURIComponent(req.originalUrl);

    if (scan(decodedUrl)) {
      return res.status(403).json({
        success: false,
        message: "Malicious URL detected",
      });
    }

    if (scan(req.query)) {
      return res.status(403).json({
        success: false,
        message: "Malicious query detected",
      });
    }

    if (scan(req.body)) {
      return res.status(403).json({
        success: false,
        message: "Malicious payload detected",
      });
    }

    const honeypots = [
      "/wp-admin",
      "/phpmyadmin",
      "/.env",
      "/config",
      "/debug",
    ];

    const triggeredTrap = honeypots.some((path) => decodedUrl.includes(path));

    if (triggeredTrap) {
      return res.status(403).json({
        success: false,
        message: "Security trap triggered",
      });
    }

    // RESPONSE SECURITY HEADERS

    res.removeHeader("X-Powered-By");

    res.setHeader("X-Frame-Options", "DENY");

    res.setHeader("X-Content-Type-Options", "nosniff");

    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );

    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "img-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
        "object-src 'none'",
      ].join("; "),
    );

    next();
  } catch (error) {
    console.error("WAF Error:", error);

    return res.status(500).json({
      success: false,
      message: "WAF internal error",
    });
  }
};
