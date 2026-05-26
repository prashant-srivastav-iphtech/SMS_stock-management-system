// middlewares/waf.ts

import { Request, Response, NextFunction } from "express";

/**
 * Production Grade Custom WAF
 *
 * Features:
 * - Browser-safe fingerprint validation
 * - Chrome / Safari / Firefox / Edge support
 * - SQL Injection protection
 * - XSS protection
 * - Command injection protection
 * - Path traversal protection
 * - SSRF protection
 * - Bot / scanner blocking
 * - AI crawler blocking
 * - Rate limiting
 * - Honeypot trap
 * - Security headers
 */

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
  // Scanners
  "sqlmap",
  "nikto",
  "nmap",
  "acunetix",
  "masscan",
  "nessus",
  "openvas",
  "wpscan",
  "burpsuite",
  "dirbuster",
  "gobuster",
  "ffuf",
  "hydra",

  // Headless
  "headless",
  "phantomjs",
  "selenium",
  "playwright",
  "puppeteer",

  // AI Bots
  "gptbot",
  "chatgpt",
  "claudebot",
  "anthropic-ai",
  "google-extended",
  "bytespider",
  "ccbot",

  // Crawlers
  "crawler",
  "spider",
  "scraper",

  // Recon
  "scanner",
  "httpclient",
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

const isValidBrowser = (req: Request): boolean => {
  const userAgent = (req.headers["user-agent"] || "").toString();

  const accept = (req.headers["accept"] || "").toString();

  // Allow browsers
  const validBrowsers = [
    "Chrome",
    "Safari",
    "Firefox",
    "Edg",
    "Opera",
    "OPR",
    "Brave",
  ];

  const hasValidBrowser = validBrowsers.some((browser) =>
    userAgent.includes(browser),
  );

  // Browser must include Mozilla
  if (!userAgent.includes("Mozilla")) {
    return false;
  }

  if (!hasValidBrowser) {
    return false;
  }

  // Accept headers
  const validAccept =
    accept.includes("text/html") ||
    accept.includes("application/json") ||
    accept.includes("*/*");

  if (!validAccept) {
    return false;
  }

  return true;
};

export const waf = (req: Request, res: Response, next: NextFunction) => {
  try {
    // ---------------------------------------------------
    // IP
    // ---------------------------------------------------

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();

    // ---------------------------------------------------
    // RATE LIMIT
    // ---------------------------------------------------

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

    // ---------------------------------------------------
    // USER AGENT
    // ---------------------------------------------------

    const userAgent = (req.headers["user-agent"] || "")
      .toString()
      .toLowerCase();

    if (!userAgent || userAgent.length < 10) {
      return res.status(403).json({
        success: false,
        message: "Blocked anonymous request",
      });
    }

    // ---------------------------------------------------
    // BLOCK BOTS / SCANNERS
    // ---------------------------------------------------

    const isBlockedAgent = blockedAgents.some((agent) =>
      userAgent.includes(agent),
    );

    if (isBlockedAgent) {
      return res.status(403).json({
        success: false,
        message: "Automated agents blocked",
      });
    }

    // ---------------------------------------------------
    // VALIDATE REAL BROWSERS
    // ---------------------------------------------------

    if (!isValidBrowser(req)) {
      return res.status(403).json({
        success: false,
        message: "Invalid browser fingerprint",
      });
    }

    // ---------------------------------------------------
    // BLOCK SUSPICIOUS HEADERS
    // ---------------------------------------------------

    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        return res.status(403).json({
          success: false,
          message: "Suspicious header blocked",
        });
      }
    }

    // ---------------------------------------------------
    // URL SCAN
    // ---------------------------------------------------

    const decodedUrl = decodeURIComponent(req.originalUrl);

    if (scan(decodedUrl)) {
      return res.status(403).json({
        success: false,
        message: "Malicious URL detected",
      });
    }

    // ---------------------------------------------------
    // QUERY SCAN
    // ---------------------------------------------------

    if (scan(req.query)) {
      return res.status(403).json({
        success: false,
        message: "Malicious query detected",
      });
    }

    // ---------------------------------------------------
    // BODY SCAN
    // ---------------------------------------------------

    if (scan(req.body)) {
      return res.status(403).json({
        success: false,
        message: "Malicious payload detected",
      });
    }
        
    // ---------------------------------------------------
    // HONEYPOT TRAPS
    // ---------------------------------------------------

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

    // ---------------------------------------------------
    // RESPONSE SECURITY HEADERS
    // ---------------------------------------------------

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
