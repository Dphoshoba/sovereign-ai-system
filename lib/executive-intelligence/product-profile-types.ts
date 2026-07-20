import { OfficeName } from './workflow-types';

export interface OfficeResponsibility {
  office: OfficeName;
  responsibilities: string[];
}

export interface WorkflowStageMapping {
  stage: string;
  responsibleOffice: OfficeName;
  description: string;
}

export interface ProductDeploymentProfile extends Record<string, unknown> {
  productId: string;
  productName: string;
  version: string;
  mission: string;
  targetUsers: string[];
  keyWorkflows: string[];
  lifecycleStages: string[];
  governanceRequirements: string[];
  operationalCadence: string;
  successMetrics: string[];
  officeMappings: OfficeResponsibility[];
  workflowStageMappings: WorkflowStageMapping[];
  adaptionsFromReference: string[];
}

export const BIBLE_QUEST_PROFILE: ProductDeploymentProfile = {
  productId: 'bible-quest',
  productName: 'Bible Quest',
  version: '1.0.0',
  mission: 'Deliver engaging biblical education through character studies, stories, and interactive learning modules',
  targetUsers: ['Individual learners', 'Church groups', 'Small group studies', 'Christian educators'],
  keyWorkflows: [
    'Character learning module publication',
    'Story-based curriculum release',
    'Quiz and assessment deployment',
    'Study guide distribution',
  ],
  lifecycleStages: [
    'Executive prioritization',
    'Research validation',
    'Product planning',
    'Content creation',
    'Operational publication',
    'Knowledge capture',
    'Executive review',
  ],
  governanceRequirements: [
    'Biblical accuracy review',
    'Denominational sensitivity check',
    'Educational level appropriateness',
    'Content freshness schedule',
  ],
  operationalCadence: 'Bi-weekly content release cycle with quarterly curriculum reviews',
  successMetrics: [
    'Module published on schedule',
    'Research sources cited and verified',
    'Governance approval obtained',
    'Knowledge captured for reuse',
    'EIS reflects accurate organizational state',
  ],
  officeMappings: [
    {
      office: 'Executive Office',
      responsibilities: [
        'Set product vision and strategic priorities',
        'Approve major curriculum initiatives',
        'Review organizational health via EIS',
        'Allocate cross-product resources',
      ],
    },
    {
      office: 'Research Office',
      responsibilities: [
        'Validate biblical and historical accuracy',
        'Review educational methodology',
        'Identify cross-product research reuse',
        'Assess content confidence and source quality',
      ],
    },
    {
      office: 'Product Office',
      responsibilities: [
        'Maintain curriculum roadmap',
        'Plan character study releases',
        'Manage dependencies between modules',
        'Define acceptance criteria for content',
      ],
    },
    {
      office: 'Operations Office',
      responsibilities: [
        'Publish content to Bible Quest platform',
        'Monitor deployment health',
        'Handle incident response',
        'Execute release schedule',
      ],
    },
    {
      office: 'Knowledge Office',
      responsibilities: [
        'Capture curriculum decisions and outcomes',
        'Document reusable content patterns',
        'Track lesson effectiveness data',
        'Archive completed modules for reference',
      ],
    },
  ],
  workflowStageMappings: [
    { stage: 'Product vision and prioritization', responsibleOffice: 'Executive Office', description: 'Executive defines which character or story to prioritize based on strategic goals' },
    { stage: 'Biblical and historical validation', responsibleOffice: 'Research Office', description: 'Research verifies source accuracy, identifies educational value, and assesses confidence' },
    { stage: 'Curriculum planning and roadmap', responsibleOffice: 'Product Office', description: 'Product maps the module onto the curriculum roadmap, defines dependencies and acceptance criteria' },
    { stage: 'Content creation and publication', responsibleOffice: 'Operations Office', description: 'Operations executes content creation, review cycles, and platform publication' },
    { stage: 'Knowledge capture and reuse', responsibleOffice: 'Knowledge Office', description: 'Knowledge documents decisions, captures lessons, and archives reusable patterns' },
    { stage: 'Executive review and delta', responsibleOffice: 'Executive Office', description: 'EIS generates briefing, delta, and recommendations for leadership' },
  ],
  adaptionsFromReference: [
    'Content requires biblical accuracy review (not applicable to MenWise360)',
    'Target audience includes group study context (broadens from individual-focused MenWise360)',
    'Governance includes denominational sensitivity check (unique to Bible Quest)',
  ],
};
