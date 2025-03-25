import { Anime, AnimeItem } from '#interfaces/anime';
import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

type EmbedderPipeline = (input: string) => Promise<{ data: number[] }>;

const getEmbeddingPipeline = (() => {
  let embedder: EmbedderPipeline | null = null;

  return async (): Promise<EmbedderPipeline> => {
    if (!embedder) {
      const { pipeline, env } = await import('@xenova/transformers');
      env.remoteHost = ''; // Use empty string instead of null
      (env.backends.onnx as any).setOptions({
        executionProviders: ['cpu']
      });

      const extractor = await pipeline(
        'feature-extraction',
        'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
      );

      embedder = async (input: string) => {
        const result = await extractor(input, {
          pooling: 'mean',
          normalize: true
        });
        
        // Convert tensor to JavaScript array using .tolist()
        const embedding = result.tolist();
        const embeddingArray = embedding.flat();
        
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

  const titlesToCompare = ([anime.title, anime.englishTitle, anime.japaneseTitle] as (string | undefined)[])
    .filter((value, index, self): value is string => Boolean(value) && self.indexOf(value) === index);

  const animeTitleEmbeddings = await Promise.all(
    titlesToCompare.map((title) => embedder(title))
  );

  for (const item of animeWebObject) {
    const itemEmbedding = await embedder(item.title);

    const similarities = titlesToCompare.map((_, idx) => {
      return cosineSimilarity(animeTitleEmbeddings[idx].data, itemEmbedding.data);
    });

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
