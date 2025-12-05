const crypto = require("crypto");
const SECRET = "secret";
const headerB64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
function make(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = headerB64 + "." + body;
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return data + "." + sig;
}
const now = Math.floor(Date.now() / 1000);
console.log("valid", make({ sub: "123", name: "Valid User", iat: now, exp: now + 3600 }));
console.log("expired", make({ sub: "123", name: "Expired User", iat: now - 7200, exp: now - 3600 }));