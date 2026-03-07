// backend/src/utils/promptBuilder.ts

const JSON_RULES =
  "Return ONLY valid raw JSON. No markdown. No prose. Use double quotes. No trailing commas.";

export function buildConceptPrompt(subjectName: string, topicName: string): string {
  return `
Role: FAANG Interview Coach
Topic: "${topicName}" (${subjectName})

${JSON_RULES}

Schema:
{
 "concept":{
  "summary":"4 paragraphs: definition, mechanism, tradeoffs, interview usage",
  "keyPoints":["fact1","fact2","fact3","fact4","fact5","fact6","fact7"],
  "realWorldAnalogy":"analogy mapping system parts",
  "prerequisites":["topic1","topic2","topic3"],
  "commonMisconceptions":["WRONG: belief | CORRECT: truth"]
 },
 "visualExplanation":{
  "textDiagram":"ASCII diagram minimum 10 lines",
  "stepByStepBreakdown":[{"step":1,"title":"","description":""}],
  "memoryTrick":"mnemonic"
 },
 "codeExamples":[
  {"language":"python","title":"Basic","code":"","explanation":"","timeComplexity":"","spaceComplexity":""},
  {"language":"python","title":"Interview","code":"","explanation":"","timeComplexity":"","spaceComplexity":""},
  {"language":"python","title":"Optimized","code":"","explanation":"","timeComplexity":"","spaceComplexity":""}
 ],
 "relatedTopics":["topic1","topic2","topic3","topic4","topic5"]
}`;
}

export function buildFlashcardsAndInterviewPrompt(subjectName: string, topicName: string): string {
  return `
Role: FAANG Interview Coach
Topic: "${topicName}" (${subjectName})

${JSON_RULES}

Schema:
{
 "flashcards":[{"id":"f1","front":"","back":"","hint":""}],
 "interviewQuestions":[
  {
   "id":"i1",
   "question":"",
   "type":"conceptual|coding|design",
   "difficulty":"fresher|mid|senior",
   "idealAnswer":"",
   "keyPointsToMention":[],
   "followUpQuestions":[],
   "timeToAnswer":120
  }
 ]
}`;
}

export function buildCodingPatternsPrompt(subjectName: string, topicName: string): string {
  return `
Role: FAANG Engineer
Topic: "${topicName}" (${subjectName})

${JSON_RULES}

Schema:
{
 "patterns":[
  {"name":"","language":"python","code":"","description":"","timeComplexity":"","spaceComplexity":""}
 ],
 "tipsTricks":[],
 "interviewQuestions":[]
}`;
}

export function buildExampleBasedPrompt(subjectName: string, topicName: string): string {
  return `
Teach "${topicName}" through examples.

${JSON_RULES}

Schema:
{
 "examples":[
  {"title":"Easy|Medium|Hard|Interview","problem":"","solution":"","code":"","explanation":""}
 ],
 "practiceProblems":[],
 "conceptsCovered":[],
 "commonMistakes":[]
}`;
}

export function buildRevisionPrompt(subjectName: string, topicName: string): string {
  return `
Revision sheet for "${topicName}" (${subjectName})

${JSON_RULES}

Schema:
{
 "quickSummary":"",
 "keyFormulas":[],
 "mindMap":{"center":"","branches":[{"label":"","children":[]}]},
 "lastMinuteTips":[],
 "flashcards":[]
}`;
}

export function buildProjectStagesPrompt(name: string, description: string, techStack: string[]): string {
  return `Create JSON array of 9 project stages for "${name}". Desc: ${description}. Stack: ${techStack.join(
    ", "
  )}. ${JSON_RULES}`;
}

export function buildProjectSingleStagePrompt(
  projectName: string,
  description: string,
  techStack: string[],
  stageNumber: number,
  stageName: string
): string {
  return `JSON for stage ${stageNumber} "${stageName}" of project "${projectName}". Stack: ${techStack.join(
    ", "
  )}. ${JSON_RULES}. Fields: explanation,keyPoints,codeSnippets,checklistItems,resources,tips.`;
}

export function buildCodingHintsPrompt(title: string, topic: string, difficulty: string): string {
  return `Hints for "${title}" topic ${topic} difficulty ${difficulty}. ${JSON_RULES}
Schema: {"hints":[{"level":1,"hint":""}],"approach":"","keyInsight":""}`;
}

export function buildWeeklyRevisionQuizPrompt(topicNames: string[], weakTopics: string[]): string {
  return `15 MCQ questions for ${topicNames.join(
    ", "
  )}. Focus on weak topics: ${weakTopics.join(", ")}. ${JSON_RULES}
Schema: [{"question":"","options":[],"correctAnswer":"","explanation":""}]`;
}

export function buildCompanyInterviewPrompt(company: string, topics: string[]): string {
  return `Interview questions for ${company} on ${topics.join(
    ", "
  )}. ${JSON_RULES}
Schema: [{"question":"","idealAnswer":"","difficulty":"","type":""}]`;
}