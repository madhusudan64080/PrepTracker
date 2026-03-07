/**
 * PrepTrack — Curriculum Seeder
 * --------------------------------
 * Usage:
 * node seed-syllabus.js <MONGO_URI> <USER_ID>
 */

const { MongoClient, ObjectId } = require("mongodb")

const MONGO_URI =
  process.argv[2] || "mongodb://localhost:27017/preptrack"

const RAW_USER_ID = process.argv[3] || null

/* -------------------------------------------------------------------------- */
/*                                SYLLABUS                                    */
/* -------------------------------------------------------------------------- */

const SYLLABUS = [

/* ---------------- Programming Foundations ---------------- */

{
name: "Programming Foundations",
description: "Core programming concepts needed before DSA.",
color: "#6366f1",
icon: "💻",
order: 1,
topics: [
{ name: "Variables", difficulty: "easy", estimatedMinutes: 15, order: 1 },
{ name: "Data Types", difficulty: "easy", estimatedMinutes: 15, order: 2 },
{ name: "Input / Output", difficulty: "easy", estimatedMinutes: 15, order: 3 },
{ name: "Control Statements", difficulty: "easy", estimatedMinutes: 20, order: 4 },
{ name: "Functions / Methods", difficulty: "easy", estimatedMinutes: 25, order: 5 },
{ name: "Classes & Objects", difficulty: "medium", estimatedMinutes: 30, order: 6 },
{ name: "Access Modifiers", difficulty: "easy", estimatedMinutes: 15, order: 7 }
]
},

/* ---------------- Core Data Structures ---------------- */

{
name: "Core Data Structures",
description: "Fundamental structures used in coding interviews.",
color: "#8b5cf6",
icon: "📐",
order: 2,
topics: [
{ name: "Arrays", difficulty: "easy", estimatedMinutes: 40, order: 1 },
{ name: "Strings", difficulty: "easy", estimatedMinutes: 40, order: 2 },
{ name: "Stack", difficulty: "medium", estimatedMinutes: 35, order: 3 },
{ name: "Queue", difficulty: "medium", estimatedMinutes: 35, order: 4 },
{ name: "Hash Tables", difficulty: "medium", estimatedMinutes: 35, order: 5 },
{ name: "Frequency Maps", difficulty: "easy", estimatedMinutes: 30, order: 6 },
{ name: "Singly Linked List", difficulty: "medium", estimatedMinutes: 40, order: 7 },
{ name: "Doubly Linked List", difficulty: "medium", estimatedMinutes: 40, order: 8 },
{ name: "Fast/Slow Pointer Technique", difficulty: "medium", estimatedMinutes: 35, order: 9 },
{ name: "Two Pointer Pattern", difficulty: "medium", estimatedMinutes: 35, order: 10 },
{ name: "Sliding Window", difficulty: "medium", estimatedMinutes: 35, order: 11 },
{ name: "Prefix Sum", difficulty: "medium", estimatedMinutes: 35, order: 12 }
]
},

/* ---------------- Algorithms ---------------- */

{
name: "Algorithms & Problem Solving",
description: "Core algorithms required for technical interviews.",
color: "#0ea5e9",
icon: "⚙️",
order: 3,
topics: [
{ name: "Binary Search", difficulty: "medium", estimatedMinutes: 35, order: 1 },
{ name: "Binary Search on Answer", difficulty: "hard", estimatedMinutes: 40, order: 2 },
{ name: "Merge Sort", difficulty: "medium", estimatedMinutes: 35, order: 3 },
{ name: "Quick Sort", difficulty: "medium", estimatedMinutes: 35, order: 4 },
{ name: "Heap Sort", difficulty: "medium", estimatedMinutes: 35, order: 5 },
{ name: "Backtracking", difficulty: "hard", estimatedMinutes: 50, order: 6 },
{ name: "Subsets", difficulty: "medium", estimatedMinutes: 35, order: 7 },
{ name: "Permutations", difficulty: "hard", estimatedMinutes: 40, order: 8 },
{ name: "Combination Sum", difficulty: "medium", estimatedMinutes: 35, order: 9 },
{ name: "Dynamic Programming Basics", difficulty: "medium", estimatedMinutes: 45, order: 10 },
{ name: "0/1 Knapsack", difficulty: "hard", estimatedMinutes: 50, order: 11 },
{ name: "Longest Increasing Subsequence", difficulty: "hard", estimatedMinutes: 50, order: 12 }
]
},

/* ---------------- Advanced Algorithms ---------------- */

{
name: "Advanced Algorithms",
description: "Advanced techniques asked in top tech interviews.",
color: "#9333ea",
icon: "🧠",
order: 4,
topics: [
{ name: "DP on Trees", difficulty: "hard", estimatedMinutes: 60, order: 1 },
{ name: "DP on Graphs", difficulty: "hard", estimatedMinutes: 60, order: 2 },
{ name: "Bitmask DP", difficulty: "hard", estimatedMinutes: 60, order: 3 },
{ name: "Segment Tree", difficulty: "hard", estimatedMinutes: 60, order: 4 },
{ name: "Trie", difficulty: "hard", estimatedMinutes: 50, order: 5 },
{ name: "Fenwick Tree", difficulty: "hard", estimatedMinutes: 50, order: 6 },
{ name: "Strongly Connected Components", difficulty: "hard", estimatedMinutes: 55, order: 7 },
{ name: "Articulation Points", difficulty: "hard", estimatedMinutes: 55, order: 8 },
{ name: "Bridges in Graph", difficulty: "hard", estimatedMinutes: 55, order: 9 }
]
},

/* ---------------- Operating Systems ---------------- */

{
name: "Operating Systems",
description: "OS fundamentals asked in interviews.",
color: "#f59e0b",
icon: "🖥️",
order: 5,
topics: [
{ name: "Process vs Thread", difficulty: "medium", estimatedMinutes: 30, order: 1 },
{ name: "CPU Scheduling", difficulty: "medium", estimatedMinutes: 35, order: 2 },
{ name: "Deadlocks", difficulty: "medium", estimatedMinutes: 35, order: 3 },
{ name: "Memory Management", difficulty: "medium", estimatedMinutes: 30, order: 4 },
{ name: "Virtual Memory", difficulty: "medium", estimatedMinutes: 30, order: 5 },
{ name: "Paging vs Segmentation", difficulty: "medium", estimatedMinutes: 30, order: 6 }
]
},

/* ---------------- DBMS ---------------- */

{
name: "Database Management Systems",
description: "Database theory and SQL practice.",
color: "#b45309",
icon: "🗄️",
order: 6,
topics: [
{ name: "Relational Model", difficulty: "easy", estimatedMinutes: 25, order: 1 },
{ name: "Normalization", difficulty: "medium", estimatedMinutes: 40, order: 2 },
{ name: "SQL Queries", difficulty: "medium", estimatedMinutes: 60, order: 3 },
{ name: "Indexing", difficulty: "medium", estimatedMinutes: 35, order: 4 },
{ name: "Transactions", difficulty: "medium", estimatedMinutes: 30, order: 5 },
{ name: "ACID Properties", difficulty: "medium", estimatedMinutes: 30, order: 6 },
{ name: "Concurrency Control", difficulty: "hard", estimatedMinutes: 35, order: 7 }
]
},

/* ---------------- Networks ---------------- */

{
name: "Computer Networks",
description: "Networking concepts required for backend interviews.",
color: "#0891b2",
icon: "🌐",
order: 7,
topics: [
{ name: "OSI Model", difficulty: "medium", estimatedMinutes: 30, order: 1 },
{ name: "TCP vs UDP", difficulty: "medium", estimatedMinutes: 25, order: 2 },
{ name: "HTTP / HTTPS", difficulty: "medium", estimatedMinutes: 25, order: 3 },
{ name: "DNS", difficulty: "medium", estimatedMinutes: 25, order: 4 },
{ name: "IP Addressing", difficulty: "medium", estimatedMinutes: 30, order: 5 },
{ name: "Subnetting", difficulty: "hard", estimatedMinutes: 35, order: 6 },
{ name: "Routing", difficulty: "hard", estimatedMinutes: 35, order: 7 }
]
},

/* ---------------- OOP ---------------- */

{
name: "Object Oriented Programming",
description: "Object oriented design principles.",
color: "#c026d3",
icon: "🧱",
order: 8,
topics: [
{ name: "Encapsulation", difficulty: "easy", estimatedMinutes: 20, order: 1 },
{ name: "Inheritance", difficulty: "easy", estimatedMinutes: 20, order: 2 },
{ name: "Polymorphism", difficulty: "medium", estimatedMinutes: 25, order: 3 },
{ name: "Abstraction", difficulty: "medium", estimatedMinutes: 25, order: 4 },
{ name: "Interfaces", difficulty: "medium", estimatedMinutes: 25, order: 5 },
{ name: "SOLID Principles", difficulty: "hard", estimatedMinutes: 40, order: 6 },
{ name: "Design Patterns Basics", difficulty: "hard", estimatedMinutes: 40, order: 7 }
]
},

/* ---------------- System Design ---------------- */

{
name: "System Design Basics",
description: "High level architecture for scalable systems.",
color: "#0f766e",
icon: "🏗️",
order: 9,
topics: [
{ name: "Scalability", difficulty: "medium", estimatedMinutes: 30, order: 1 },
{ name: "Load Balancing", difficulty: "medium", estimatedMinutes: 30, order: 2 },
{ name: "Caching", difficulty: "medium", estimatedMinutes: 30, order: 3 },
{ name: "Databases", difficulty: "medium", estimatedMinutes: 30, order: 4 },
{ name: "Message Queues", difficulty: "medium", estimatedMinutes: 30, order: 5 },
{ name: "Microservices", difficulty: "hard", estimatedMinutes: 40, order: 6 },
{ name: "Design URL Shortener", difficulty: "medium", estimatedMinutes: 45, order: 7 },
{ name: "Design Chat System", difficulty: "hard", estimatedMinutes: 50, order: 8 },
{ name: "Design Instagram Feed", difficulty: "hard", estimatedMinutes: 50, order: 9 }
]
},

/* ---------------- Projects ---------------- */

{
name: "Projects",
description: "Hands-on projects demonstrating engineering skills.",
color: "#dc2626",
icon: "🚀",
order: 10,
topics: [
{ name: "Full Stack Application (React + Node + Mongo)", difficulty: "hard", estimatedMinutes: 480, order: 1 },
{ name: "Distributed Task Queue", difficulty: "hard", estimatedMinutes: 360, order: 2 },
{ name: "Data Structure Visualizer", difficulty: "medium", estimatedMinutes: 240, order: 3 }
]
}

]

