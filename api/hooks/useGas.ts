import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type {
  ApiResponse,
  ConfirmGasReceiptRequest,
  CreateGasCycleRequest,
  CreateGasSessionRequest,
  CycleHouseholdDto,
  GasCycleDto,
  GasHouseholdStatusDto,
  GasSessionDetailDto,
  GasSessionDto,
  PaginatedResponse,
  UpdateGasHouseholdStatusRequest,
  UpdateGasPositionRequest,
} from '../../types'
import { gasService } from '../services'

/**
 * Gaz navbati React Query hooks (REST). Realtime session updates are applied in
 * the Zustand store (modules/Gas) — these cover the request/refetch surface.
 * See ARCHITECTURE.md §3.
 */

/** The current active/planned session for a mahalla (main resident view). */
export const useActiveGasSessionQuery = ({
  mahallaId,
  querySettings = {},
}: {
  mahallaId: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<GasSessionDto | null>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['GAS_ACTIVE_SESSION', mahallaId],
    queryFn: () => gasService.getActiveSession(mahallaId),
    enabled: !!mahallaId,
    ...querySettings,
  })
}

/** Full session with its queue. */
export const useGasSessionQuery = ({
  id,
  querySettings = {},
}: {
  id: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<GasSessionDetailDto>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['GAS_SESSION', id],
    queryFn: () => gasService.getSession(id),
    enabled: !!id,
    ...querySettings,
  })
}

/** The current user's own household status in a session. */
export const useMyGasStatusQuery = ({
  id,
  querySettings = {},
}: {
  id: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<GasHouseholdStatusDto>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['GAS_MY_STATUS', id],
    queryFn: () => gasService.getMyStatus(id),
    enabled: !!id,
    ...querySettings,
  })
}

/** Create a session (mahalla admin). */
export const useCreateGasSessionMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<GasSessionDto>>, Error, CreateGasSessionRequest>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<GasSessionDto>>, Error, CreateGasSessionRequest>({
    mutationFn: (data) => gasService.createSession(data),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['GAS_ACTIVE_SESSION', variables.mahalla_id] })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

/** Session lifecycle (start/pause/complete) — all take the session id. */
const useSessionLifecycleMutation = (
  action: (id: number) => Promise<AxiosResponse<ApiResponse<GasSessionDto>>>,
  options?: UseMutationOptions<AxiosResponse<ApiResponse<GasSessionDto>>, Error, number>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<GasSessionDto>>, Error, number>({
    mutationFn: (id) => action(id),
    ...options,
    onSuccess: (data, id, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['GAS_SESSION', id] })
      queryClient.invalidateQueries({ queryKey: ['GAS_ACTIVE_SESSION'] })
      options?.onSuccess?.(data, id, onMutateResult, context)
    },
  })
}

export const useStartGasSessionMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<GasSessionDto>>, Error, number>,
) => useSessionLifecycleMutation((id) => gasService.startSession(id), options)

export const usePauseGasSessionMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<GasSessionDto>>, Error, number>,
) => useSessionLifecycleMutation((id) => gasService.pauseSession(id), options)

export const useCompleteGasSessionMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<GasSessionDto>>, Error, number>,
) => useSessionLifecycleMutation((id) => gasService.completeSession(id), options)

/** Update the live position (admin / runner). */
export const useUpdateGasPositionMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<GasSessionDto>>, Error, { id: number; data: UpdateGasPositionRequest }>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<GasSessionDto>>, Error, { id: number; data: UpdateGasPositionRequest }>({
    mutationFn: ({ id, data }) => gasService.updatePosition(id, data),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['GAS_SESSION', variables.id] })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

/** Mark a household delivered/skipped (admin / runner). */
export const useUpdateGasHouseholdStatusMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<GasHouseholdStatusDto>>, Error, { id: number; householdId: number; data: UpdateGasHouseholdStatusRequest }>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<GasHouseholdStatusDto>>, Error, { id: number; householdId: number; data: UpdateGasHouseholdStatusRequest }>({
    mutationFn: ({ id, householdId, data }) => gasService.updateHouseholdStatus(id, householdId, data),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['GAS_SESSION', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['GAS_MY_STATUS', variables.id] })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

/** Resident self-confirm receipt. */
export const useConfirmGasReceiptMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<GasHouseholdStatusDto>>, Error, { id: number; householdId: number; data: ConfirmGasReceiptRequest }>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<GasHouseholdStatusDto>>, Error, { id: number; householdId: number; data: ConfirmGasReceiptRequest }>({
    mutationFn: ({ id, householdId, data }) => gasService.confirmReceipt(id, householdId, data),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['GAS_MY_STATUS', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['GAS_SESSION', variables.id] })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

// ── Cikl (fairness) hooks — GAZ spec §10 ────────────────────────────────────

/** The current in-progress cycle for a mahalla (position + progress). */
export const useCurrentGasCycleQuery = ({
  mahallaId,
  querySettings = {},
}: {
  mahallaId: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<GasCycleDto | null>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['GAS_CURRENT_CYCLE', mahallaId],
    queryFn: () => gasService.getCurrentCycle(mahallaId),
    enabled: !!mahallaId,
    ...querySettings,
  })
}

/** The cycle's household roster (ordinal, status, miss_count, priority). */
export const useGasCycleHouseholdsQuery = ({
  id,
  querySettings = {},
}: {
  id: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<PaginatedResponse<CycleHouseholdDto>>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['GAS_CYCLE_HOUSEHOLDS', id],
    queryFn: () => gasService.getCycleHouseholds(id),
    enabled: !!id,
    ...querySettings,
  })
}

/** Start a new cycle (force overrides an in-progress one → warning). */
export const useCreateGasCycleMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<GasCycleDto>>, Error, { data: CreateGasCycleRequest; force?: boolean }>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<GasCycleDto>>, Error, { data: CreateGasCycleRequest; force?: boolean }>({
    mutationFn: ({ data, force }) => gasService.createCycle(data, force),
    ...options,
    onSuccess: (res, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['GAS_CURRENT_CYCLE', variables.data.mahalla_id] })
      options?.onSuccess?.(res, variables, onMutateResult, context)
    },
  })
}
