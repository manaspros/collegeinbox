import { Pinecone } from "@pinecone-database/pinecone";
import { generateEmbedding } from "./gemini";

let pinecone: Pinecone | null = null;

// Initialize Pinecone client
export function getPineconeClient() {
  if (!process.env.PINECONE_API_KEY) {
    console.warn("Pinecone API key not set. Semantic search will be disabled.");
    return null;
  }

  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }

  return pinecone;
}

// Get or create index
export async function getPineconeIndex(indexName: string = "collegiate-inbox") {
  const client = getPineconeClient();
  if (!client) return null;

  try {
    // Check if index exists
    const indexes = await client.listIndexes();
    const indexExists = indexes.indexes?.some((idx) => idx.name === indexName);

    if (!indexExists) {
      console.log(`Creating Pinecone index: ${indexName}`);
      await client.createIndex({
        name: indexName,
        dimension: 768, // Gemini text-embedding-004 dimension
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });

      // Wait for index to be ready
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    return client.index(indexName);
  } catch (error) {
    console.error("Error getting Pinecone index:", error);
    return null;
  }
}

// Index a document for semantic search
export async function indexDocument(
  userId: string,
  documentId: string,
  content: {
    name: string;
    course: string;
    text?: string;
  }
) {
  try {
    const index = await getPineconeIndex();
    if (!index) {
      console.warn("Pinecone not available. Skipping document indexing.");
      return null;
    }

    // Generate embedding for document metadata and content
    const textToEmbed = `${content.name} ${content.course} ${content.text || ""}`;
    const embedding = await generateEmbedding(textToEmbed);

    if (!embedding) {
      throw new Error("Failed to generate embedding");
    }

    // Upsert to Pinecone
    const embeddingId = `${userId}-${documentId}`;
    await index.upsert([
      {
        id: embeddingId,
        values: embedding,
        metadata: {
          userId,
          documentId,
          name: content.name,
          course: content.course,
        },
      },
    ]);

    return embeddingId;
  } catch (error) {
    console.error("Error indexing document:", error);
    return null;
  }
}

// Search documents semantically
export async function searchDocuments(userId: string, query: string, topK: number = 5) {
  try {
    const index = await getPineconeIndex();
    if (!index) {
      console.warn("Pinecone not available. Semantic search disabled.");
      return [];
    }

    // Generate embedding for query
    const embedding = await generateEmbedding(query);
    if (!embedding) {
      throw new Error("Failed to generate query embedding");
    }

    // Query Pinecone
    const results = await index.query({
      vector: embedding,
      topK,
      filter: { userId },
      includeMetadata: true,
    });

    return results.matches || [];
  } catch (error) {
    console.error("Error searching documents:", error);
    return [];
  }
}

// Delete a document from index
export async function deleteDocument(embeddingId: string) {
  try {
    const index = await getPineconeIndex();
    if (!index) return false;

    await index.deleteOne(embeddingId);
    return true;
  } catch (error) {
    console.error("Error deleting document:", error);
    return false;
  }
}
