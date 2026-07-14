import { apiClient } from '../../../lib/apiClient'

export function decideDuplicateCandidateApi(
  id: number,
  decision: 'confirmed' | 'rejected',
) {
  return apiClient<{ data: { id: number } }>(`/api/duplicate-candidates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ decision }),
  })
}
