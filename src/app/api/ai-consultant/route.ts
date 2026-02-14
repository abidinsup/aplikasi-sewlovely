import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Fallback recommendations when AI quota is exceeded (Revised for Blackout/Dimout and Modern/Minimalis)
const FALLBACK_RECOMMENDATIONS = [
    {
        title: "Warna Beige (Natural)",
        description: "Warna beige memberikan kesan luas dan hangat pada ruangan Anda. Sangat cocok dipadukan dengan furnitur kayu.",
        colorHex: "#F5F5DC",
        fabricType: "Blackout",
        style: "Minimalis"
    },
    {
        title: "Warna Abu-abu Muda",
        description: "Abu-abu muda memberikan kesan modern dan bersih. Sangat efektif untuk meredam cahaya matahari yang terik.",
        colorHex: "#D3D3D3",
        fabricType: "Dimout",
        style: "Modern"
    },
    {
        title: "Warna Cream",
        description: "Warna cream memberikan suasana klasik namun tetap terlihat minimalis. Cocok untuk menciptakan ruangan yang nyaman.",
        colorHex: "#FFFDD0",
        fabricType: "Dimout",
        style: "Minimalis"
    },
    {
        title: "Warna Smokey Gray",
        description: "Smokey gray memberikan kesan premium dan elegan. Cocok untuk ruang tamu atau kamar tidur utama.",
        colorHex: "#708090",
        fabricType: "Blackout",
        style: "Modern"
    }
];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No image provided" },
                { status: 400 }
            );
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");

        // Get the mime type
        const mimeType = file.type;

        // Get the Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        // Create the prompt for curtain recommendation
        const prompt = `Kamu adalah konsultan desain interior profesional yang ahli dalam pemilihan gorden/tirai.

Analisis foto ruangan ini dan berikan rekomendasi gorden yang paling cocok dengan fokus utama pada PEMILIHAN WARNA.

Berikan respons dalam format JSON dengan struktur berikut (HANYA JSON, tanpa markdown atau text lain):
{
    "title": "Nama warna yang direkomendasikan (contoh: Warna Beige)",
    "description": "Penjelasan singkat (2-3 kalimat) mengapa warna tersebut cocok untuk ruangan ini, mempertimbangkan warna dinding, furniture, dan pencahayaan",
    "colorHex": "Kode warna hex untuk warna gorden yang direkomendasikan (contoh: #F5F5DC)",
    "fabricType": "PILIH SALAH SATU: Blackout atau Dimout",
    "style": "PILIH SALAH SATU: Modern atau Minimalis"
}

PENTING:
- Hanya sarankan warna yang cocok dengan foto ruangan.
- fabricType harus HANYA "Blackout" atau "Dimout".
- style harus HANYA "Modern" atau "Minimalis".

Berikan rekomendasi yang sesuai dengan selera desain interior Indonesia dan tren saat ini.`;

        // Call Gemini Vision API
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
            prompt,
        ]);

        const response = await result.response;
        const text = response.text();

        // Parse the JSON response
        let recommendation;
        try {
            // Clean up the response - remove markdown code blocks if present
            let cleanedText = text.trim();
            if (cleanedText.startsWith("```json")) {
                cleanedText = cleanedText.slice(7);
            }
            if (cleanedText.startsWith("```")) {
                cleanedText = cleanedText.slice(3);
            }
            if (cleanedText.endsWith("```")) {
                cleanedText = cleanedText.slice(0, -3);
            }
            recommendation = JSON.parse(cleanedText.trim());
        } catch (parseError) {
            // If parsing fails, create a structured response from the text
            recommendation = {
                title: "Rekomendasi Warna Gorden",
                description: text,
                colorHex: "#8B7355",
                fabricType: "Blackout",
                style: "Modern"
            };
        }

        return NextResponse.json({
            success: true,
            recommendation,
            source: "ai"
        });

    } catch (error: any) {
        console.error("Gemini API Error:", error);

        // Check for quota exceeded or other errors - use fallback
        const randomIndex = Math.floor(Math.random() * FALLBACK_RECOMMENDATIONS.length);
        const fallbackRecommendation = FALLBACK_RECOMMENDATIONS[randomIndex];

        return NextResponse.json({
            success: true,
            recommendation: {
                ...fallbackRecommendation,
                description: fallbackRecommendation.description
            },
            source: "fallback"
        });
    }
}
