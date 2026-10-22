import { useState } from 'react'
import { Button, Group, NumberInput, Stack, Switch, Text, TextInput } from '@mantine/core'
import { isNotEmpty, useForm } from '@mantine/form'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import { supabase, type StockAlert, type StockAlertInput } from './supabase'
import { notifyError, notifySuccess } from './notify'

interface FormValues {
  ticker: string
  name: string
  low_target: number | string
  high_target: number | string
  is_active: boolean
}

const toNumber = (value: number | string) => (value === '' ? null : Number(value))

function validateTargets(high: number | string, values: FormValues) {
  const low = toNumber(values.low_target)
  const highNumber = toNumber(high)
  if (low === null && highNumber === null) return i18n.t('form.targetRequired')
  if (low !== null && highNumber !== null && low >= highNumber) return i18n.t('form.targetOrder')
  return null
}

export function AlertForm({ alert, onSaved }: { alert: StockAlert | null; onSaved: () => void }) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const form = useForm<FormValues, StockAlertInput>({
    initialValues: {
      ticker: alert?.ticker ?? '',
      name: alert?.name ?? '',
      low_target: alert?.low_target ?? '',
      high_target: alert?.high_target ?? '',
      is_active: alert?.is_active ?? true,
    },
    validate: {
      ticker: isNotEmpty(t('form.tickerRequired')),
      name: isNotEmpty(t('form.nameRequired')),
      high_target: validateTargets,
    },
    transformValues: (values) => ({
      ticker: values.ticker.trim().toUpperCase(),
      name: values.name.trim(),
      low_target: toNumber(values.low_target),
      high_target: toNumber(values.high_target),
      is_active: values.is_active,
    }),
  })

  async function handleSubmit(values: StockAlertInput) {
    setSaving(true)
    const { error } = alert
      ? await supabase.from('stock_alerts').update(values).eq('id', alert.id)
      : await supabase.from('stock_alerts').insert(values)
    setSaving(false)

    if (error) {
      notifyError(error.message)
      return
    }
    notifySuccess(alert ? t('form.saved') : t('form.added'))
    onSaved()
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput label={t('form.ticker')} placeholder="AAPL" data-autofocus {...form.getInputProps('ticker')} />
        <TextInput label={t('form.name')} placeholder={t('form.namePlaceholder')} {...form.getInputProps('name')} />
        <Group grow align="flex-start">
          <NumberInput label={t('form.lowTarget')} min={0} decimalScale={4} {...form.getInputProps('low_target')} />
          <NumberInput label={t('form.highTarget')} min={0} decimalScale={4} {...form.getInputProps('high_target')} />
        </Group>
        <Switch label={t('common.active')} {...form.getInputProps('is_active', { type: 'checkbox' })} />
        {alert && (
          <Text size="xs" c="dimmed">
            {t('form.resetHint')}
          </Text>
        )}
        <Button type="submit" loading={saving}>
          {alert ? t('form.save') : t('form.add')}
        </Button>
      </Stack>
    </form>
  )
}
