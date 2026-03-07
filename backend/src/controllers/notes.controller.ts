// backend/src/controllers/notes.controller.ts

import { Request, Response, NextFunction } from "express"
import UserNotes from "../models/UserNotes.model"

/**
 * GET /api/notes/:topicId
 * Get note for a topic
 */
export async function getNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const { topicId } = req.params

    const note = await UserNotes.findOne({
      userId: req.user!.userId,
      topicId
    })

    if (!note) {
      return res.json({
        success: true,
        data: {
          topicId,
          content: ""
        }
      })
    }

    res.json({
      success: true,
      data: note
    })

  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/notes/:topicId
 * Save note for topic
 */
export async function saveNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const { topicId } = req.params
    const { content } = req.body

    const note = await UserNotes.findOneAndUpdate(
      {
        userId: req.user!.userId,
        topicId
      },
      {
        content,
        lastSavedAt: new Date()
      },
      {
        upsert: true,
        new: true
      }
    )

    res.json({
      success: true,
      data: note
    })

  } catch (err) {
    next(err)
  }
}