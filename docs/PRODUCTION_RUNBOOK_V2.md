Echoes & Visions Production Runbook V2
Version

Production Runbook V2

Platform: Echoes & Visions AI Content Operating System

Status: Production

Last Updated: June 2026

Purpose

This runbook provides operational procedures for maintaining, troubleshooting, recovering, and deploying the Echoes & Visions platform.

This document is designed for future maintenance, incident response, and production support.

Daily Health Check

Perform these checks daily.

Discovery System

Verify:

Admin → Discovery Queue

Expected:

New opportunities appearing
Generated articles increasing
No excessive failures
Scheduler

Verify:

/api/ai/scheduler

Check:

status = active
nextRunAt updating
lastRunAt updating
Job Queue

Verify:

/api/ai/jobs

Check:

Queued jobs clearing
No large backlog
Failed jobs minimal
Article Pipeline

Verify:

review-required articles appearing

Expected:

New articles generated daily
Research audits attached
Weekly Maintenance
Review Failed Jobs

Open:

/api/ai/jobs

Look for:

status = failed

Investigate recurring failures.

Review Activity Logs

Check:

AI Activity Events

Look for:

Repeated errors
Scheduler failures
Workflow failures
API failures
Review Discovery Quality

Evaluate:

Opportunity Scores
Research Confidence
Editorial Quality

Adjust scoring logic if necessary.

Monthly Maintenance
Database Review

Inspect:

Articles
Research Audits
AI Jobs
Activity Events
Discovery Queue

Archive old records if needed.

Dependency Updates

Run:

npm outdated

Review updates carefully.

Never update blindly.

Security Review

Rotate if required:

OPENAI_API_KEY
BRAVE_SEARCH_API_KEY

Verify:

DATABASE_URL
DIRECT_URL

remain secure.

Database Backup Procedure
Supabase Backup

Open:

Supabase Dashboard

Navigate:

Project
→ Database
→ Backups

Verify:

Automated backups enabled
Manual Backup

Export:

Articles
ResearchAudits
DiscoveredTopics
AIJobs
WorkflowExecutions

before major releases.

Deployment Procedure
Local Verification

Run:

npm run build

Must succeed with:

0 errors
Commit
git add .
git commit -m "Release update"
git push
Vercel Deploy

Verify:

Build successful
Deployment successful

Review:

Runtime logs
Function logs

after deployment.

Scheduler Troubleshooting
Symptom
No new articles generated

Check:

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/ai/scheduler"

Verify:

status = active
Force Scheduler Run
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/ai/scheduler/run" `
  -Method POST
Job Runner Troubleshooting
Symptom
Jobs remain queued

Run:

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/ai/jobs/run" `
  -Method POST

Expected:

status = completed
If Jobs Fail

Check:

job.error

Review:

Activity Events

for details.

Discovery Queue Troubleshooting
Symptom
Queue empty

Run:

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/discovery/scheduled-run" `
  -Method POST

Expected:

discoveredCount > 0
Verify Brave Search

Check:

SEARCH_PROVIDER=brave
BRAVE_SEARCH_API_KEY

Verify discovery endpoint returns results.

Brave API Troubleshooting
Check Environment
BRAVE_SEARCH_API_KEY
SEARCH_PROVIDER=brave
Test Discovery
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/discovery/topics" `
  -Method POST

Expected:

topicCount > 0
OpenAI Troubleshooting
Symptom
Articles fail to generate

Verify:

OPENAI_API_KEY

Check:

Server logs
Generation endpoint logs
Research Audit Troubleshooting

Verify:

ResearchAudit records created

Expected:

Research Confidence
Verification Score
Consensus Score

present.

Emergency Recovery
Discovery Engine Failure

Run manually:

/api/discovery/scheduled-run
Scheduler Failure

Run manually:

/api/ai/scheduler/run
Queue Failure

Run manually:

/api/ai/jobs/run
Emergency Rollback

If deployment fails:

Vercel
→ Deployments
→ Previous Successful Deployment
→ Promote to Production

Verify:

Admin loads
Discovery loads
Article generation works
Release Checklist

Before every release:

npm run build passes
Prisma schema synced
Discovery queue operational
Scheduler operational
Job runner operational
Research audits generated
Review-required workflow active
No auto-publishing enabled
Governance protections active
Backup verified
Production Principles

Never publish automatically.

Never bypass human review.

Never disable research auditing.

Never fabricate facts, statistics, sources, quotes, companies, or references.

Every article must remain:

Research-backed
Audited
Review-required
Human-approved
Current Platform Capability
Brave Search
    ↓
Topic Discovery
    ↓
Opportunity Scoring
    ↓
Queue Storage
    ↓
Research Pipeline
    ↓
Article Generation
    ↓
Research Audit
    ↓
Editorial Review
    ↓
Approval
    ↓
Publishing

Platform Status:

Production Ready
Human Review Protected
Governance Enabled