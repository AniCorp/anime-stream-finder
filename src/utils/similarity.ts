import { Anime, AnimeItem } from '#interfaces/anime';
import { pipeline, FeatureExtractionPipeline, env } from '@xenova/transformers';

// Disable WASM backend by setting its "enabled" flag to false.
((env.backends.onnx as any).wasm) = { enabled: false };

type EmbedderPipeline = (input: string) => Promise<{ data: number[] }>;

const getEmbeddingPipeline = (() => {
  let embedder: EmbedderPipeline | null = null;

  return async (): Promise<EmbedderPipeline> => {
    if (!embedder) {
      // Force CPU usage by specifying device: -1.
      // (We cast the options as any to bypass type restrictions.)
      const extractor: FeatureExtractionPipeline = await pipeline(
        'feature-extraction',
        'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
        { device: -1 } as any
      );

      embedder = async (input: string) => {
        const result = await extractor(input, { pooling: 'mean', normalize: true });
        let embeddingArray: number[];

        // If result.data is missing, try to use cpuData as fallback.
        if (result.data == null && (result as any).cpuData) {
          embeddingArray = Array.from((result as any).cpuData as Iterable<number>);
        } else if (Array.isArray(result.data)) {
          // If result.data is a 2D array, flatten it.
          embeddingArray = (result.data as number[][]).flat();
        } else {
          embeddingArray = Array.from(result.data as Iterable<number>);
        }
        return { data: embeddingArray };
      };
    }
    return embedder;
  };
})();

function cosineSimilarity(vecA: number[], vecB: number[]) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function attachSimilarityScores(anime: Anime, animeWebObject: AnimeItem[]) {
  const embedder = await getEmbeddingPipeline();

  // Remove duplicates and undefined values among titles.
  const titlesToCompare = ([anime.title, anime.englishTitle, anime.japaneseTitle] as (string | undefined)[])
    .filter((value, index, self): value is string => Boolean(value) && self.indexOf(value) === index);

  // Get embeddings for each title.
  const animeTitleEmbeddings = await Promise.all(
    titlesToCompare.map((title) => embedder(title))
  );

  for (const item of animeWebObject) {
    const itemEmbedding = await embedder(item.title);
    const similarities = titlesToCompare.map((_, idx) =>
      cosineSimilarity(animeTitleEmbeddings[idx].data, itemEmbedding.data)
    );
    const highestSimilarity = Math.max(...similarities);
    item.similarity = {
      highestScore: highestSimilarity,
      detailedScores: titlesToCompare.reduce((obj: Record<string, number>, title, idx) => {
        obj[title] = similarities[idx];
        return obj;
      }, {}),
    };
  }

  return animeWebObject;
}
