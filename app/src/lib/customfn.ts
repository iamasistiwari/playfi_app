export const formatSentence = (sentence: string) => {
  if (!sentence) return "";
  sentence = sentence.replace(/[^a-zA-Z0-9\s]/g, "");
  const words = sentence.split(" ").filter(Boolean);
  const formattedWords = words.map((word, index) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return formattedWords.join(" ");
};

export const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};
