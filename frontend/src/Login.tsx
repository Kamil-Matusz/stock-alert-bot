import { useState } from 'react'
import { Button, Center, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { isEmail, useForm } from '@mantine/form'
import { Trans, useTranslation } from 'react-i18next'
import { supabase } from './supabase'
import { notifyError } from './notify'
import { LanguageSwitch } from './LanguageSwitch'

export function Login() {
  const { t } = useTranslation()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const form = useForm({
    initialValues: { email: '' },
    validate: { email: isEmail(t('login.invalidEmail')) },
  })

  async function handleSubmit({ email }: { email: string }) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
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
          <Group justify="space-between">
            <Title order={2}>Stock Alerts</Title>
            <LanguageSwitch />
          </Group>
          {sentTo ? (
            <Text>
              <Trans i18nKey="login.linkSent" values={{ email: sentTo }} components={{ b: <b /> }} />
            </Text>
          ) : (
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                <TextInput label="Email" placeholder={t('login.emailPlaceholder')} {...form.getInputProps('email')} />
                <Button type="submit" loading={loading}>
                  {t('login.submit')}
                </Button>
              </Stack>
            </form>
          )}
        </Stack>
      </Paper>
    </Center>
  )
}
