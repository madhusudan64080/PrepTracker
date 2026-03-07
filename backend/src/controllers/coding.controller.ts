// backend/src/controllers/coding.controller.ts

import { Request, Response, NextFunction } from "express"
import CodingProblem from "../models/CodingProblem.model"
import DailyGoal from "../models/DailyGoal.model"
import ActivityLog from "../models/ActivityLog.model"
import streakService from "../services/streak.service"
import contentService from "../services/content.service"

/* ----------------------
   Get Problems
---------------------- */

export async function getProblems(req:Request,res:Response,next:NextFunction){

try{

const {difficulty,platform,topic,status,search,page=1,limit=20}=req.query as any

const filter:any={userId:req.user!.userId}

if(difficulty) filter.difficulty=difficulty
if(platform) filter.platform=platform
if(topic) filter.topic=topic
if(status) filter.status=status

if(search) filter.title={$regex:search,$options:"i"}

const skip=(page-1)*limit

const problems=await CodingProblem.find(filter).skip(skip).limit(Number(limit))

const total=await CodingProblem.countDocuments(filter)

res.json({
success:true,
data:{
problems,
total,
page:Number(page),
totalPages:Math.ceil(total/limit),
hasMore:skip+problems.length<total
}
})

}catch(err){next(err)}
}

/* ----------------------
   Create Problem
---------------------- */

const topicTagMap:any={
array:"arrays",
dp:"dynamic-programming",
dynamic:"dynamic-programming",
graph:"graphs",
tree:"trees",
string:"strings",
heap:"heaps",
stack:"stacks",
queue:"queues",
greedy:"greedy"
}

export async function createProblem(req:Request,res:Response,next:NextFunction){

try{

const topic=req.body.topic.toLowerCase()

const tags=[]

for(const key in topicTagMap){
if(topic.includes(key)) tags.push(topicTagMap[key])
}

const problem=await CodingProblem.create({
...req.body,
tags,
userId:req.user!.userId
})

res.status(201).json({success:true,data:problem})

}catch(err){next(err)}
}

/* ----------------------
   Update Problem
---------------------- */

export async function updateProblem(req:Request,res:Response,next:NextFunction){

try{

const problem=await CodingProblem.findById(req.params.id)

if(!problem || problem.userId.toString()!==req.user!.userId){
return res.status(403).json({success:false,error:"Forbidden"})
}

const prevStatus=problem.status

Object.assign(problem,req.body)

await problem.save()

if(prevStatus!=="solved" && problem.status==="solved"){

const today=new Date()
today.setUTCHours(0,0,0,0)

await DailyGoal.findOneAndUpdate(
{userId:req.user!.userId,date:today},
{$inc:{"achieved.problemsSolved":1}}
)

await streakService.updateStreak(req.user!.userId)

await ActivityLog.create({
userId:req.user!.userId,
type:"problem_solved",
entityId:problem.id
})
}

res.json({success:true,data:problem})

}catch(err){next(err)}
}

/* ----------------------
   Add Attempt
---------------------- */

export async function addAttempt(req:Request,res:Response,next:NextFunction){

try{

const problem=await CodingProblem.findById(req.params.id)

problem!.attempts.push({
date:new Date(),
...req.body
})

if(req.body.successful){
problem!.status="solved"
}

await problem!.save()

res.json({success:true,data:problem})

}catch(err){next(err)}
}

/* ----------------------
   AI Hints
---------------------- */

export async function getAiHints(req:Request,res:Response,next:NextFunction){

try{

const problem=await CodingProblem.findById(req.params.id)

const hints=await contentService.getCodingHints(
problem!.id,
problem!.title,
problem!.topic,
problem!.difficulty
)

res.json({success:true,data:hints})

}catch(err){next(err)}
}
/* ----------------------
   Delete Problem
---------------------- */

export async function deleteProblem(req: Request, res: Response, next: NextFunction) {
  try {
    const problem = await CodingProblem.findById(req.params.id)
    if (!problem || problem.userId.toString() !== req.user!.userId) {
      return res.status(403).json({ success: false, error: "Forbidden" })
    }
    await problem.deleteOne()
    res.json({ success: true, message: "Problem deleted" })
  } catch (err) { next(err) }
}

/* ----------------------
   Get Stats
---------------------- */

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const [total, solved, attempted, easy, medium, hard] = await Promise.all([
      CodingProblem.countDocuments({ userId }),
      CodingProblem.countDocuments({ userId, status: "solved" }),
      CodingProblem.countDocuments({ userId, status: "attempted" }),
      CodingProblem.countDocuments({ userId, difficulty: "easy" }),
      CodingProblem.countDocuments({ userId, difficulty: "medium" }),
      CodingProblem.countDocuments({ userId, difficulty: "hard" }),
    ])
    res.json({ success: true, data: { total, solved, attempted, easy, medium, hard } })
  } catch (err) { next(err) }
}
