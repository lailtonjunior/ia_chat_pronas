'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/Common/Button'
import { initializeApiClient } from '@/lib/api'

interface BudgetItem {
  id: string
  item: string
  description: string
  quantity: number
  unitValue: number
  total: number
  notes?: string
}

interface BudgetTableProps {
  projectId: string
  onUpdate?: (items: BudgetItem[], total: number) => void
}

export default function BudgetTable({
  projectId,
  onUpdate,
}: BudgetTableProps) {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
    quantity: 1,
    unitValue: 0,
  })

  const accessToken = session?.accessToken

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (!accessToken) {
      setLoading(false)
      return
    }

    fetchBudget(accessToken)
  }, [accessToken, status])

  const fetchBudget = async (token: string) => {
    try {
      // Buscar orçamento salvo
      const apiClient = initializeApiClient(token)
      const response = await apiClient.get(`/api/projects/${projectId}`)

      const annexData = response.data.annex_6
      if (annexData?.items) {
        setItems(annexData.items)
      }
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    if (!newItem.item || !newItem.quantity || !newItem.unitValue) {
      toast.error('Preencha todos os campos')
      return
    }

    const item: BudgetItem = {
      id: Date.now().toString(),
      item: newItem.item || '',
      description: newItem.description || '',
      quantity: newItem.quantity || 1,
      unitValue: newItem.unitValue || 0,
      total: (newItem.quantity || 1) * (newItem.unitValue || 0),
      notes: newItem.notes,
    }

    setItems([...items, item])
    setNewItem({ quantity: 1, unitValue: 0 })
    toast.success('Item adicionado')
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
    toast.success('Item removido')
  }

  const handleSave = async () => {
    if (!accessToken) {
      toast.error('Token de acesso não encontrado')
      return
    }

    try {
      const apiClient = initializeApiClient(accessToken)
      await apiClient.put(`/api/projects/${projectId}`, {
        annex_6: { items },
      })

      const total = items.reduce((sum, item) => sum + item.total, 0)
      onUpdate?.(items, total)
      toast.success('Orçamento salvo')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar orçamento')
    }
  }

  const totalBudget = items.reduce((sum, item) => sum + item.total, 0)

  const highValueItems = items.filter(
    (item) => item.total > 50000 || item.unitValue > 10000
  )

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Orçamento</h2>

      {/* Warnings */}
      {highValueItems.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-900 mb-2">
                Atenção: Valores Altos Detectados
              </p>
              <ul className="text-sm text-yellow-800 space-y-1">
                {highValueItems.map((item) => (
                  <li key={item.id}>
                    • {item.item}: R$ {item.total.toLocaleString('pt-BR')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Item</th>
              <th className="px-4 py-2 text-left font-semibold">Qtd</th>
              <th className="px-4 py-2 text-left font-semibold">Valor Unit.</th>
              <th className="px-4 py-2 text-left font-semibold">Total</th>
              <th className="px-4 py-2 text-left font-semibold">Ação</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{item.item}</td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">
                  R$ {item.unitValue.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-2 font-semibold">
                  R$ {item.total.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {/* New Item Row */}
            <tr className="border-b">
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={newItem.item || ''}
                  onChange={(e) =>
                    setNewItem({ ...newItem, item: e.target.value })
                  }
                  placeholder="Nome do item"
                  className="w-full px-2 py-1 border rounded"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  min="1"
                  value={newItem.quantity || 1}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      quantity: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1 border rounded"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  min="0"
                  value={newItem.unitValue || 0}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      unitValue: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0,00"
                  className="w-full px-2 py-1 border rounded"
                />
              </td>
              <td className="px-4 py-2 font-semibold">
                R${' '}
                {(
                  (newItem.quantity || 1) * (newItem.unitValue || 0)
                ).toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={handleAddItem}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total do Orçamento</span>
          <span className="text-2xl font-bold text-blue-600">
            R$ {totalBudget.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <Button onClick={handleSave} fullWidth>
        Salvar Orçamento
      </Button>
    </div>
  )
}
