type MacroResult = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type AnalyzeMealRequest = {
  image_base64?: string;
  image_url?: string;
  mime_type?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function getImageUrl(body: AnalyzeMealRequest) {
  if (body.image_url) {
    return body.image_url;
  }

  if (!body.image_base64) {
    throw new Error("Provide image_base64 or image_url.");
  }

  const mimeType = body.mime_type ?? "image/jpeg";
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    throw new Error("Unsupported image type. Use jpeg, png, or webp.");
  }

  return `data:${mimeType};base64,${body.image_base64}`;
}

function extractOutputText(data: Record<string, unknown>) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const output = Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = Array.isArray((item as { content?: unknown }).content)
      ? ((item as { content: unknown[] }).content)
      : [];

    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const maybeText = part as { type?: unknown; text?: unknown };
      if (maybeText.type === "output_text" && typeof maybeText.text === "string") {
        return maybeText.text;
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}

function validateMacros(value: unknown): MacroResult {
  if (!value || typeof value !== "object") {
    throw new Error("Macro response is not an object.");
  }

  const candidate = value as Record<string, unknown>;
  const keys: (keyof MacroResult)[] = ["calories", "protein", "carbs", "fat"];
  const result = {} as MacroResult;

  for (const key of keys) {
    const amount = Number(candidate[key]);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(`Macro field ${key} must be a non-negative number.`);
    }

    result[key] = Math.round(amount);
  }

  return result;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      return json({ error: "OPENAI_API_KEY is not configured." }, 500);
    }

    const model = Deno.env.get("OPENAI_VISION_MODEL") ?? "gpt-5.5";
    const body = (await request.json()) as AnalyzeMealRequest;
    const imageUrl = getImageUrl(body);

    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Estimate the macros for the visible meal. Return only the requested JSON fields. " +
                  "Use grams for protein, carbs, and fat. If uncertain, provide a conservative estimate."
              },
              {
                type: "input_image",
                image_url: imageUrl
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "meal_macros",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["calories", "protein", "carbs", "fat"],
              properties: {
                calories: {
                  type: "number",
                  minimum: 0
                },
                protein: {
                  type: "number",
                  minimum: 0
                },
                carbs: {
                  type: "number",
                  minimum: 0
                },
                fat: {
                  type: "number",
                  minimum: 0
                }
              }
            }
          }
        },
        max_output_tokens: 300
      })
    });

    const data = (await openAiResponse.json()) as Record<string, unknown>;

    if (!openAiResponse.ok) {
      return json({ error: "OpenAI request failed.", details: data }, openAiResponse.status);
    }

    const outputText = extractOutputText(data);
    const macros = validateMacros(JSON.parse(outputText));

    return json({
      macros,
      model
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 400);
  }
});

