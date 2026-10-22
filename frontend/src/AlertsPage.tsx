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
import { supabase, type StockAlert } from './supabase'
import { notifyError, notifySuccess } from './notify'
import { AlertForm } from './AlertForm'

const numberFormat = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

const formatNumber = (value: number | null) => (value === null ? '-' : numberFormat.format(value))

const formatDate = (value: string) =>
  new Date(value).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'ALERT_DROP') {
    return (
      <Badge color="red" leftSection={<IconTrendingDown size={14} />}>
        Spadek
      </Badge>
    )
  }
  if (status === 'ALERT_RISE') {
    return (
      <Badge color="teal" leftSection={<IconTrendingUp size={14} />}>
        Wzrost
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
      title: 'Usuń alert',
      children: (
        <Text size="sm">
          Usunąć alert <b>{alert.name}</b> ({alert.ticker})?
        </Text>
      ),
      labels: { confirm: 'Usuń', cancel: 'Anuluj' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { error } = await supabase.from('stock_alerts').delete().eq('id', alert.id)
        if (error) {
          notifyError(error.message)
          return
        }
        notifySuccess('Usunięto alert')
        void loadAlerts()
      },
    })
  }

  const rows = alerts.map((alert) => (
    <Table.Tr key={alert.id}>
      <Table.Td fw={600}>{alert.ticker}</Table.Td>
      <Table.Td>{alert.name}</Table.Td>
      <Table.Td ta="right">{formatNumber(alert.low_target)}</Table.Td>
      <Table.Td ta="right">{formatNumber(alert.high_target)}</Table.Td>
      <Table.Td ta="right">{formatNumber(alert.last_price)}</Table.Td>
      <Table.Td>
        <StatusBadge status={alert.status} />
      </Table.Td>
      <Table.Td c="dimmed">{formatDate(alert.updated_at)}</Table.Td>
      <Table.Td>
        <Switch
          checked={alert.is_active}
          onChange={(event) => void toggleActive(alert, event.currentTarget.checked)}
          aria-label="Aktywny"
        />
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Edytuj">
            <ActionIcon variant="subtle" color="gray" onClick={() => openEditor(alert)} aria-label="Edytuj">
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Usuń">
            <ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(alert)} aria-label="Usuń">
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
            <Button variant="default" size="xs" onClick={() => void supabase.auth.signOut()}>
              Wyloguj
            </Button>
          </Group>
        </Group>

        <Group justify="flex-end" gap="xs">
          <Tooltip label="Odśwież">
            <ActionIcon variant="default" size="lg" onClick={() => void loadAlerts()} aria-label="Odśwież">
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={16} />} onClick={() => openEditor(null)}>
            Dodaj alert
          </Button>
        </Group>

        <Paper withBorder radius="md">
          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : alerts.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Brak alertów. Dodaj pierwszy.
            </Text>
          ) : (
            <Table.ScrollContainer minWidth={900} type="native">
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Ticker</Table.Th>
                    <Table.Th>Nazwa</Table.Th>
                    <Table.Th ta="right">Min</Table.Th>
                    <Table.Th ta="right">Max</Table.Th>
                    <Table.Th ta="right">Ostatnia cena</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Aktualizacja</Table.Th>
                    <Table.Th>Aktywny</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>

      <Modal opened={formOpened} onClose={closeForm} title={editing ? 'Edytuj alert' : 'Nowy alert'}>
        <AlertForm key={editing?.id ?? 'new'} alert={editing} onSaved={handleSaved} />
      </Modal>
    </Container>
  )
}
