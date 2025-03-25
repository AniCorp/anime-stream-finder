import { Anime, AnimeItem } from "#interfaces/anime";

type FrequencyMap = Record<string, number>;

/**
 * Converts a text string into a frequency map.
 */
function textToFreqVector(text: string): FrequencyMap {
  // Extract words (ignoring punctuation) and convert to lowercase.
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  return words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as FrequencyMap);
}

/**
 * Computes the cosine similarity between two frequency maps.
 */
function cosineSimilarityTF(vecA: FrequencyMap, vecB: FrequencyMap): number {
  let dotProduct = 0;
  for (const key in vecA) {
    if (vecB[key]) {
      dotProduct += vecA[key] * vecB[key];
    }
  }
  const magnitudeA = Math.sqrt(Object.values(vecA).reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(Object.values(vecB).reduce((sum, val) => sum + val * val, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Attaches similarity scores to each AnimeItem in animeWebObject by comparing its title
 * against the available titles in the anime object (e.g. title, englishTitle, japaneseTitle).
 * Instead of using transformer embeddings, we use our own term-frequency based cosine similarity.
 */
export function attachSimilarityScores(anime: Anime, animeWebObject: AnimeItem[]) {
  // Remove duplicates and undefined values among the anime titles.
  const titlesToCompare = ([anime.title, anime.englishTitle, anime.japaneseTitle] as (string | undefined)[])
    .filter((value, index, self): value is string => Boolean(value) && self.indexOf(value) === index);

  // Create frequency vectors for each title in the anime.
  const animeTitleVectors = titlesToCompare.map(textToFreqVector);

  for (const item of animeWebObject) {
    const itemVector = textToFreqVector(item.title);
    // Compute similarity against each title vector.
    const similarities = animeTitleVectors.map(vec => cosineSimilarityTF(vec, itemVector));
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
