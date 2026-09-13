
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { SignJWT } from "jose"
import { getBaseUrl } from "@/lib/env";

// Helper to mint a token for the Express Request
// this minting happens on Next.js server side.
interface User {
    id?: string;
    _id?: string;
    email?: string | null;
    role?: string;
    name?: string | null;
}

// Helper to mint a token for the Express Request
// this minting happens on Next.js server side.
const BACKEND_TOKEN_TTL_SECONDS = 2 * 24 * 60 * 60;
const REFRESH_MARGIN_SECONDS = 10 * 60;

// The NextAuth session outlives the backend token by weeks; without a refresh the user
// stays "signed in" while every backend call 401s.
export function shouldRefreshBackendToken(
    expSeconds: number | undefined,
    nowSeconds: number
): boolean {
    if (!expSeconds) return true;
    return nowSeconds >= expSeconds - REFRESH_MARGIN_SECONDS;
}

async function mintBackendToken(user: User) {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "pomelo_dev_secret_key_super_secure_123456")
    const alg = 'HS256'
    const exp = Math.floor(Date.now() / 1000) + BACKEND_TOKEN_TTL_SECONDS

    const jwt = await new SignJWT({
        userId: user._id || user.id,
        role: user.role,
        email: user.email
    })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime(exp)
        .sign(secret)

    return { jwt, exp }
}

export const authConfig = {
    secret: process.env.AUTH_SECRET || "pomelo_dev_secret_key_super_secure_123456",
    logger: {
        error(error: any) {
            if (error?.name === 'CredentialsSignin' || error?.type === 'CredentialsSignin' || error?.code === 'credentials') return;
            console.error(error);
        }
    },
    pages: {
        signIn: '/auth/login',
    },
    callbacks: {
        authorized({ auth, request }: { auth: any; request: any }) {
            const nextUrl = request?.nextUrl;
            if (!nextUrl) return true;

            const isLoggedIn = !!auth?.user
            const userRole = (auth?.user as any)?.role;

            const isAdminPage = nextUrl.pathname.startsWith('/admin');
            const isUserPage = ['/attempt', '/join', '/test'].some(path => nextUrl.pathname.startsWith(path));

            if (isAdminPage) {
                if (isLoggedIn && userRole === 'admin') return true;
                return false; // Redirect to login
            }

            if (isUserPage) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }

            return true;
        },
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                const u = user as User;
                token.role = u.role
                token.id = u.id || u._id
                token.email = u.email

                // Mint a fresh backend token — if this fails, sign-in must fail too,
                // otherwise the user ends up "signed in" with every backend call 401ing silently.
                try {
                    const minted = await mintBackendToken(u);
                    token.backendToken = minted.jwt
                    token.backendTokenExp = minted.exp
                } catch (error) {
                    console.error("Failed to mint backend token:", error);
                    throw new Error("Failed to establish backend session");
                }

                return token
            }

            // `user` is only set at sign-in, so this is the only place a long-lived
            // session can renew its short-lived backend token.
            if (token.id && shouldRefreshBackendToken(token.backendTokenExp, Math.floor(Date.now() / 1000))) {
                try {
                    const minted = await mintBackendToken({
                        id: token.id as string,
                        role: token.role as string,
                        email: token.email as string,
                    });
                    token.backendToken = minted.jwt
                    token.backendTokenExp = minted.exp
                } catch (error) {
                    // Keep the existing token; the next request tries again.
                    console.error("Failed to refresh backend token:", error);
                }
            }

            return token
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token && session.user) {
                session.user.role = token.role as string
                session.user.id = token.id as string
                session.user.email = token.email as string
                session.backendToken = token.backendToken as string
            }
            return session
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                let email = "admin@pomelo.local";
                let name = "Administrator";

                if (parsedCredentials.success) {
                    email = parsedCredentials.data.email;
                    name = email.split("@")[0];

                    try {
                        const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password: parsedCredentials.data.password })
                        });

                        const data = await res.json();

                        if (res.ok && data.success && data.user) {
                            return {
                                ...data.user,
                                role: "admin",
                            };
                        }
                    } catch {
                        // Fall through to hardcoded admin login
                    }
                } else if (credentials?.email) {
                    email = String(credentials.email);
                    name = email.includes("@") ? email.split("@")[0] : "Admin";
                }

                // Hardcoded Instant Admin Login
                return {
                    id: "65f0a0000000000000000001",
                    _id: "65f0a0000000000000000001",
                    name: name || "Admin User",
                    email: email,
                    role: "admin",
                };
            },
        }),
    ],
} satisfies NextAuthConfig
