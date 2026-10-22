import { useCallback, useEffect, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Switch,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { IconPencil, IconPlus, IconRefresh, IconTrash, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import { Trans, useTranslation } from 'react-i18next'
import { supabase, type StockAlert } from './supabase'
import { notifyError, notifySuccess } from './notify'
import { AlertForm } from './AlertForm'
import { LanguageSwitch } from './LanguageSwitch'

const formatNumber = (value: number | null, locale: string) =>
  value === null ? '-' : value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 4 })

const formatDate = (value: string, locale: string) =>
  new Date(value).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })

function StatusBadge({ status }: { status: string | null }) {
  const { t } = useTranslation()

  if (status === 'ALERT_DROP') {
    return (
      <Badge color="red" leftSection={<IconTrendingDown size={14} />}>
        {t('alerts.statusDrop')}
      </Badge>
    )
  }
  if (status === 'ALERT_RISE') {
    return (
      <Badge color="teal" leftSection={<IconTrendingUp size={14} />}>
        {t('alerts.statusRise')}
      </Badge>
    )
  }
  return (
    <Badge color="gray" variant="light">
      OK
    </Badge>
  )
}

export function AlertsPage({ email }: { email: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<StockAlert | null>(null)
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false)

  const loadAlerts = useCallback(
    () =>
      supabase
        .from('stock_alerts')
        .select('*')
        .order('ticker')
        .then(({ data, error }) => {
          setLoading(false)
          if (error) {
            notifyError(error.message)
            return
          }
          setAlerts(data as StockAlert[])
        }),
    [],
  )

  useEffect(() => {
    void loadAlerts()
  }, [loadAlerts])

  function openEditor(alert: StockAlert | null) {
    setEditing(alert)
    openForm()
  }

  function handleSaved() {
    closeForm()
    void loadAlerts()
  }

  async function toggleActive(alert: StockAlert, isActive: boolean) {
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, is_active: isActive } : a)))
    const { error } = await supabase.from('stock_alerts').update({ is_active: isActive }).eq('id', alert.id)

    if (error) {
      notifyError(error.message)
      void loadAlerts()
    }
  }

  function confirmDelete(alert: StockAlert) {
    modals.openConfirmModal({
      title: t('alerts.deleteTitle'),
      children: (
        <Text size="sm">
          <Trans
            i18nKey="alerts.deleteConfirm"
            values={{ name: alert.name, ticker: alert.ticker }}
            components={{ b: <b /> }}
          />
        </Text>
      ),
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { error } = await supabase.from('stock_alerts').delete().eq('id', alert.id)
        if (error) {
          notifyError(error.message)
          return
        }
        notifySuccess(t('alerts.deleted'))
        void loadAlerts()
      },
    })
  }

  const rows = alerts.map((alert) => (
    <Table.Tr key={alert.id}>
      <Table.Td fw={600}>{alert.ticker}</Table.Td>
      <Table.Td>{alert.name}</Table.Td>
      <Table.Td ta="right">{formatNumber(alert.low_target, locale)}</Table.Td>
      <Table.Td ta="right">{formatNumber(alert.high_target, locale)}</Table.Td>
      <Table.Td ta="right">{formatNumber(alert.last_price, locale)}</Table.Td>
      <Table.Td>
        <StatusBadge status={alert.status} />
      </Table.Td>
      <Table.Td c="dimmed">{formatDate(alert.updated_at, locale)}</Table.Td>
      <Table.Td>
        <Switch
          checked={alert.is_active}
          onChange={(event) => void toggleActive(alert, event.currentTarget.checked)}
          aria-label={t('common.active')}
        />
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label={t('common.edit')}>
            <ActionIcon variant="subtle" color="gray" onClick={() => openEditor(alert)} aria-label={t('common.edit')}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('common.delete')}>
            <ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(alert)} aria-label={t('common.delete')}>
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <Container size="lg" py="xl">
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Stock Alerts</Title>
          <Group gap="sm">
            <Text size="sm" c="dimmed" visibleFrom="sm">
              {email}
            </Text>
            <LanguageSwitch />
            <Button variant="default" size="xs" onClick={() => void supabase.auth.signOut()}>
              {t('alerts.logout')}
            </Button>
          </Group>
        </Group>

        <Group justify="flex-end" gap="xs">
          <Tooltip label={t('alerts.refresh')}>
            <ActionIcon variant="default" size="lg" onClick={() => void loadAlerts()} aria-label={t('alerts.refresh')}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={16} />} onClick={() => openEditor(null)}>
            {t('alerts.add')}
          </Button>
        </Group>

        <Paper withBorder radius="md">
          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : alerts.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              {t('alerts.empty')}
            </Text>
          ) : (
            <Table.ScrollContainer minWidth={900} type="native">
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('alerts.columns.ticker')}</Table.Th>
                    <Table.Th>{t('alerts.columns.name')}</Table.Th>
                    <Table.Th ta="right">{t('alerts.columns.min')}</Table.Th>
                    <Table.Th ta="right">{t('alerts.columns.max')}</Table.Th>
                    <Table.Th ta="right">{t('alerts.columns.lastPrice')}</Table.Th>
                    <Table.Th>{t('alerts.columns.status')}</Table.Th>
                    <Table.Th>{t('alerts.columns.updated')}</Table.Th>
                    <Table.Th>{t('common.active')}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>

      <Modal opened={formOpened} onClose={closeForm} title={editing ? t('alerts.editTitle') : t('alerts.newTitle')}>
        <AlertForm key={editing?.id ?? 'new'} alert={editing} onSaved={handleSaved} />
      </Modal>
    </Container>
  )
}
