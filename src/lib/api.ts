import { VisionItem } from '@/types/vision-board'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export async function getVisionItems(userId: string): Promise<VisionItem[]> {
  const response = await fetch(`${API_BASE}/api/vision-board?userId=${userId}`)
  if (!response.ok) throw new Error('Failed to fetch vision items')
  return response.json()
}

export async function saveVisionItem(userId: string, item: Omit<VisionItem, 'id'>): Promise<VisionItem> {
  const response = await fetch(`${API_BASE}/api/vision-board`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, item })
  })
  if (!response.ok) throw new Error('Failed to save vision item')
  return response.json()
}

export async function updateVisionItem(
  itemId: string,
  userId: string,
  updates: Partial<VisionItem>
): Promise<VisionItem> {
  const response = await fetch(`${API_BASE}/api/vision-board`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, userId, updates })
  })
  if (!response.ok) throw new Error('Failed to update vision item')
  return response.json()
}

export async function deleteVisionItem(itemId: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/vision-board?itemId=${itemId}&userId=${userId}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete vision item')
}
