// backend/src/services/streak.service.ts

import User from "../models/User.model"
import ActivityLog from "../models/ActivityLog.model"

class StreakService {

async updateStreak(userId: string) {

const user = await User.findById(userId)

if (!user) throw new Error("User not found")

const today = new Date()
today.setUTCHours(0,0,0,0)

const lastActive = user.streak.lastActiveDate

if (lastActive) {

const last = new Date(lastActive)
last.setUTCHours(0,0,0,0)

const diff = Math.floor((today.getTime() - last.getTime()) / 86400000)

if (diff === 0) {
return { currentStreak: user.streak.currentStreak, isNewRecord:false }
}

if (diff === 1) {
user.streak.currentStreak++
} else {
user.streak.currentStreak = 1
}
}
else {
user.streak.currentStreak = 1
}

const prevLongest = user.streak.longestStreak

if (user.streak.currentStreak > user.streak.longestStreak) {
user.streak.longestStreak = user.streak.currentStreak
}

user.streak.lastActiveDate = today

await user.save()

const milestones=[7,30,100,365]

if (milestones.includes(user.streak.currentStreak)) {
await ActivityLog.create({
userId,
type:"streak_milestone",
entityName:`${user.streak.currentStreak} days`
})
}

return {
currentStreak:user.streak.currentStreak,
isNewRecord:user.streak.currentStreak>prevLongest
}
}

}

export default new StreakService()