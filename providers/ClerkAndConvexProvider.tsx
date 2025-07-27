import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'

const convex = new ConvexReactClient (process.env.EXPO_PUBLIC_CONVEX_UR!,{
    unsavedChangesWarning: false
});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!
if (!publishableKey){
  throw new Error(
    'Missing publishable key Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env'
  )
  
}

export default function ClerkAndConvexProvider({children}:{children: React.ReactNode}){
    return(
        <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
            <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
                <ClerkLoaded>{children}</ClerkLoaded>
            </ConvexProviderWithClerk>
        </ClerkProvider>
    )
}