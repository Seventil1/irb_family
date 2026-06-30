const AUTH_USER = process.env.AUTH_USER ?? "admin";
const AUTH_PASS = process.env.AUTH_PASS ?? "123123qw";
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "irb-family-pilot-report-session-secret";

const SESSION_COOKIE = "hr_rocket_session";
const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

const PUBLIC_PATHS = new Set(["/favicon.png", "/hr-rocket-mark.png", "/irb-family-logo.png"]);

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
}

function useSecureCookies(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

async function hmacSign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(signature).toString("base64url");
}

async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({
    authenticated: true,
    exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = await hmacSign(encoded);
  return `${encoded}.${signature}`;
}

async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;

  const expected = await hmacSign(encoded);
  if (signature !== expected) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      authenticated?: boolean;
      exp?: number;
    };
    return payload.authenticated === true && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function sessionCookieHeader(token: string, request: Request): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
  ];
  if (useSecureCookies(request)) parts.push("Secure");
  return parts.join("; ");
}

function clearSessionCookieHeader(request: Request): string {
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (useSecureCookies(request)) parts.push("Secure");
  return parts.join("; ");
}

export async function isAuthenticated(request: Request): Promise<boolean> {
  const cookies = parseCookies(request.headers.get("cookie"));
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

function loginPage(showError: boolean) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Вход · HR-Rocket</title>
  <link rel="icon" type="image/png" href="/favicon.png" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0f;
      font-family: "Manrope", system-ui, -apple-system, sans-serif;
      color: #e2e8f0;
      padding: 1rem;
      background-image:
        radial-gradient(circle at 15% 0%, rgba(0, 181, 240, 0.14), transparent 32%),
        radial-gradient(circle at 85% 5%, rgba(230, 0, 126, 0.1), transparent 28%);
    }
    .card {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
      border-radius: 1.5rem;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(12px);
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #00b5f0, #f7941d);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p.sub { margin-top: 0.5rem; font-size: 0.875rem; color: #94a3b8; }
    label { display: block; margin-top: 1.25rem; font-size: 0.875rem; color: #94a3b8; }
    input {
      width: 100%;
      margin-top: 0.375rem;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(0,0,0,0.3);
      color: #fff;
      font-size: 1rem;
      outline: none;
    }
    input:focus { border-color: #00b5f0; }
    button {
      width: 100%;
      margin-top: 1.5rem;
      padding: 0.875rem;
      border: none;
      border-radius: 9999px;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      background: linear-gradient(135deg, #00b5f0, #0090c0);
    }
    button:hover { opacity: 0.9; }
    .error {
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      background: rgba(251,113,133,0.15);
      border: 1px solid rgba(251,113,133,0.3);
      color: #fb7185;
      font-size: 0.875rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <form class="card" method="POST" action="/login">
    <h1>HR-Rocket</h1>
    <p class="sub">Отчёт пилота · IRB Family</p>
    ${showError ? '<div class="error">Неверный логин или пароль</div>' : ""}
    <label for="username">Логин</label>
    <input id="username" name="username" type="text" autocomplete="username" required autofocus />
    <label for="password">Пароль</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required />
    <button type="submit">Войти</button>
  </form>
</body>
</html>`;
}

function redirect(location: string, cookie?: string): Response {
  const headers = new Headers({ Location: location });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

export async function handleAuthRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === "/login") {
    if (request.method === "GET") {
      if (await isAuthenticated(request)) return redirect("/");
      return new Response(loginPage(url.searchParams.get("error") === "1"), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (request.method === "POST") {
      const form = await request.formData();
      const username = String(form.get("username") ?? "");
      const password = String(form.get("password") ?? "");

      if (username === AUTH_USER && password === AUTH_PASS) {
        const token = await createSessionToken();
        return redirect("/", sessionCookieHeader(token, request));
      }

      return redirect("/login?error=1");
    }
  }

  if (pathname === "/logout" && request.method === "GET") {
    return redirect("/login", clearSessionCookieHeader(request));
  }

  if (PUBLIC_PATHS.has(pathname)) return null;

  if (!(await isAuthenticated(request))) {
    return redirect("/login");
  }

  return null;
}
