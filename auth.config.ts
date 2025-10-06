import { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks:{
        authorized({ auth, request: { nextUrl }}){
            const isLoggendIn = !!auth?.user;
            const isOnDasboard = nextUrl.pathname.startsWith('/dashboard');
            if(isOnDasboard){
                if(isLoggendIn) return true;
                return false;
            }else if( isLoggendIn){
                return Response.redirect(new URL('dashboard', nextUrl));
            }
            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
