import { useEffect, useState } from 'react'
import { Center, Loader } from '@mantine/core'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { Login } from './Login'
import { AlertsPage } from './AlertsPage'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }

  return session ? <AlertsPage email={session.user.email ?? ''} /> : <Login />
}
