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

export const CREATOR_AUTOMATION_PROFILE: ProductDeploymentProfile = {
  productId: 'creator-automation',
  productName: 'Creator Automation',
  version: '1.0.0',
  mission: 'Automate creator workflows — lead capture, qualification, approval, and follow-up through governed operational processes',
  targetUsers: ['Content creators', 'Digital agencies', 'Freelancers', 'Marketing teams'],
  keyWorkflows: [
    'Lead qualification automation',
    'Content approval workflow',
    'Client onboarding sequence',
    'Performance monitoring and alerting',
  ],
  lifecycleStages: [
    'Executive approval of automation initiative',
    'Research workflow requirements and risks',
    'Product design of automation rules',
    'Operations configuration and testing',
    'Automation execution and monitoring',
    'Knowledge capture of reusable templates',
    'Executive review of automation health',
  ],
  governanceRequirements: [
    'Automation safety level classification',
    'Human approval checkpoint placement',
    'Exception handling and retry policy',
    'Audit trail completeness',
  ],
  operationalCadence: 'Continuous automation execution with weekly operations review and monthly optimization cycle',
  successMetrics: [
    'Automation deployed and executing',
    'Human approval checkpoints respected',
    'Exception handling triggers correctly',
    'Audit trail complete and traceable',
    'EIS reports automation health accurately',
  ],
  officeMappings: [
    {
      office: 'Executive Office',
      responsibilities: [
        'Approve automation initiatives and prioritize workflows',
        'Set automation governance policies',
        'Review automation health via EIS',
        'Allocate resources for automation development',
      ],
    },
    {
      office: 'Research Office',
      responsibilities: [
        'Analyze workflow requirements and operational patterns',
        'Assess automation feasibility and risks',
        'Identify cross-product automation reuse opportunities',
        'Evaluate exception scenarios and failure modes',
      ],
    },
    {
      office: 'Product Office',
      responsibilities: [
        'Design automation rules and workflow definitions',
        'Define acceptance criteria and success thresholds',
        'Manage automation roadmap and release schedule',
        'Coordinate dependencies between automations',
      ],
    },
    {
      office: 'Operations Office',
      responsibilities: [
        'Configure and test automation workflows',
        'Monitor automation execution and handle exceptions',
        'Track automation performance metrics',
        'Execute incident response for automation failures',
      ],
    },
    {
      office: 'Knowledge Office',
      responsibilities: [
        'Document automation templates and reusable patterns',
        'Capture lessons from automation exceptions and retries',
        'Archive automation configurations for audit',
        'Publish operational playbooks for common workflows',
      ],
    },
  ],
  workflowStageMappings: [
    { stage: 'Automation initiative approval', responsibleOffice: 'Executive Office', description: 'Executive defines automation objective, approves investment, and sets governance requirements' },
    { stage: 'Workflow requirements and risk analysis', responsibleOffice: 'Research Office', description: 'Research analyzes workflow patterns, identifies risks, and validates automation feasibility' },
    { stage: 'Automation design and planning', responsibleOffice: 'Product Office', description: 'Product designs automation rules, defines acceptance criteria, and schedules release' },
    { stage: 'Configuration, testing, and deployment', responsibleOffice: 'Operations Office', description: 'Operations configures automation rules, runs tests, deploys to production, and monitors execution' },
    { stage: 'Automation documentation and reuse', responsibleOffice: 'Knowledge Office', description: 'Knowledge captures automation as reusable template, documents operational playbook, and archives audit trail' },
    { stage: 'Executive review and optimization', responsibleOffice: 'Executive Office', description: 'EIS generates briefing on automation health, identifies bottlenecks, and recommends improvements' },
  ],
  adaptionsFromReference: [
    'Product is a workflow/process, not content — lifecycle emphasizes execution and monitoring over publication',
    'Governance focuses on automation safety levels and human approval placement (not content accuracy)',
    'Operations focus shifts from deployment to continuous execution, exception handling, and retry management',
    'Knowledge captures reusable automation templates and operational playbooks (not content patterns)',
    'Success measured by automation completion rate and exception frequency rather than content published',
  ],
};

