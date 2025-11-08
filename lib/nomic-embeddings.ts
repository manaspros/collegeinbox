/**
 * Nomic AI Embeddings
 *
 * Uses Nomic's text-embedding-nomic-embed-text-v1.5 model for vector embeddings
 * Much more cost-effective and scalable than Gemini embeddings
 */

if (!process.env.NOMIC_API_KEY) {
  console.warn("⚠️  NOMIC_API_KEY is not set. Embeddings will not work.");
}

const NOMIC_API_URL = "https://api-atlas.nomic.ai/v1/embedding/text";
const NOMIC_MODEL = "nomic-embed-text-v1.5";

/**
 * Generate embedding using Nomic AI
 * @param text - Text to embed (max 8192 tokens)
 * @returns Embedding vector (768 dimensions) or null on error
 */
export async function generateNomicEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.NOMIC_API_KEY) {
    console.error("NOMIC_API_KEY not configured");
    return null;
  }

  try {
    // Truncate text if too long (8192 token limit ≈ 32,000 characters)
    const truncatedText = text.length > 30000 ? text.substring(0, 30000) : text;

    const response = await fetch(NOMIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NOMIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: NOMIC_MODEL,
        texts: [truncatedText],
        task_type: "search_document", // For indexing documents
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Nomic API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();

    // Nomic returns embeddings in data.embeddings[0]
    if (data.embeddings && data.embeddings[0]) {
      return data.embeddings[0];
    }

    console.error("Invalid Nomic API response:", data);
    return null;
  } catch (error) {
    console.error("Error generating Nomic embedding:", error);
    return null;
  }
}

/**
 * Generate query embedding for search
 * Uses task_type: "search_query" for optimal search performance
 */
export async function generateNomicQueryEmbedding(query: string): Promise<number[] | null> {
  if (!process.env.NOMIC_API_KEY) {
    console.error("NOMIC_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(NOMIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NOMIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: NOMIC_MODEL,
        texts: [query],
        task_type: "search_query", // For search queries
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Nomic API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();

    if (data.embeddings && data.embeddings[0]) {
      return data.embeddings[0];
    }

    console.error("Invalid Nomic API response:", data);
    return null;
  } catch (error) {
    console.error("Error generating Nomic query embedding:", error);
    return null;
  }
}

/**
 * Batch generate embeddings for multiple texts
 * More efficient than calling generateNomicEmbedding multiple times
 */
export async function generateNomicEmbeddingsBatch(texts: string[]): Promise<number[][] | null> {
  if (!process.env.NOMIC_API_KEY) {
    console.error("NOMIC_API_KEY not configured");
    return null;
  }

  try {
    // Truncate each text
    const truncatedTexts = texts.map(text =>
      text.length > 30000 ? text.substring(0, 30000) : text
    );

    const response = await fetch(NOMIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NOMIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: NOMIC_MODEL,
        texts: truncatedTexts,
        task_type: "search_document",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Nomic API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();

    if (data.embeddings) {
      return data.embeddings;
    }

    console.error("Invalid Nomic API response:", data);
    return null;
  } catch (error) {
    console.error("Error generating Nomic embeddings batch:", error);
    return null;
  }
}
