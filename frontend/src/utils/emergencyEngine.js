export const getInstructions = (type) => {
  switch (type) {
    case "Fire":
      return [
        "Stay low to avoid smoke.",
        "Do not use elevators.",
        "Cover nose with cloth.",
        "Move to nearest exit."
      ];

    case "Flood":
      return [
        "Move to higher ground immediately.",
        "Avoid walking through moving water.",
        "Turn off electricity if possible."
      ];

    case "Earthquake":
      return [
        "Drop, Cover, and Hold.",
        "Stay away from windows.",
        "Do not use lifts."
      ];

    default:
      return [
        "Stay calm.",
        "Assess surroundings.",
        "Contact emergency services."
      ];
  }
};