export const VISIONCRAFT_STUDIO_PROFILE: ProductDeploymentProfile = {
  productId: 'visioncraft-studio',
  productName: 'VisionCraft Studio',
  version: '1.0.0',
  mission: 'Enable creative production through governed design workflows — from brief to published visual assets',
  targetUsers: ['Graphic designers', 'Content creators', 'Marketing teams', 'Brand managers'],
  keyWorkflows: [
    'Branded visual campaign production',
    'Design asset creation and review',
    'Brand compliance approval workflow',
    'Asset versioning and archive',
  ],
  lifecycleStages: [
    'Executive brief and campaign approval',
    'Creative research and reference gathering',
    'Design brief definition and planning',
    'Asset production and rendering',
    'Creative review and brand compliance',
    'Publishing and distribution',
    'Knowledge capture of design patterns',
    'Executive review of creative health',
  ],
  governanceRequirements: [
    'Brand compliance review',
    'Creative quality gate',
    'Asset version control',
    'Publishing approval chain',
  ],
  operationalCadence: 'Campaign-based production with weekly creative reviews and monthly portfolio retrospectives',
  successMetrics: [
    'Campaign published on schedule',
    'Brand compliance approval obtained',
    'Assets catalogued and versioned',
    'Design patterns captured for reuse',
    'EIS reports creative workflow health accurately',
  ],
  officeMappings: [
    {
      office: 'Executive Office',
      responsibilities: [
        'Approve campaign briefs and set creative priorities',
        'Define brand strategy and positioning',
        'Review campaign performance via EIS',
        'Allocate creative production resources',
      ],
    },
    {
      office: 'Research Office',
      responsibilities: [
        'Gather design references and user research',
        'Analyze creative trends and audience preferences',
        'Assess brand compliance requirements',
        'Evaluate asset effectiveness from past campaigns',
      ],
    },
    {
      office: 'Product Office',
      responsibilities: [
        'Define creative briefs and acceptance criteria',
        'Plan campaign roadmap and release schedule',
        'Manage dependencies between creative assets',
        'Coordinate cross-campaign design consistency',
      ],
    },
    {
      office: 'Operations Office',
      responsibilities: [
        'Execute asset production and rendering',
        'Manage creative review cycles',
        'Handle publishing and distribution',
        'Monitor rendering performance and incidents',
      ],
    },
    {
      office: 'Knowledge Office',
      responsibilities: [
        'Catalogue produced assets for reuse',
        'Document design patterns and reusable templates',
        'Capture campaign retrospectives and lessons',
        'Archive brand guidelines and compliance records',
      ],
    },
  ],
  workflowStageMappings: [
    { stage: 'Campaign brief and approval', responsibleOffice: 'Executive Office', description: 'Executive defines campaign objective, approves investment, and sets brand priorities' },
    { stage: 'Creative research and references', responsibleOffice: 'Research Office', description: 'Research gathers design references, analyzes audience needs, and validates creative direction' },
    { stage: 'Design brief and planning', responsibleOffice: 'Product Office', description: 'Product defines creative brief, acceptance criteria, and campaign roadmap' },
    { stage: 'Asset production and rendering', responsibleOffice: 'Operations Office', description: 'Operations produces design assets, manages rendering, and coordinates review cycles' },
    { stage: 'Asset cataloguing and pattern capture', responsibleOffice: 'Knowledge Office', description: 'Knowledge catalogues produced assets, documents design patterns, and archives campaign records' },
    { stage: 'Executive review and optimization', responsibleOffice: 'Executive Office', description: 'EIS generates briefing on campaign health, identifies bottlenecks, and recommends improvements' },
  ],
  adaptionsFromReference: [
    'Product is creative production — lifecycle emphasizes design iteration and review cycles over content publication',
    'Governance focuses on brand compliance and creative quality gates (not content accuracy or automation safety)',
    'Operations includes rendering pipeline management and creative review orchestration',
    'Knowledge captures design patterns and reusable templates (not research findings or automation templates)',
    'Success measured by campaign completion rate and brand compliance rather than content published',
  ],
};

