export interface ExecutiveMemoryEntry {
    id: string;
    category: string;
    title: string;
    summary: string;
    createdAt: string;
  }
  
  export async function buildExecutiveMemory() {
    const memories: ExecutiveMemoryEntry[] = [
      {
        id: "health-critical",
        category: "health",
        title: "Executive health entered critical state",
        summary:
          "Overall executive health dropped below 40 and recovery mode was activated.",
        createdAt: new Date().toISOString(),
      },
  
      {
        id: "strategy-recovery",
        category: "strategy",
        title: "Recovery priorities established",
        summary:
          "Cashflow, delivery execution and recurring revenue became top priorities.",
        createdAt: new Date().toISOString(),
      },
    ];
  
    return {
      total: memories.length,
      memories,
      generatedAt: new Date().toISOString(),
    };
  }