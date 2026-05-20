-- CreateTable
CREATE TABLE "RecursiveEvolutionCycle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cycleType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "architectureHealth" INTEGER NOT NULL DEFAULT 75,
    "optimizationScore" INTEGER NOT NULL DEFAULT 75,
    "governanceCoherence" INTEGER NOT NULL DEFAULT 75,
    "operationalEfficiency" INTEGER NOT NULL DEFAULT 75,
    "cognitiveAlignment" INTEGER NOT NULL DEFAULT 75,
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecursiveEvolutionCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureObservation" (
    "id" TEXT NOT NULL,
    "evolutionCycleId" TEXT,
    "observationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "affectedLayer" TEXT,
    "description" TEXT,
    "recommendation" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchitectureObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfOptimizationProposal" (
    "id" TEXT NOT NULL,
    "evolutionCycleId" TEXT,
    "proposalType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT,
    "expectedBenefit" TEXT,
    "implementationRisk" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "targetSystem" TEXT,
    "payload" JSONB,
    "executionPlan" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelfOptimizationProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalMutation" (
    "id" TEXT NOT NULL,
    "mutationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetLayer" TEXT,
    "strategicImpact" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'simulated',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionalMutation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionMemory" (
    "id" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "sourceCycleId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvolutionMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecursiveEvolutionCycle_cycleType_idx" ON "RecursiveEvolutionCycle"("cycleType");

-- CreateIndex
CREATE INDEX "RecursiveEvolutionCycle_status_idx" ON "RecursiveEvolutionCycle"("status");

-- CreateIndex
CREATE INDEX "RecursiveEvolutionCycle_architectureHealth_idx" ON "RecursiveEvolutionCycle"("architectureHealth");

-- CreateIndex
CREATE INDEX "RecursiveEvolutionCycle_optimizationScore_idx" ON "RecursiveEvolutionCycle"("optimizationScore");

-- CreateIndex
CREATE INDEX "ArchitectureObservation_evolutionCycleId_idx" ON "ArchitectureObservation"("evolutionCycleId");

-- CreateIndex
CREATE INDEX "ArchitectureObservation_observationType_idx" ON "ArchitectureObservation"("observationType");

-- CreateIndex
CREATE INDEX "ArchitectureObservation_severity_idx" ON "ArchitectureObservation"("severity");

-- CreateIndex
CREATE INDEX "ArchitectureObservation_affectedLayer_idx" ON "ArchitectureObservation"("affectedLayer");

-- CreateIndex
CREATE INDEX "SelfOptimizationProposal_evolutionCycleId_idx" ON "SelfOptimizationProposal"("evolutionCycleId");

-- CreateIndex
CREATE INDEX "SelfOptimizationProposal_proposalType_idx" ON "SelfOptimizationProposal"("proposalType");

-- CreateIndex
CREATE INDEX "SelfOptimizationProposal_status_idx" ON "SelfOptimizationProposal"("status");

-- CreateIndex
CREATE INDEX "SelfOptimizationProposal_targetSystem_idx" ON "SelfOptimizationProposal"("targetSystem");

-- CreateIndex
CREATE INDEX "InstitutionalMutation_mutationType_idx" ON "InstitutionalMutation"("mutationType");

-- CreateIndex
CREATE INDEX "InstitutionalMutation_targetLayer_idx" ON "InstitutionalMutation"("targetLayer");

-- CreateIndex
CREATE INDEX "InstitutionalMutation_riskLevel_idx" ON "InstitutionalMutation"("riskLevel");

-- CreateIndex
CREATE INDEX "InstitutionalMutation_status_idx" ON "InstitutionalMutation"("status");

-- CreateIndex
CREATE INDEX "EvolutionMemory_memoryType_idx" ON "EvolutionMemory"("memoryType");

-- CreateIndex
CREATE INDEX "EvolutionMemory_priority_idx" ON "EvolutionMemory"("priority");

-- CreateIndex
CREATE INDEX "EvolutionMemory_sourceCycleId_idx" ON "EvolutionMemory"("sourceCycleId");
