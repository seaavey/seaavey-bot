export interface WordGameConfig<T> {
  name: string;
  triggers: string[];
  description: string;
  dataFile: string;
  question: (item: T) => string;
  answer: (item: T) => string;
  emoji: string;
  reward: number;
  timeoutMs?: number;
  timeoutMessage?: (item: T, answer: string) => string;
  correctMessage?: (item: T, answer: string) => string;
  image?: (item: T) => string | undefined;
}
