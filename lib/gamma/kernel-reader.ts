import { KERNEL_ASSETS } from "../kernel/mock-data"
import type { KernelWorkspace } from "../kernel/types"

export async function getKernelRegistry(): Promise<KernelWorkspace> {
  return KERNEL_ASSETS
}
