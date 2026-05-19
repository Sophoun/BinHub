import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as ldap from "ldapjs";
const Client = (ldap as any).createClient || (ldap as any).default?.createClient || (ldap as any).Client;
import db from "./db";
import { settings } from "./schema";
import { eq, inArray } from "drizzle-orm";

const secretKey = "secret"; // In a real app, use an environment variable
const key = new TextEncoder().encode(secretKey);

export async function getLdapConfig() {
  const result = await db.select().from(settings).where(inArray(settings.key, [
    "ldap_url", "ldap_base_dn", "ldap_bind_dn", "ldap_bind_password", "ldap_search_filter"
  ])).all();
  
  return result.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<Record<string, any>> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function authenticateLdap(
  username: string,
  password: string,
): Promise<boolean> {
  const config = await getLdapConfig();
  const url = config["ldap_url"];
  const baseDn = config["ldap_base_dn"];
  const bindDn = config["ldap_bind_dn"] || "";
  const bindPassword = config["ldap_bind_password"] || "";
  const filter = config["ldap_search_filter"]?.replace("{{username}}", username);

  if (!url || !baseDn || !filter) {
    return false;
  }

  return new Promise((resolve) => {
    const client = Client({ url });

    client.bind(bindDn, bindPassword, (err) => {
      if (err) {
        client.unbind();
        return resolve(false);
      }

      client.search(baseDn, { filter, scope: "sub" }, (err, res) => {
        if (err) {
          client.unbind();
          return resolve(false);
        }

        let userDn: string | null = null;
        res.on("searchEntry", (entry) => {
          userDn = entry.objectName;
        });

        res.on("error", () => {
          client.unbind();
          resolve(false);
        });

        res.on("end", (result) => {
          if (result.status !== 0 || !userDn) {
            client.unbind();
            return resolve(false);
          }

          const userClient = Client({ url });
          userClient.bind(userDn!, password, (err) => {
            userClient.unbind();
            client.unbind();
            resolve(!err);
          });
        });
      });
    });
  });
}

export async function login(user: {
  id: number;
  username: string;
  role: string;
}) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  const cookieStore = await cookies();
  cookieStore.set("session", session, { expires, httpOnly: true });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires as Date,
  });
  return res;
}
