export const speakGuidance = (hazardType) => {
  let message = "";

  switch (hazardType) {
    case "fire":
      message =
        "Take a deep breath. Stay calm. Move away from the fire immediately. Avoid elevators. Use stairs.";
      break;

    case "flood":
      message =
        "Stay calm. Move to higher ground immediately. Avoid walking through flowing water.";
      break;

    case "earthquake":
      message =
        "Stay calm. Drop, cover, and hold on. Stay away from windows.";
      break;

    case "accident":
      message =
        "Stay calm. Check if anyone is injured. Call emergency services immediately.";
      break;

    case "medical":
      message =
        "Stay calm. Call emergency services. Stay with the person and monitor breathing.";
      break;

    default:
      message = "Stay calm. Help is on the way.";
  }

  const speech = new SpeechSynthesisUtterance(message);
  speech.lang = "en-US";
  speech.rate = 1;
  speech.pitch = 1;

  window.speechSynthesis.speak(speech);
};