/**
 * AI & Smart NLP SOS Message Parser
 * Integrates Google Gemini API when GEMINI_API_KEY is available,
 * with resilient offline heuristic regex NLP parser for Sylhet disaster zones.
 */

// Resilient Regex & Heuristic Fallback Engine
const parseLocally = (rawText = "") => {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Phone Extraction (Bangladeshi 11-digit mobile: 013-019)
  const phoneMatch = text.match(/(?:\+?88)?01[3-9]\d{8}/);
  const contactInfo = phoneMatch ? phoneMatch[0] : "";

  // 2. People Count Extraction ("৫ জন", "৩ jon", "10 people", etc.)
  let peopleCount = 1;
  const countMatch = text.match(/(\d+)\s*(?:জন|jon|manush|people|person|persons)/i);
  if (countMatch && countMatch[1]) {
    peopleCount = Math.max(1, parseInt(countMatch[1], 10));
  } else {
    // English words
    const wordCount = {
      এক: 1,
      দুই: 2,
      তিন: 3,
      চার: 4,
      পাঁচ: 5,
      ছয়: 6,
      সাত: 7,
      আট: 8,
      নয়: 9,
      দশ: 10,
    };
    for (const [k, v] of Object.entries(wordCount)) {
      if (text.includes(`${k} জন`)) {
        peopleCount = v;
        break;
      }
    }
  }

  // 3. Location & Zone Detection
  let zone = "Other";
  let location = "Sylhet Flood Region";

  if (lower.includes("কোম্পানীগঞ্জ") || lower.includes("companygonj") || lower.includes("kompanigonj")) {
    zone = "Companygonj";
    location = "Companygonj, Sylhet";
  } else if (lower.includes("গোয়াইনঘাট") || lower.includes("gowainghat") || lower.includes("জাফলং") || lower.includes("jaflong")) {
    zone = "Gowainghat";
    location = "Gowainghat, Sylhet";
  } else if (lower.includes("কানাইঘাট") || lower.includes("kanaighat")) {
    zone = "Kanaighat";
    location = "Kanaighat, Sylhet";
  } else if (lower.includes("জালালাবাদ") || lower.includes("jalalabad")) {
    zone = "Jalalabad Ghat";
    location = "Jalalabad Ghat, Sylhet";
  } else if (lower.includes("সুনামগঞ্জ") || lower.includes("sunamganj") || lower.includes("ছাতক") || lower.includes("chhatak")) {
    zone = "Sunamganj Border";
    location = "Sunamganj Border, Sylhet Division";
  } else if (lower.includes("উপশহর") || lower.includes("uposhahar") || lower.includes("shahjalal")) {
    zone = "Shahjalal Uposhahar";
    location = "Shahjalal Uposhahar, Sylhet";
  } else if (lower.includes("সিলেট") || lower.includes("sylhet") || lower.includes("sadar")) {
    zone = "Sylhet Sadar";
    location = "Sylhet Sadar";
  }

  // Refine exact landmark from text if mentions bridge, ghat, bazar, school
  const landmarkMatch = text.match(/(?:বাজার|ঘাট|স্কুল|ব্রিজ|মাদরাসা|ছাদে|হাসপাতাল|বাড়ি|গ্রাম)[^,।\n]*/);
  if (landmarkMatch && landmarkMatch[0]) {
    location = `${location} (${landmarkMatch[0].trim()})`;
  }

  // 4. Urgency Detection
  let urgency = "High";
  if (
    lower.includes("বাঁচান") ||
    lower.includes("ডুবে") ||
    lower.includes("মরে") ||
    lower.includes("ছাদে") ||
    lower.includes("emergency") ||
    lower.includes("urgent") ||
    lower.includes("পানি বাড়ছে") ||
    lower.includes("বোট পাঠান") ||
    lower.includes("critical")
  ) {
    urgency = "Critical";
  } else if (lower.includes("খাবার") || lower.includes("পানি") || lower.includes("অসুস্থ")) {
    urgency = "High";
  } else {
    urgency = "Moderate";
  }

  // 5. Needs Detection
  const needsList = [];
  if (lower.includes("বোট") || lower.includes("নৌকা") || lower.includes("boat") || lower.includes("উদ্ধার") || lower.includes("rescue")) {
    needsList.push("Rescue Boat");
  }
  if (lower.includes("পানি") || lower.includes("water") || lower.includes("খাবার পানি")) {
    needsList.push("Clean Drinking Water");
  }
  if (lower.includes("খাবার") || lower.includes("food") || lower.includes("মুড়ি") || lower.includes("চিড়া")) {
    needsList.push("Dry Food Packages");
  }
  if (lower.includes("ঔষধ") || lower.includes("medicine") || lower.includes("স্যালাইন") || lower.includes("জ্বর")) {
    needsList.push("Emergency Medical & Saline");
  }
  if (lower.includes("বাচ্চা") || lower.includes("baby") || lower.includes("শিশু")) {
    needsList.push("Baby Food & Diapers");
  }

  const needs = needsList.length > 0 ? needsList.join(", ") : "Emergency Rescue, Food & Water";

  return {
    location,
    zone,
    urgency,
    contactInfo: contactInfo || "Not detected (please enter phone number)",
    needs,
    peopleCount,
    isAiProcessed: false,
  };
};

export const parseSosMessage = async (rawText = "") => {
  if (!rawText || !rawText.trim()) {
    throw new Error("SOS raw text is required.");
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an emergency disaster response coordinator for Sylhet flash floods in Bangladesh.
Parse this raw emergency rescue message (which may be in Bengali, Banglish, or English) into a strict JSON object with no markdown wrapping.
Raw Message:
"""
${rawText}
"""

Output JSON Schema:
{
  "location": "Specific location and landmark (e.g. Jalalabad Ghat / Companygonj Bazar, Sylhet)",
  "zone": "One of: 'Companygonj', 'Gowainghat', 'Kanaighat', 'Jalalabad Ghat', 'Sunamganj Border', 'Sylhet Sadar', 'Shahjalal Uposhahar', 'Other'",
  "urgency": "One of: 'Critical', 'High', 'Moderate'",
  "contactInfo": "Detected 11-digit Bangladeshi mobile number or contact text",
  "needs": "Comma separated immediate needs (e.g. Rescue Boat, Drinking Water, Dry Food)",
  "peopleCount": number
}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const parsed = JSON.parse(candidate);
          return {
            ...parsed,
            isAiProcessed: true,
          };
        }
      }
    } catch (apiErr) {
      console.warn("Gemini API call failed, using resilient local parser fallback:", apiErr.message);
    }
  }

  // Instant local NLP fallback
  return parseLocally(rawText);
};
