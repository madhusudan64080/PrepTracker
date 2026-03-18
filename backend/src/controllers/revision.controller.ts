// backend/src/controllers/revision.controller.ts

import { Request, Response, NextFunction } from "express"
import revisionService from "../services/revision.service"
import aiService from "../services/ai.service"
import Topic from "../models/Topic.model"

export async function todaysRevisions(req:Request,res:Response,next:NextFunction){

try{

const revisions = await revisionService.getTodaysRevisions(req.user!.userId)

res.json({success:true,data:revisions})

}catch(err){next(err)}
}

export async function completeRevision(req:Request,res:Response,next:NextFunction){

try{

const {topicId,score}=req.body

const result=await revisionService.completeRevision(
req.user!.userId,
topicId,
score
)

res.json({success:true,data:result})

}catch(err){next(err)}
}

export async function revisionCalendar(req:Request,res:Response,next:NextFunction){

try{

const data=await revisionService.getRevisionCalendar(req.user!.userId)

res.json({success:true,data})

}catch(err){next(err)}
}

export async function weeklySummary(req:Request,res:Response,next:NextFunction){

try{

const summary=await revisionService.getWeeklySummary(req.user!.userId)

res.json({success:true,data:summary})

}catch(err){next(err)}
}

export async function weeklyQuiz(req:Request,res:Response,next:NextFunction){

try{

const summary=await revisionService.getWeeklySummary(req.user!.userId)

const topics=await Topic.find({_id:{$in:summary.weakTopics}})

const quiz=await aiService.generateWeeklyRevisionQuiz(
topics.map(t=>t.name),
topics.map(t=>t.name)
)

res.json({success:true,data:quiz})

}catch(err){next(err)}
}
export async function overdueRevisions(req: Request, res: Response, next: NextFunction) {
  try {
    const revisions = await revisionService.getTodaysRevisions(req.user!.userId)
    const overdue = Array.isArray(revisions)
      ? revisions.filter((r: any) => r.overdue === true || r.status === "overdue")
      : []
    res.json({ success: true, data: overdue })
  } catch (err) {
    next(err)
  }
}

export async function revisionSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const calendar = await revisionService.getRevisionCalendar(req.user!.userId)
    res.json({ success: true, data: calendar })
  } catch (err) {
    next(err)
  }
}
