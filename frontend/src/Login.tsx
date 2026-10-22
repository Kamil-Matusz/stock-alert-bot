import { useState } from 'react'
import { Button, Center, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { isEmail, useForm } from '@mantine/form'
import { supabase } from './supabase'
import { notifyError } from './notify'

export function Login() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const form = useForm({
    initialValues: { email: '' },
    validate: { email: isEmail('Niepoprawny adres email') },
  })

  async function handleSubmit({ email }: { email: string }) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    })
    setLoading(false)

    if (error) {
      notifyError(error.message)
      return
    }
    setSentTo(email)
  }

  return (
    <Center h="100vh" px="md">
      <Paper withBorder shadow="sm" p="xl" radius="md" w="100%" maw={400}>
        <Stack>
          <Title order={2}>Stock Alerts</Title>
          {sentTo ? (
            <Text>
              Link do logowania wysłany na <b>{sentTo}</b>. Sprawdź skrzynkę.
            </Text>
          ) : (
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                <TextInput label="Email" placeholder="ty@example.com" {...form.getInputProps('email')} />
                <Button type="submit" loading={loading}>
                  Wyślij magic link
                </Button>
              </Stack>
            </form>
          )}
        </Stack>
      </Paper>
    </Center>
  )
}
