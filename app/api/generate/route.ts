import { NextResponse } from "next/server";

interface GenerateRequestBody {
  template: string;
  tone: string;
  notes: string;
}

interface GenerateSuccessResponse {
  english: string;
  chinese: string;
  bilingual: string;
  captions: string;
}

interface GenerateErrorResponse {
  error: string;
}

type ToneName =
  | "Warm and friendly"
  | "Professional school voice"
  | "Short and efficient";

type TemplateName =
  | "Preschool weekly update"
  | "Elementary homeroom weekly update"
  | "Subject teacher weekly update"
  | "Activities and clubs weekly update"
  | "Field trip and special event update"
  | "Exam and assessment update";

interface ToneProfile {
  learningCount: number;
  activityCount: number;
  homeworkCount: number;
  reminderCount: number;
  nextWeekLines: number;
  greetingEn: string;
  closingEn: string;
  greetingZh: string;
  closingZh: string;
}

interface TemplateProfile {
  learningEn: string[];
  activitiesEn: string[];
  homeworkEn: string[];
  remindersEn: string[];
  nextWeekEn: string[];
  learningZh: string[];
  activitiesZh: string[];
  homeworkZh: string[];
  remindersZh: string[];
  nextWeekZh: string[];
}

const badRequest = (error: string) =>
  NextResponse.json<GenerateErrorResponse>({ error }, { status: 400 });

const validTemplates = [
  "Preschool weekly update",
  "Elementary homeroom weekly update",
  "Subject teacher weekly update",
  "Activities and clubs weekly update",
  "Field trip and special event update",
  "Exam and assessment update",
] as const;

const validTones = [
  "Warm and friendly",
  "Professional school voice",
  "Short and efficient",
] as const;

const isTemplateName = (value: string): value is TemplateName =>
  validTemplates.includes(value as TemplateName);

const isToneName = (value: string): value is ToneName =>
  validTones.includes(value as ToneName);

const cleanNotes = (notes: string) =>
  notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const splitNotePoints = (notes: string) =>
  notes
    .split(/\r?\n|[.;!?]+/)
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, 5);

const hashText = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000003;
  }
  return hash;
};

const pickLines = (lines: string[], count: number, seed: number) => {
  if (count <= 0 || lines.length === 0) {
    return [];
  }

  const uniqueCount = Math.min(count, lines.length);
  const start = seed % lines.length;
  const ordered = [...lines.slice(start), ...lines.slice(0, start)];

  return ordered.slice(0, uniqueCount);
};

