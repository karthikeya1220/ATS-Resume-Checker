import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveResumeToFirebase } from "./firebase-helpers";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function analyzeResume(file: File, userId: string, userEmail: string) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 1,
        topK: 1,
        maxOutputTokens: 2048,
      },
    });

    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString("base64");

    const prompt = `You are an experienced IT recruitment specialist. Carefully analyze the attached resume and extract the following candidate's details:
    - Name
    - Phone number
    - Email
    - Social profile links
    - Education details
    - Work experience details
    - Key skills (Return as a single flat array without subcategories)
    - Project experience
    - Profile summary (Concise and relevant summary of the candidate’s expertise and background)

    Ensure the output is in valid JSON format with no additional formatting, markdown, or code block syntax. The JSON should be well-structured, accurate, and free from unnecessary nesting or subsections beyond what is specified.`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "application/pdf", data: base64File } },
          ],
        },
      ],
    });

    const response = await result.response;
    const responseText = await response.text();
    console.log("AI Model Response:", responseText);

    // Clean the response text by removing markdown code block syntax
    const cleanResponse = responseText
      .replace(/```json\n?/, '')  // Remove opening code block
      .replace(/```\n?$/, '')     // Remove closing code block
      .trim();                    // Remove extra whitespace

    let analysisJson;
    try {
      analysisJson = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid JSON response from AI model");
    }

    // Save to Firebase
    const savedData = await saveResumeToFirebase(file, analysisJson, userId, userEmail);
    
    return {
      analysis: analysisJson,
      savedData
    };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw error;
  }
}
