// backend/src/services/revision.service.ts

import RevisionSchedule from "../models/RevisionSchedule.model"
import Topic from "../models/Topic.model"
import DailyGoal from "../models/DailyGoal.model"
import ActivityLog from "../models/ActivityLog.model"

import {
  calculateNextReview,
  quizScoreToQuality,
  getInitialSchedule
} from "../utils/spacedRepetition"

import streakService from "./streak.service"

class RevisionService {

async scheduleFirstRevision(userId: string, topicId: string) {
  const schedule = getInitialSchedule(topicId, userId)
  return RevisionSchedule.findOneAndUpdate(
    { userId, topicId },
    { $setOnInsert: schedule },
    { upsert: true, new: true }
  )
}

async completeRevision(userId: string, topicId: string, score: number) {

const schedule = await RevisionSchedule.findOne({ userId, topicId })

if (!schedule) throw new Error("Revision schedule not found")

const item = schedule.revisionDates.find(
(i:any)=> i.status === "pending" || i.status === "overdue"
)

if (!item) throw new Error("No revision pending")

item.status = "completed"
item.completedAt = new Date()
item.score = score

const quality = quizScoreToQuality(score)

const result = calculateNextReview(
schedule.efFactor,
schedule.repetition,
quality
)

schedule.efFactor = result.newEFactor
schedule.repetition = result.newRepetition
schedule.nextReviewDate = result.nextReviewDate
schedule.lastReviewDate = new Date()

schedule.revisionDates.push({
scheduledDate: result.nextReviewDate,
intervalDays: result.nextIntervalDays,
status: "pending"
})

await schedule.save()

await Topic.findByIdAndUpdate(topicId,{
$inc:{revisionCount:1},
masteryScore:score
})

const today = new Date()
today.setHours(0,0,0,0)

await DailyGoal.findOneAndUpdate(
{userId,date:today},
{$inc:{"achieved.revisionDone":1}}
)

await streakService.updateStreak(userId)

await ActivityLog.create({
userId,
type:"revision_done",
entityId:topicId
})

return result
}

async getTodaysRevisions(userId: string){

const today = new Date()
today.setHours(0,0,0,0)

const end = new Date()
end.setHours(23,59,59,999)

const schedules = await RevisionSchedule.find({
userId,
nextReviewDate:{ $lte:end }
}).populate({
path:"topicId",
populate:{ path:"subjectId"}
})

const result = schedules.map((s:any)=>{

const topic = s.topicId as any
const subject = topic?.subjectId as any
const overdue = Boolean(s.nextReviewDate && s.nextReviewDate < today)

const completedCount = Array.isArray(s.revisionDates)
  ? s.revisionDates.filter((d: any) => d.status === "completed").length
  : 0

return {
  scheduleId: s.id,
  topicId: topic?._id?.toString?.() ?? topic?._id,
  subjectId: subject?._id?.toString?.() ?? subject?._id,
  topicName: topic?.name,
  subjectName: subject?.name,
  nextReviewDate: s.nextReviewDate,
  overdue,
  status: overdue ? "overdue" : "due",
  // Fields expected by frontend /revision cards
  lastStudied: topic?.lastStudiedAt ?? s.lastReviewDate ?? s.updatedAt ?? s.createdAt,
  revisionNumber: completedCount + 1,
  masteryScore: topic?.masteryScore ?? 0,
  quizUrl: subject?._id && topic?._id ? `/subjects/${subject._id}/topics/${topic._id}/quiz` : "/revision",
  flashcardUrl: subject?._id && topic?._id ? `/subjects/${subject._id}/topics/${topic._id}/flashcards` : "/revision"
}
})

return result.sort((a,b)=>{

if(a.status==="overdue" && b.status!=="overdue") return -1

const aTime = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : 0
const bTime = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : 0

return aTime - bTime
})
}
async getRevisionCalendar(userId: string, daysAhead=14){

const start=new Date()
start.setHours(0,0,0,0)

const end=new Date()
end.setDate(end.getDate()+daysAhead)

const schedules = await RevisionSchedule.find({
userId,
nextReviewDate:{$gte:start,$lte:end}
}).populate({
path:"topicId",
populate:{path:"subjectId"}
})

const map:any={}

const startISO = start.toISOString().slice(0,10)

for(const s of schedules){

if(!s.nextReviewDate) continue

const date = s.nextReviewDate.toISOString().slice(0,10)

if(!map[date]) {
  const dt = new Date(date + "T00:00:00.000Z")
  map[date] = {
    date,
    day: dt.toLocaleDateString("en-US", { weekday: "short" }),
    today: date === startISO,
    count: 0,
    topics: []
  }
}
map[date].count++
const topic = s.topicId as any
const subject = topic?.subjectId as any

map[date].topics.push({
topicName: topic?.name,
subjectName: subject?.name
})
}

return Object.values(map)
}

async getWeeklySummary(userId:string){

const start=new Date()
start.setDate(start.getDate()-7)

const schedules = await RevisionSchedule.find({userId})

let completed=0
let scores:number[]=[]
let weakTopics:string[]=[]

for(const s of schedules){

for(const r of s.revisionDates){

if(r.completedAt && r.completedAt>=start){

completed++

scores.push(r.score||0)

if((r.score||0)<60) weakTopics.push(s.topicId.toString())
}
}
}

const avgScore = scores.length
? scores.reduce((a,b)=>a+b,0)/scores.length
:0

return{
completed,
averageScore:Math.round(avgScore),
weakTopics
}
}

async markOverdueRevisions(userId:string){

const today=new Date()
today.setHours(0,0,0,0)

const schedules = await RevisionSchedule.find({
userId,
nextReviewDate:{$lt:today}
})

let count=0

for(const s of schedules){

const item=s.revisionDates.find((i:any)=>i.status==="pending")

if(item){
item.status="overdue"
count++
await s.save()
}
}

return count
}

}

export default new RevisionService()