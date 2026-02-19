export const speak = (text) => {
  if (!window.speechSynthesis) {
    alert("Speech not supported in this browser");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;      // speed
  utterance.pitch = 1;     // tone
  utterance.volume = 1;    // volume

  window.speechSynthesis.speak(utterance);
};