-- CreateTable
CREATE TABLE "RealtimeEventStream" (
    "id" TEXT NOT NULL,
    "streamName" TEXT NOT NULL,
    "streamType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealtimeEventStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealtimeEventMessage" (
    "id" TEXT NOT NULL,
    "streamName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealtimeEventMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributedWorkerNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'online',
    "capabilities" JSONB,
    "lastHeartbeat" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributedWorkerNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributedExecutionJob" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetLayer" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "assignedWorker" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributedExecutionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealtimeFabricRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "eventHealth" INTEGER NOT NULL DEFAULT 75,
    "workerHealth" INTEGER NOT NULL DEFAULT 75,
    "queuePressure" INTEGER NOT NULL DEFAULT 30,
    "executionHealth" INTEGER NOT NULL DEFAULT 75,
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealtimeFabricRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RealtimeEventStream_streamName_idx" ON "RealtimeEventStream"("streamName");

-- CreateIndex
CREATE INDEX "RealtimeEventStream_streamType_idx" ON "RealtimeEventStream"("streamType");

-- CreateIndex
CREATE INDEX "RealtimeEventStream_status_idx" ON "RealtimeEventStream"("status");

-- CreateIndex
CREATE INDEX "RealtimeEventMessage_streamName_idx" ON "RealtimeEventMessage"("streamName");

-- CreateIndex
CREATE INDEX "RealtimeEventMessage_eventType_idx" ON "RealtimeEventMessage"("eventType");

-- CreateIndex
CREATE INDEX "RealtimeEventMessage_source_idx" ON "RealtimeEventMessage"("source");

-- CreateIndex
CREATE INDEX "RealtimeEventMessage_priority_idx" ON "RealtimeEventMessage"("priority");

-- CreateIndex
CREATE INDEX "RealtimeEventMessage_status_idx" ON "RealtimeEventMessage"("status");

-- CreateIndex
CREATE INDEX "RealtimeEventMessage_createdAt_idx" ON "RealtimeEventMessage"("createdAt");

-- CreateIndex
CREATE INDEX "DistributedWorkerNode_workerType_idx" ON "DistributedWorkerNode"("workerType");

-- CreateIndex
CREATE INDEX "DistributedWorkerNode_status_idx" ON "DistributedWorkerNode"("status");

-- CreateIndex
CREATE INDEX "DistributedWorkerNode_lastHeartbeat_idx" ON "DistributedWorkerNode"("lastHeartbeat");

-- CreateIndex
CREATE INDEX "DistributedExecutionJob_jobType_idx" ON "DistributedExecutionJob"("jobType");

-- CreateIndex
CREATE INDEX "DistributedExecutionJob_targetLayer_idx" ON "DistributedExecutionJob"("targetLayer");

-- CreateIndex
CREATE INDEX "DistributedExecutionJob_priority_idx" ON "DistributedExecutionJob"("priority");

-- CreateIndex
CREATE INDEX "DistributedExecutionJob_status_idx" ON "DistributedExecutionJob"("status");

-- CreateIndex
CREATE INDEX "DistributedExecutionJob_assignedWorker_idx" ON "DistributedExecutionJob"("assignedWorker");

-- CreateIndex
CREATE INDEX "DistributedExecutionJob_scheduledAt_idx" ON "DistributedExecutionJob"("scheduledAt");

-- CreateIndex
CREATE INDEX "RealtimeFabricRun_status_idx" ON "RealtimeFabricRun"("status");

-- CreateIndex
CREATE INDEX "RealtimeFabricRun_eventHealth_idx" ON "RealtimeFabricRun"("eventHealth");

-- CreateIndex
CREATE INDEX "RealtimeFabricRun_workerHealth_idx" ON "RealtimeFabricRun"("workerHealth");

-- CreateIndex
CREATE INDEX "RealtimeFabricRun_queuePressure_idx" ON "RealtimeFabricRun"("queuePressure");

-- CreateIndex
CREATE INDEX "RealtimeFabricRun_executionHealth_idx" ON "RealtimeFabricRun"("executionHealth");