/* -------------------------------------------------------------------------- */
/*                                  MAIN                                      */
/* -------------------------------------------------------------------------- */

async function main() {

const client = new MongoClient(MONGO_URI)

try {

await client.connect()
console.log("✅ Connected to MongoDB")

const db = client.db()

let userId

if (RAW_USER_ID && ObjectId.isValid(RAW_USER_ID)) {

userId = new ObjectId(RAW_USER_ID)

} else {

console.log("Creating demo user")
const bcrypt = require("bcryptjs")

const hash = await bcrypt.hash("Demo@1234", 10)

const result = await db.collection("users").insertOne({
name: "Demo Student",
email: "demo@preptrack.com",
passwordHash: hash,
createdAt: new Date()
})

userId = result.insertedId

}

let subjectCount = 0
let topicCount = 0

for (const subject of SYLLABUS) {

const result = await db.collection("subjects").findOneAndUpdate(
{ userId, name: subject.name },
{
$setOnInsert: {
userId,
name: subject.name,
description: subject.description,
color: subject.color,
icon: subject.icon,
order: subject.order,
totalTopics: subject.topics.length,
completedTopics: 0,
createdAt: new Date()
}
},
{ upsert: true, returnDocument: "after" }
)

const subjectId = result._id || result.value._id

subjectCount++

for (const topic of subject.topics) {

await db.collection("topics").findOneAndUpdate(
{ userId, subjectId, name: topic.name },
{
$setOnInsert: {
userId,
subjectId,
name: topic.name,
difficulty: topic.difficulty,
estimatedMinutes: topic.estimatedMinutes,
order: topic.order,
status: "not_started",
createdAt: new Date()
}
},
{ upsert: true }
)

topicCount++

}

}

console.log(`✅ Seeded ${subjectCount} subjects`)
console.log(`✅ Seeded ${topicCount} topics`)

} catch (err) {

console.error("Seed error", err)

} finally {

await client.close()

}

}

main()