export const INSPIREVOICE_PROFILE: ProductDeploymentProfile = {
  productId: 'inspirevoice',
  productName: 'InspireVoice',
  version: '1.0.0',
  mission: 'Enable AI-powered multimedia production through governed media workflows — from script to published video',
  targetUsers: ['Content producers', 'Educational content creators', 'Media teams', 'Narration and voice-over producers', 'Marketing video teams'],
  keyWorkflows: [
    'AI-narrated educational video production',
    'Script generation and voice synthesis',
    'Visual asset coordination and media assembly',
    'Multi-format publishing and distribution',
  ],
  lifecycleStages: [
    'Executive objective and release approval',
    'Research validation and source verification',
    'Script planning and feature definition',
    'Voice generation and audio production',
    'Visual asset production and coordination',
    'Media assembly and video rendering',
    'Quality review and content accuracy gate',
    'Multi-format publishing and distribution',
    'Knowledge capture of prompt patterns and playbooks',
    'Executive review of media production health',
  ],
  governanceRequirements: [
    'Content accuracy and source validation',
    'Voice synthesis quality assurance',
    'Audio production quality standard',
    'Visual asset brand compliance',
    'Multi-format publishing approval',
  ],
  operationalCadence: 'Media production cycles with daily rendering pipelines, quality reviews per production run, and weekly portfolio retrospectives',
  successMetrics: [
    'Educational video published on schedule',
    'Content accuracy verified through source validation',
    'Voice synthesis quality meets production standard',
    'Assets catalogued and patterns captured',
    'EIS accurately represents multimedia production state',
  ],
  officeMappings: [
    {
      office: 'Executive Office',
      responsibilities: [
        'Set product priorities and approve releases',
        'Ensure portfolio alignment across multimedia initiatives',
        'Review media production health via EIS',
        'Approve strategic investments in media capabilities',
      ],
    },
    {
      office: 'Research Office',
      responsibilities: [
        'Validate content accuracy and source materials',
        'Conduct audience research for media targeting',
        'Assess educational effectiveness of published media',
        'Evaluate voice synthesis quality against standards',
      ],
    },
    {
      office: 'Product Office',
      responsibilities: [
        'Plan script production roadmap and feature definition',
        'Define acceptance criteria for media deliverables',
        'Manage dependencies between script, voice, and visual tracks',
        'Coordinate release planning across publishing channels',
      ],
    },
    {
      office: 'Operations Office',
      responsibilities: [
        'Execute rendering, encoding, and multi-format publishing',
        'Monitor media production pipelines and handle incidents',
        'Manage quality review cycles and production scheduling',
        'Coordinate voice synthesis and visual asset rendering',
      ],
    },
    {
      office: 'Knowledge Office',
      responsibilities: [
        'Capture prompt patterns and reusable media workflows',
        'Document production playbooks and encoding profiles',
        'Archive published media and asset libraries',
        'Record quality standards and governance artifacts',
      ],
    },
  ],
  workflowStageMappings: [
    { stage: 'Executive objective and release approval', responsibleOffice: 'Executive Office', description: 'Executive sets product priorities, approves media releases, and ensures portfolio alignment' },
    { stage: 'Research validation and source verification', responsibleOffice: 'Research Office', description: 'Research validates content accuracy, conducts audience research, and assesses educational effectiveness' },
    { stage: 'Script planning and feature definition', responsibleOffice: 'Product Office', description: 'Product plans script production roadmap, defines acceptance criteria, and manages cross-track dependencies' },
    { stage: 'Voice generation and audio production', responsibleOffice: 'Operations Office', description: 'Operations executes voice synthesis, manages audio production pipelines, and coordinates quality review' },
    { stage: 'Visual asset production and coordination', responsibleOffice: 'Operations Office', description: 'Operations produces visual assets, coordinates rendering, and manages media assembly' },
    { stage: 'Media assembly and video rendering', responsibleOffice: 'Operations Office', description: 'Operations assembles final media, renders multi-format outputs, and publishes to distribution channels' },
    { stage: 'Quality review and content accuracy gate', responsibleOffice: 'Operations Office', description: 'Operations manages quality review cycles including content accuracy verification and media quality standards' },
    { stage: 'Knowledge capture and playbook documentation', responsibleOffice: 'Knowledge Office', description: 'Knowledge captures prompt patterns, production playbooks, encoding profiles, and archives published media' },
    { stage: 'Executive review and portfolio optimization', responsibleOffice: 'Executive Office', description: 'EIS generates briefing on media production health, identifies bottlenecks, and recommends improvements' },
  ],
  adaptionsFromReference: [
    'Product is multimedia production — lifecycle spans script through publishing combining educational, orchestration, and creative dimensions',
    'Governance addresses content accuracy, voice quality, visual brand compliance, and publishing approval — the broadest governance surface in the portfolio',
    'Operations owns the most complex pipeline: voice synthesis, visual rendering, media assembly, and multi-format encoding',
    'Knowledge captures prompt patterns and production playbooks spanning script, voice, visual, and media disciplines',
    'Success measured by publication completion, content accuracy verification, and quality standard attainment rather than any single metric',
    'InspireVoice combines challenges validated separately in Bible Quest (educational content), Creator Automation (workflow orchestration), and VisionCraft Studio (creative production) into a single multimedia pipeline',
  ],
};

