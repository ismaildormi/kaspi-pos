import { NextRequest, NextResponse } from "next/server";
import { generateTextWithRouter } from "@/lib/ai-router";
import { getRequestContext } from "@/server/auth/context";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    // Allow super admin or tenant users
    const contentType = req.headers.get("content-type") || "";

    let imageDataUri = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("image") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "No image file provided in 'image' form field" },
          { status: 400 }
        );
      }
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mime = file.type || "image/jpeg";
      imageDataUri = `data:${mime};base64,${base64}`;
    } else if (contentType.includes("application/json")) {
      const json = await req.json();
      if (!json.image) {
        return NextResponse.json(
          { error: "Missing 'image' field in JSON payload" },
          { status: 400 }
        );
      }
      imageDataUri = json.image.startsWith("data:")
        ? json.image
        : `data:image/jpeg;base64,${json.image}`;
    } else {
      return NextResponse.json(
        { error: "Unsupported Content-Type. Use multipart/form-data or application/json" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert Moroccan retail inventory AI auditor and product catalog specialist.
Analyze the provided product image carefully.
Extract the product brand and exact commercial name.
Identify if any barcode or EAN-13 is visibly printed on the package.
Determine a suitable retail category in French (e.g., Boissons, Biscuits & Confiserie, Produits Laitiers, Épicerie Salée, Épicerie Sucrée, Hygiène & Entretien, Snack).
Estimate a competitive Moroccan retail sale price in MAD (Moroccan Dirham) typical for Moroccan shops (Marjane, Carrefour, BIM, or local Hanout), along with a standard estimated cost price.

Output STRICTLY valid JSON with no markdown formatting or commentary:
{
  "name": "Product Name",
  "category": "Suggested Category",
  "suggestedPriceMAD": 12.50,
  "costPriceMAD": 9.50,
  "barcode": "6111234567890" or null,
  "unit": "piece",
  "taxRate": 20,
  "description": "Short description of product in French"
}`;

    const prompt = `Please inspect this product image and extract the catalog details for the Moroccan market. Return JSON only.`;

    const result = await generateTextWithRouter({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", image: imageDataUri },
          ],
        },
      ],
    });

    let rawText = result.text.trim();
    // Strip markdown json fences if present
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    let parsedProduct;
    try {
      parsedProduct = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("[AI Product Onboard] JSON parse error on raw AI response:", rawText);
      // Fallback structured extraction
      parsedProduct = {
        name: "Produit Identifié",
        category: "Épicerie Générale",
        suggestedPriceMAD: 15.0,
        costPriceMAD: 11.0,
        barcode: null,
        unit: "piece",
        taxRate: 20,
        description: rawText.slice(0, 150),
      };
    }

    return NextResponse.json({
      success: true,
      provider: result.activeProvider,
      model: result.activeModel,
      product: {
        name: parsedProduct.name || "Produit sans nom",
        category: parsedProduct.category || "Divers",
        suggestedPriceMAD: Number(parsedProduct.suggestedPriceMAD) || 10.0,
        costPriceMAD: Number(parsedProduct.costPriceMAD) || 7.5,
        barcode: parsedProduct.barcode || null,
        unit: parsedProduct.unit || "piece",
        taxRate: Number(parsedProduct.taxRate) || 20,
        description: parsedProduct.description || "",
      },
    });
  } catch (error: any) {
    console.error("[AI Product Onboarding Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze product image" },
      { status: 500 }
    );
  }
}
