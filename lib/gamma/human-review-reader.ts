import { getHumanReviewMockData } from '../../src/lib/human-review/mock-data'
import { HumanReview } from '../../src/lib/human-review/types'

export async function getHumanReviewReader(): Promise<HumanReview> {
  return getHumanReviewMockData()
}
