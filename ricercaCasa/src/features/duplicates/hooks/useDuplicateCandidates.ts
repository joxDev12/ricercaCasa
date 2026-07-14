import { decideDuplicateCandidateApi } from '../services/duplicateCandidatesApi'

export function useDuplicateCandidates(refresh: () => Promise<void>) {
  async function decide(id: number, decision: 'confirmed' | 'rejected') {
    await decideDuplicateCandidateApi(id, decision)
    await refresh()
  }

  return { decide }
}
