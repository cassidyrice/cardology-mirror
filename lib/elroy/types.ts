export type StandardBirth = {
  kind: "standard";
  birthdate: string;
  birthCard: string;
};

export type JokerBirth = {
  kind: "joker";
  birthdate: string;
  birthCard: "Joker";
};

export type ElroyBirth = StandardBirth | JokerBirth;

export type NormalizedElroyRequest = {
  birthdate: string;
  email: string;
  consent: true;
  source: string;
  turnstileToken: string;
};

export type ElroyReading = {
  card: {
    birthCard: string;
    birthCardLabel: string;
    rulingCards: string[];
  };
  reading: {
    core: string;
    tension: string;
    reflection: string;
    disclaimer: string;
  };
};
