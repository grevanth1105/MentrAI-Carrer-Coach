"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { redirect } from "next/navigation";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateAIInsights(industry) {
  const prompt = `
    Analyze the current state of the ${industry} industry and provide insights ONLY in the following JSON format:

    {
      "salaryRanges": [
        { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
      ],
      "growthRate": number,
      "demandLevel": "High" | "Medium" | "Low",
      "topSkills": ["skill1", "skill2"],
      "marketOutlook": "Positive" | "Neutral" | "Negative",
      "keyTrends": ["trend1", "trend2"],
      "recommendedSkills": ["skill1", "skill2"]
    }
  `;

  const { response } = await model.generateContent(prompt);
  const raw = response.text();
  const cleaned = raw.replace(/```(?:json)?\n?|```$/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    delete parsed.industry;
    return parsed;
  } catch (e) {
    throw new Error("Failed to parse AI insights.");
  }
}

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");
  if (!user.industry) {
    redirect("/onboarding");
    throw new Error("User industry is missing");
  }
  if (user.industryInsight && user.industryInsight.nextUpdate > new Date()) {
    return user.industryInsight;
  }

  const aiInsights = await generateAIInsights(user.industry);

  const insight = await db.industryInsight.upsert({
    where: { industry: user.industry },
    update: {
      ...aiInsights,
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastUpdated: new Date(),
    },
    create: {
      industry: user.industry,
      ...aiInsights,
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  if (!user.industryInsight) {
    await db.user.update({
      where: { id: user.id },
      data: { industryInsight: { connect: { id: insight.id } } },
    });
  }

  return insight;
}
