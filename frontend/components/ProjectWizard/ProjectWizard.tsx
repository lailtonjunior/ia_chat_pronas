'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import WizardNavigator from './WizardNavigator'
import { initializeApiClient } from '@/lib/api'

type BasicInfo = {
  title: string
  description: string
  projectType: 'PRONAS' | 'PCD'
  institutionName: string
  institutionCnpj: string
}

type ObjectivesInfo = {
  objectives: string
  justification: string
}

type MethodologyInfo = {
  methodology: string
  timeline: string
}

type TeamInfo = {
  teamStructure: string
  infrastructure: string
}

type BudgetInfo = {
  budgetOverview: string
  attachments: string
}

interface WizardState {
  basic: BasicInfo
  objectives: ObjectivesInfo
  methodology: MethodologyInfo
  team: TeamInfo
  budget: BudgetInfo
}

const initialState: WizardState = {
  basic: {
    title: '',
    description: '',
    projectType: 'PRONAS',
    institutionName: '',
    institutionCnpj: '',
  },
  objectives: {
    objectives: '',
    justification: '',
  },
  methodology: {
    methodology: '',
    timeline: '',
  },
  team: {
    teamStructure: '',
    infrastructure: '',
  },
  budget: {
    budgetOverview: '',
    attachments: '',
  },
}

const wizardSteps = [
  { id: 'basic', title: 'Informações Básicas' },
  { id: 'objectives', title: 'Objetivos e Justificativa' },
  { id: 'methodology', title: 'Metodologia' },
  { id: 'team', title: 'Equipe e Infraestrutura' },
  { id: 'budget', title: 'Orçamento e Anexos' },
]

export default function ProjectWizard() {
  const [state, setState] = useState<WizardState>(initialState)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const currentStep = wizardSteps[step]

  const updateState = <K extends keyof WizardState>(
    key: K,
    payload: Partial<WizardState[K]>
  ) => {
    setState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...payload,
      },
    }))
  }

  const validateStep = () => {
    switch (currentStep.id) {
      case 'basic':
        return Boolean(
          state.basic.title &&
            state.basic.description &&
            state.basic.institutionName &&
            state.basic.institutionCnpj
        )
      case 'objectives':
        return Boolean(state.objectives.objectives && state.objectives.justification)
      case 'methodology':
        return Boolean(state.methodology.methodology)
      case 'team':
        return Boolean(state.team.teamStructure)
      case 'budget':
        return Boolean(state.budget.budgetOverview)
      default:
        return true
    }
  }

  const nextStep = () => {
    if (!validateStep()) {
      toast.error('Preencha os campos obrigatórios antes de avançar.')
      return
    }
    setStep((prev) => Math.min(prev + 1, wizardSteps.length - 1))
  }

  const previousStep = () => {
    setStep((prev) => Math.max(prev - 1, 0))
  }

  const saveAsDraft = async () => {
    if (!session?.accessToken) {
      toast.error('Faça login para salvar.')
      return
    }

    setSubmitting(true)
    try {
      const apiClient = initializeApiClient(session.accessToken)
      const payload = buildPayload('draft')
      const { data } = await apiClient.post('/api/projects/', payload)
      toast.success('Rascunho salvo com sucesso!')
      router.push(`/dashboard/projects/${data.id}`)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível salvar o rascunho.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitProject = async () => {
    if (!session?.accessToken) {
      toast.error('Faça login para enviar o projeto.')
      return
    }

    if (!validateStep()) {
      toast.error('Finalize o preenchimento desta etapa antes de enviar.')
      return
    }

    setSubmitting(true)
    try {
      const apiClient = initializeApiClient(session.accessToken)
      const payload = buildPayload('submitted')
      const { data } = await apiClient.post('/api/projects/', payload)
      toast.success('Projeto enviado com sucesso!')
      router.push(`/dashboard/projects/${data.id}`)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível enviar o projeto.')
    } finally {
      setSubmitting(false)
    }
  }

  const buildPayload = (status: 'draft' | 'submitted') => ({
    title: state.basic.title,
    description: state.basic.description,
    project_type: state.basic.projectType,
    institution_name: state.basic.institutionName,
    institution_cnpj: state.basic.institutionCnpj,
    status,
    content: {
      text: JSON.stringify(state),
      sections: state,
    },
    objectives: state.objectives.objectives,
    methodology: state.methodology.methodology,
  })

  const renderStep1_BasicInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-700">Título *</label>
        <input
          type="text"
          value={state.basic.title}
          onChange={(e) => updateState('basic', { title: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="Ex: Centro de Reabilitação APAE"
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700">Descrição *</label>
        <textarea
          value={state.basic.description}
          onChange={(e) => updateState('basic', { description: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          rows={4}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-gray-700">Tipo *</label>
          <select
            value={state.basic.projectType}
            onChange={(e) =>
              updateState('basic', { projectType: e.target.value as 'PRONAS' | 'PCD' })
            }
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="PRONAS">PRONAS</option>
            <option value="PCD">PCD</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700">CNPJ *</label>
          <input
            type="text"
            value={state.basic.institutionCnpj}
            onChange={(e) => updateState('basic', { institutionCnpj: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700">Instituição *</label>
        <input
          type="text"
          value={state.basic.institutionName}
          onChange={(e) => updateState('basic', { institutionName: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  )

  const renderStep2_Objectives = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-700">Objetivos *</label>
        <textarea
          value={state.objectives.objectives}
          onChange={(e) => updateState('objectives', { objectives: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          rows={5}
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700">Justificativa *</label>
        <textarea
          value={state.objectives.justification}
          onChange={(e) => updateState('objectives', { justification: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          rows={5}
        />
      </div>
    </div>
  )

  const renderStep3_Methodology = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-700">Metodologia *</label>
        <textarea
          value={state.methodology.methodology}
          onChange={(e) => updateState('methodology', { methodology: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          rows={6}
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700">Cronograma</label>
        <textarea
          value={state.methodology.timeline}
          onChange={(e) => updateState('methodology', { timeline: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          rows={4}
        />
      </div>
    </div>
  )

  const renderStep4_Team = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-700">Equipe *</label>
        <textarea
          value={state.team.teamStructure}
          onChange={(e) => updateState('team', { teamStructure: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          rows={5}
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700">Infraestrutura</label>
        <textarea
          value={state.team.infrastructure}
          onChange={(e) => updateState('team', { infrastructure: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          rows={5}
        />
      </div>
    </div>
  )

  const renderStep5_Budget = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-700">Resumo do Orçamento *</label>
        <textarea
          value={state.budget.budgetOverview}
          onChange={(e) => updateState('budget', { budgetOverview: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          rows={5}
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700">Anexos/Observações</label>
        <textarea
          value={state.budget.attachments}
          onChange={(e) => updateState('budget', { attachments: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          rows={4}
        />
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep.id) {
      case 'basic':
        return renderStep1_BasicInfo()
      case 'objectives':
        return renderStep2_Objectives()
      case 'methodology':
        return renderStep3_Methodology()
      case 'team':
        return renderStep4_Team()
      case 'budget':
        return renderStep5_Budget()
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <WizardNavigator
        steps={wizardSteps}
        currentIndex={step}
        onStepSelect={(index) => setStep(index)}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {renderCurrentStep()}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={previousStep}
          disabled={step === 0 || submitting}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
        >
          Voltar
        </button>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveAsDraft}
            disabled={submitting}
            className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            Salvar como Rascunho
          </button>

          {step < wizardSteps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Próxima Etapa
            </button>
          ) : (
            <button
              type="button"
              onClick={submitProject}
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar Projeto'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