const toSentence = (value: string) => {
  const trimmed = value.trim().replace(/[.。!！?？]+$/g, "");
  if (!trimmed) {
    return "";
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}.`;
};

const shorten = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
};

const bulletLines = (lines: string[]) => lines.map((line) => `- ${line}`);

const toneProfiles: Record<ToneName, ToneProfile> = {
  "Warm and friendly": {
    learningCount: 4,
    activityCount: 4,
    homeworkCount: 2,
    reminderCount: 3,
    nextWeekLines: 2,
    greetingEn: "Dear families, thank you for your continued support this week.",
    closingEn: "We appreciate your partnership and look forward to another joyful week ahead.",
    greetingZh: "亲爱的家长朋友，感谢您本周对班级工作的支持与配合。",
    closingZh: "感谢您的陪伴与支持，期待下周继续和孩子们一起成长。",
  },
  "Professional school voice": {
    learningCount: 3,
    activityCount: 3,
    homeworkCount: 2,
    reminderCount: 3,
    nextWeekLines: 2,
    greetingEn: "Dear parents and guardians, please find this week's update below.",
    closingEn: "Thank you for your ongoing cooperation with our learning program.",
    greetingZh: "尊敬的家长，现将本周学习与班级情况汇报如下。",
    closingZh: "感谢您对学校工作的持续支持与配合。",
  },
  "Short and efficient": {
    learningCount: 2,
    activityCount: 2,
    homeworkCount: 1,
    reminderCount: 2,
    nextWeekLines: 1,
    greetingEn: "Dear families, here is this week's key update.",
    closingEn: "Thank you for your support.",
    greetingZh: "各位家长您好，以下是本周重点简报。",
    closingZh: "感谢配合。",
  },
};

const templateProfiles: Record<TemplateName, TemplateProfile> = {
  "Preschool weekly update": {
    learningEn: [
      "Students strengthened daily routines, including arrival, cleanup, and transition time.",
      "Circle-time conversations supported listening skills and turn-taking.",
      "Play-based centers reinforced early language and number recognition.",
      "Social-emotional check-ins helped children practice naming feelings and asking for help.",
    ],
    activitiesEn: [
      "Small-group story retelling encouraged expressive language and confidence.",
      "Sensory table exploration connected vocabulary with hands-on discovery.",
      "Fine-motor stations focused on tracing, cutting, and grip control.",
      "Music-and-movement games supported rhythm, coordination, and joyful participation.",
    ],
    homeworkEn: [
      "Read one short picture book together and ask your child to describe one favorite part.",
      "Practice counting familiar objects at home (toys, steps, or snacks) in short daily moments.",
      "Encourage your child to share one feeling word each evening.",
    ],
    remindersEn: [
      "Please send a labeled water bottle every day.",
      "Pack a spare set of clothes in your child's bag.",
      "Keep bedtime routines steady to support school readiness.",
      "Notify the teacher if dismissal plans change.",
    ],
    nextWeekEn: [
      "Next week we will continue phonics play, counting games, and cooperative routines.",
      "We will also introduce a new classroom helper rotation to build responsibility.",
    ],
    learningZh: [
      "孩子们在入园、整理和过渡环节中的常规表现更加稳定。",
      "晨圈交流中，倾听与轮流表达能力持续提升。",
      "在游戏化学习中，孩子们对数字和语言的识别更主动。",
      "情绪表达与同伴相处能力有明显进步。",
    ],
    activitiesZh: [
      "故事复述活动提升了孩子的表达意愿与语言组织能力。",
      "感官探索区活动帮助孩子在操作中积累词汇与观察经验。",
      "精细动作练习聚焦握笔、剪贴和手眼协调。",
      "音乐律动环节增强了节奏感与课堂参与度。",
    ],
    homeworkZh: [
      "每天安排10分钟亲子共读，并请孩子说一说最喜欢的情节。",
      "在生活场景中进行简单数数练习，巩固数量概念。",
      "鼓励孩子每天表达一个情绪词，增强情绪认知。",
    ],
    remindersZh: [
      "请每天为孩子准备并标注姓名的水杯。",
      "书包内请常备一套替换衣物。",
      "建议保持规律作息，帮助孩子稳定入园状态。",
      "如接送安排有变，请提前告知老师。",
    ],
    nextWeekZh: [
      "下周将继续开展拼音启蒙、数感游戏和合作常规训练。",
      "同时会新增值日小助手轮换，培养责任意识。",
    ],
  },
  "Elementary homeroom weekly update": {
    learningEn: [
      "Students completed core literacy and numeracy targets aligned with this week's lesson goals.",
      "Class discussions showed stronger use of evidence and complete-sentence responses.",
      "Independent reading and writing routines improved overall focus and stamina.",
      "Students practiced self-management through daily planner checks and task tracking.",
    ],
    activitiesEn: [
      "Collaborative group tasks emphasized communication and role-sharing.",
      "Short project blocks connected classroom concepts to real-life examples.",
      "Peer feedback rounds helped students revise and improve work quality.",
      "Morning meetings reinforced classroom expectations and respectful dialogue.",
    ],
    homeworkEn: [
      "Complete assigned reading and submit the response task by the due date.",
      "Review this week's math concepts using the practice sheet.",
      "Organize folder materials and prepare supplies for Monday.",
    ],
    remindersEn: [
      "Please check and sign the student planner each evening.",
      "Ensure homework is submitted on time through the usual channel.",
      "Bring all required materials for specialist classes.",
      "Contact the homeroom teacher early if your child needs additional support.",
    ],
    nextWeekEn: [
      "Next week we will consolidate current units and begin a new writing cycle.",
      "Students will also complete a brief formative check to guide differentiation.",
    ],
    learningZh: [
      "本周语文与数学核心目标推进顺利，学生整体完成度良好。",
      "课堂讨论中，学生能更有条理地表达观点并提供依据。",
      "独立阅读与写作训练使专注力和持续学习能力进一步提升。",
      "学生在学习计划管理与任务跟进方面表现更主动。",
    ],
    activitiesZh: [
      "小组合作任务强化了沟通协作与角色分工意识。",
      "项目化学习活动帮助学生建立知识与生活情境的联系。",
      "同伴互评环节促进了作业修改质量与反思深度。",
      "晨会继续巩固班级规则与积极沟通习惯。",
    ],
    homeworkZh: [
      "请按时完成阅读任务并提交对应学习反馈。",
      "根据练习单复习本周数学重点内容。",
      "周末整理学习资料，周一带齐课堂用品。",
    ],
    remindersZh: [
      "请家长每日查看并签字确认学习手册。",
      "作业请按节点提交，避免集中补交。",
      "请提醒孩子带齐专科课程所需学习用品。",
      "如需学业支持，请尽早与班主任沟通。",
    ],
    nextWeekZh: [
      "下周将继续巩固本阶段重点，并启动新的写作任务。",
      "同时会进行阶段性学习检测，用于后续分层教学安排。",
    ],
  },
  "Subject teacher weekly update": {
    learningEn: [
      "Students worked toward this subject's weekly learning targets through guided instruction and practice.",
      "Key vocabulary and concepts were reinforced with examples and structured questioning.",
      "Formative checks showed improving accuracy in core skill application.",
      "Students practiced explaining their reasoning using subject-specific language.",
    ],
    activitiesEn: [
      "Model-practice-review cycles were used to strengthen conceptual understanding.",
      "Small-group support focused on common misconceptions from classwork.",
      "Practice tasks emphasized transfer of learning to new question types.",
      "Short reflection prompts helped students identify next steps for improvement.",
    ],
    homeworkEn: [
      "Complete the assigned practice set to reinforce this week's concept focus.",
      "Review class notes and mark one area that needs extra revision.",
      "Prepare one question to bring to the next lesson for clarification.",
    ],
    remindersEn: [
      "Please encourage consistent review rather than last-minute study.",
      "Students should bring their subject notebook and required materials each lesson.",
      "Reach out if additional scaffolds or extension tasks are needed.",
      "Regular attendance is important for continuity in this subject sequence.",
    ],
    nextWeekEn: [
      "Next week we will advance to the next concept block and revisit key prerequisite skills.",
      "A short checkpoint will be used to adjust support levels where needed.",
    ],
    learningZh: [
      "本周围绕学科目标开展了系统教学与分层练习。",
      "核心概念与关键术语通过示例讲解得到进一步巩固。",
      "课堂形成性评估显示学生在关键技能应用上稳步提升。",
      "学生在使用学科语言进行思路表达方面进步明显。",
    ],
    activitiesZh: [
      "采用“示范-练习-反馈”流程，帮助学生建立概念理解。",
      "小组辅导重点聚焦课堂中出现的共性难点。",
      "练习任务强调知识迁移与题型适应能力。",
      "学习反思环节帮助学生明确个人改进方向。",
    ],
    homeworkZh: [
      "请完成本周配套练习，巩固课堂重点。",
      "复习课堂笔记，并标记一个需要重点强化的知识点。",
      "下节课前准备一个学习疑问，便于课堂答疑。",
    ],
    remindersZh: [
      "建议保持日常复习节奏，避免考前突击。",
      "请提醒孩子每节课带齐学科资料和学习用品。",
      "如需补充练习或拔高任务，可与任课老师联系。",
      "稳定出勤有助于保持学习连贯性。",
    ],
    nextWeekZh: [
      "下周将进入新知识板块，并同步回顾前置要点。",
      "会安排一次小测用于调整后续教学支持。",
    ],
  },
  "Activities and clubs weekly update": {
    learningEn: [
      "Students demonstrated strong participation and teamwork during club sessions.",
      "Members practiced leadership by taking responsibility for group roles.",
      "Students applied creative thinking to improve project quality and presentation.",
      "Positive peer support contributed to a more inclusive activity environment.",
    ],
    activitiesEn: [
      "This week's sessions focused on skill-building and collaborative challenge tasks.",
      "Student groups shared progress checkpoints and received constructive feedback.",
      "Achievement moments were recognized to reinforce effort and commitment.",
      "Participants reflected on goals and identified practical steps for next week.",
    ],
    homeworkEn: [
      "Optional: review club materials and bring one new idea to the next meeting.",
      "Optional: organize project notes and resources for smoother participation.",
    ],
    remindersEn: [
      "Please ensure students arrive on time for club sessions.",
      "Bring required equipment or materials based on the weekly agenda.",
      "Inform the coach/advisor if a student cannot attend.",
      "Encourage students to complete short follow-up tasks between sessions.",
    ],
    nextWeekEn: [
      "Next week we will continue project development and celebrate milestone progress.",
      "Students will also prepare for a short sharing or showcase segment.",
    ],
    learningZh: [
      "本周社团成员参与度高，团队协作表现积极。",
      "学生在活动中能主动承担角色，责任意识有所提升。",
      "创意表达与问题解决能力在项目实践中得到加强。",
      "同伴支持氛围良好，活动参与体验更具包容性。",
    ],
    activitiesZh: [
      "本周社团围绕技能提升与合作挑战开展活动。",
      "各小组进行了阶段展示，并获得针对性反馈。",
      "对表现突出的过程与成果进行了及时肯定。",
      "学生通过复盘明确了下阶段优化方向。",
    ],
    homeworkZh: [
      "选做：整理本周活动记录，并准备一个下次可实践的新想法。",
      "选做：梳理项目资料，便于下周高效推进。",
    ],
    remindersZh: [
      "请提醒孩子按时参加社团活动。",
      "根据活动安排提前准备相关器材或材料。",
      "如无法到课，请及时向指导老师请假。",
      "鼓励孩子在课后完成简短跟进任务。",
    ],
    nextWeekZh: [
      "下周将继续推进项目任务，并进行阶段成果展示准备。",
      "学生将围绕目标完成一次简短分享。",
    ],
  },
  "Field trip and special event update": {
    learningEn: [
      "Students demonstrated strong engagement and respectful behavior during the event.",
      "The experience helped students connect classroom learning to real-world contexts.",
      "Students practiced observation, questioning, and collaborative discussion.",
      "Reflection activities supported deeper understanding of the event outcomes.",
    ],
    activitiesEn: [
      "The trip/event schedule was completed smoothly with active student participation.",
      "Guided tasks encouraged students to document key observations and insights.",
      "Group debrief sessions helped students summarize what they learned.",
      "Safety and logistics routines were followed effectively throughout.",
    ],
    homeworkEn: [],
    remindersEn: [
      "Please review and return any follow-up forms by the stated deadline.",
      "Check school messages for photo-sharing or event recap details.",
      "Ensure students bring materials needed for post-event reflection activities.",
      "Contact the school office with any event-related questions.",
    ],
    nextWeekEn: [
      "Next week we will complete post-event reflection and connect key takeaways to class units.",
      "Students will use evidence from the event in short writing or discussion tasks.",
    ],
    learningZh: [
      "本次外出/专题活动中，学生整体参与度高，行为规范良好。",
      "学生能将课堂知识与真实情境有效关联。",
      "在观察、提问和合作讨论方面表现积极。",
      "活动复盘帮助学生进一步深化理解与迁移应用。",
    ],
    activitiesZh: [
      "本次活动流程推进顺畅，学生参与积极有序。",
      "任务引导帮助学生记录关键观察点与收获。",
      "小组复盘交流提升了学习总结质量。",
      "活动期间安全与纪律执行到位。",
    ],
    homeworkZh: [],
    remindersZh: [
      "请按时提交活动后续相关回执或确认信息。",
      "请关注班级通知获取活动回顾与照片信息。",
      "请提醒孩子带齐下周复盘活动所需材料。",
      "如有活动相关疑问，请及时联系学校。",
    ],
    nextWeekZh: [
      "下周将完成活动复盘，并与课程学习内容进行关联。",
      "学生会基于活动经历开展简短写作或展示。",
    ],
  },
  "Exam and assessment update": {
    learningEn: [
      "This week focused on reviewing priority standards and assessment-aligned skills.",
      "Students practiced structured response strategies and time management.",
      "Common errors were addressed through targeted reteaching and guided examples.",
      "Students reflected on progress and identified personal revision priorities.",
    ],
    activitiesEn: [
      "Review sessions used mixed-format practice to mirror assessment conditions.",
      "Small-group support targeted key gaps identified in class checks.",
      "Students completed checkpoint tasks and received immediate feedback.",
      "Revision planning tools helped students build manageable study routines.",
    ],
    homeworkEn: [
      "Complete the assigned revision set and check answers carefully.",
      "Use the review guide to revisit weak topics before the next class.",
      "Prepare questions for teacher support during office/help time.",
    ],
    remindersEn: [
      "Please support a consistent home study schedule this week.",
      "Ensure students sleep well and arrive prepared for assessments.",
      "Bring required materials and approved stationery on assessment days.",
      "Contact teachers early if your child needs additional academic support.",
    ],
    nextWeekEn: [
      "Next week we will continue targeted review and begin scheduled assessments.",
      "Support plans will be adjusted based on assessment evidence.",
    ],
    learningZh: [
      "本周教学重点为考核要点复习与核心能力巩固。",
      "学生在答题策略与时间管理方面进行了针对性训练。",
      "针对共性错误已开展定向讲解与强化练习。",
      "学生通过学习反思明确了个人复习重点。",
    ],
    activitiesZh: [
      "复习课程采用多题型训练，贴近真实评估情境。",
      "小组辅导针对课堂检测暴露的薄弱点进行补强。",
      "阶段检查后已及时反馈，帮助学生修正学习方向。",
      "通过复习计划表提升了学习节奏的可执行性。",
    ],
    homeworkZh: [
      "请完成本周复习练习，并认真核对错题。",
      "结合复习提纲回顾薄弱知识点。",
      "准备1-2个问题，在答疑时段与老师沟通。",
    ],
    remindersZh: [
      "请家长协助孩子保持稳定复习节奏。",
      "请保证充足睡眠，以良好状态迎接评估。",
      "考试日请备齐学习用品与必要材料。",
      "如需学习支持，请尽早联系任课老师。",
    ],
    nextWeekZh: [
      "下周将继续进行针对性复习，并按计划开展评估任务。",
      "学校会依据评估结果调整后续学习支持安排。",
    ],
  },
};

const buildEnglishUpdate = (
  template: TemplateName,
  tone: ToneName,
  notes: string,
  notePoints: string[],
  seed: number,
) => {
  const toneProfile = toneProfiles[tone];
  const templateProfile = templateProfiles[template];

  const learningPool = [...templateProfile.learningEn];
  const activityPool = [...templateProfile.activitiesEn];
  const reminderPool = [...templateProfile.remindersEn];
  const homeworkPool = [...templateProfile.homeworkEn];

  if (notePoints[0]) {
    learningPool.unshift(`Teacher-noted focus: ${toSentence(shorten(notePoints[0], 90))}`);
  }
  if (notePoints[1]) {
    activityPool.unshift(`From teacher notes: ${toSentence(shorten(notePoints[1], 90))}`);
  }
  if (notePoints[2]) {
    reminderPool.unshift(`Home follow-up requested: ${toSentence(shorten(notePoints[2], 90))}`);
  }

  const learningLines = pickLines(learningPool, toneProfile.learningCount, seed + 11);
  const activityLines = pickLines(activityPool, toneProfile.activityCount, seed + 29);
  const reminderLines = pickLines(reminderPool, toneProfile.reminderCount, seed + 43);

  const homeworkCount = Math.min(toneProfile.homeworkCount, homeworkPool.length);
  const homeworkLines = pickLines(homeworkPool, homeworkCount, seed + 61);

  const nextWeekLines = pickLines(
    templateProfile.nextWeekEn,
    toneProfile.nextWeekLines,
    seed + 79,
  );

  return [
    "Greeting",
    toneProfile.greetingEn,
    "",
    "Learning Highlights",
    ...bulletLines(learningLines),
    "",
    "Activities and Projects",
    ...bulletLines(activityLines),
    "",
    "Homework",
    ...(homeworkLines.length > 0 ? bulletLines(homeworkLines) : ["No assigned homework this week."]),
    "",
    "Reminders",
    ...bulletLines(reminderLines),
    "",
    "Next Week Preview",
    ...nextWeekLines,
    "",
    "Closing",
    toneProfile.closingEn,
    `Teacher notes used: ${notes}`,
  ].join("\n");
};

const buildChineseUpdate = (
  template: TemplateName,
  tone: ToneName,
  notePoints: string[],
  seed: number,
) => {
  const toneProfile = toneProfiles[tone];
  const templateProfile = templateProfiles[template];

  const learningPool = [...templateProfile.learningZh];
  const activityPool = [...templateProfile.activitiesZh];
  const reminderPool = [...templateProfile.remindersZh];
  const homeworkPool = [...templateProfile.homeworkZh];

  if (notePoints[0]) {
    learningPool.unshift(`结合教师本周记录，重点关注了「${shorten(notePoints[0], 30)}」相关学习表现。`);
  }
  if (notePoints[1]) {
    activityPool.unshift(`活动反馈显示，学生在「${shorten(notePoints[1], 30)}」方面参与积极。`);
  }

  const learningLines = pickLines(learningPool, toneProfile.learningCount, seed + 7);
  const activityLines = pickLines(activityPool, toneProfile.activityCount, seed + 19);
  const reminderLines = pickLines(reminderPool, toneProfile.reminderCount, seed + 31);

  const homeworkCount = Math.min(toneProfile.homeworkCount, homeworkPool.length);
  const homeworkLines = pickLines(homeworkPool, homeworkCount, seed + 47);

  const nextWeekLines = pickLines(
    templateProfile.nextWeekZh,
    toneProfile.nextWeekLines,
    seed + 59,
  );

  return [
    "问候",
    toneProfile.greetingZh,
    "",
    "学习亮点",
    ...bulletLines(learningLines),
    "",
    "活动与项目",
    ...bulletLines(activityLines),
    "",
    "家庭作业",
    ...(homeworkLines.length > 0 ? bulletLines(homeworkLines) : ["本周无书面家庭作业。"]),
    "",
    "温馨提醒",
    ...bulletLines(reminderLines),
    "",
    "下周预告",
    ...nextWeekLines,
    "",
    "结语",
    toneProfile.closingZh,
  ].join("\n");
};

const buildCaptions = (
  template: TemplateName,
  tone: ToneName,
  notes: string,
  notePoints: string[],
) => {
  const keyNote = notePoints[0] ? shorten(notePoints[0], 50) : shorten(notes, 50);

  const toneTag =
    tone === "Warm and friendly"
      ? "warm and reassuring"
      : tone === "Professional school voice"
        ? "formal and clear"
        : "short and direct";

  return [
    `1) ${template}: weekly highlights are ready for families.`,
    `2) Tone: ${toneTag}.`,
    `3) Key focus this week: ${keyNote}.`,
  ].join("\n");
};

export async function POST(request: Request) {
  let body: GenerateRequestBody;

  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (typeof body.template !== "string" || typeof body.tone !== "string") {
    return badRequest("Template and tone must be strings.");
  }

  if (typeof body.notes !== "string") {
    return badRequest("Notes must be a string.");
  }

  if (!isTemplateName(body.template)) {
    return badRequest("Please choose a valid template.");
  }

  if (!isToneName(body.tone)) {
    return badRequest("Please choose a valid tone.");
  }

  const trimmedNotes = cleanNotes(body.notes);

  if (!trimmedNotes) {
    return badRequest("Notes cannot be empty.");
  }

  const notePoints = splitNotePoints(trimmedNotes);
  const seed = hashText(`${body.template}|${body.tone}|${trimmedNotes}`);

  const english = buildEnglishUpdate(
    body.template,
    body.tone,
    trimmedNotes,
    notePoints,
    seed,
  );
  const chinese = buildChineseUpdate(body.template, body.tone, notePoints, seed);
  const captions = buildCaptions(body.template, body.tone, trimmedNotes, notePoints);

  const response: GenerateSuccessResponse = {
    english,
    chinese,
    bilingual: `${english}\n\n${chinese}`,
    captions,
  };

  return NextResponse.json<GenerateSuccessResponse>(response);
}