export const MENWISE360_PROFILE: ProductDeploymentProfile = {
  productId: 'menwise360',
  productName: 'MenWise360',
  version: '1.0.0',
  mission: 'Deliver evidence-based men\'s wellness and coaching content through governed content operations',
  targetUsers: ['Individual men seeking wellness content', 'Health-conscious adults', 'Coaching programme participants'],
  keyWorkflows: [
    'Wellness article research and publication',
    'Coaching content development and deployment',
    'Health research integration and evidence synthesis',
    'User onboarding flow management',
  ],
  lifecycleStages: [
    'Executive objective and content prioritization',
    'Research evidence gathering and validation',
    'Content planning and roadmap definition',
    'Content creation and operational publication',
    'Knowledge capture and lesson documentation',
    'Executive review and organizational health assessment',
  ],
  governanceRequirements: [
    'Health content accuracy and source validation',
    'Wellness claim evidence standard',
    'Content freshness and review schedule',
    'User privacy and data handling compliance',
  ],
  operationalCadence: 'Weekly content publication cycle with monthly wellness topic reviews and quarterly programme retrospectives',
  successMetrics: [
    'Article published on schedule',
    'Research sources cited and confidence scored',
    'Governance approval obtained',
    'Knowledge captured for reuse',
    'EIS reflects accurate organizational state',
  ],
  officeMappings: [
    {
      office: 'Executive Office',
      responsibilities: [
        'Set product vision and strategic wellness priorities',
        'Approve major content initiatives and campaigns',
        'Review organizational health via EIS',
        'Allocate cross-product resources',
      ],
    },
    {
      office: 'Research Office',
      responsibilities: [
        'Validate health and wellness evidence sources',
        'Identify relevant research for content development',
        'Assess content confidence and source quality',
        'Monitor emerging wellness research for applicability',
      ],
    },
    {
      office: 'Product Office',
      responsibilities: [
        'Maintain content roadmap and publication calendar',
        'Plan wellness topic releases and series',
        'Manage dependencies between content items',
        'Define acceptance criteria for articles and programmes',
      ],
    },
    {
      office: 'Operations Office',
      responsibilities: [
        'Publish content to MenWise360 platform',
        'Monitor deployment health and content delivery',
        'Handle content-related incidents and updates',
        'Execute publication and distribution schedule',
      ],
    },
    {
      office: 'Knowledge Office',
      responsibilities: [
        'Capture content decisions and editorial outcomes',
        'Document reusable content patterns and templates',
        'Track content effectiveness and engagement data',
        'Archive published content for reference and reuse',
      ],
    },
  ],
  workflowStageMappings: [
    { stage: 'Executive objective and content prioritization', responsibleOffice: 'Executive Office', description: 'Executive defines wellness topic priority based on strategic goals and audience needs' },
    { stage: 'Research evidence gathering and validation', responsibleOffice: 'Research Office', description: 'Research gathers evidence, validates health sources, and assesses confidence for content development' },
    { stage: 'Content planning and roadmap definition', responsibleOffice: 'Product Office', description: 'Product maps content onto the publication roadmap, defines dependencies and acceptance criteria' },
    { stage: 'Content creation and operational publication', responsibleOffice: 'Operations Office', description: 'Operations executes content creation, editorial review, and platform publication' },
    { stage: 'Knowledge capture and lesson documentation', responsibleOffice: 'Knowledge Office', description: 'Knowledge documents editorial decisions, captures reusable patterns, and archives published content' },
    { stage: 'Executive review and organizational health assessment', responsibleOffice: 'Executive Office', description: 'EIS generates briefing, delta, and recommendations for leadership on content health' },
  ],
  adaptionsFromReference: [
    'Product is individual-focused wellness content — differs from Bible Quest\'s group study and educational context',
    'Governance requires health content accuracy and wellness claim validation rather than biblical accuracy or denominational sensitivity',
    'Lifecycle emphasizes evidence-based content publication over curriculum planning or multimedia production',
    'Operations focus is on content publication cycle rather than workflow automation execution or rendering pipelines',
    'Success measured by publication timeliness, research confidence scoring, and governance compliance rather than campaign completion',
  ],
};
