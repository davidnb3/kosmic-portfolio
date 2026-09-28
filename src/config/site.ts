export const site = {
  name: "David",
  mark: "DAVID / FOLIO",
  role: "Creative technologist",
  location: "Based in Luxembourg, LU",
  availability: "Available for select projects",
  limboKicker: "You are now entering",
  limboTitle: "The Limbo",
  limboLede: "A space between signal and syntax. Move to choose a direction.",
  musicTitle: "Music & Sound",
  musicLede: "Production, engineering and sonic experiments.",
  softwareTitle: "Software & Web",
  softwareLede: "Interfaces, systems and digital experiences.",
};

export const worlds = [
  { id: "limbo", label: "Limbo", to: "/" },
  { id: "music", label: "Music", to: "/music" },
  { id: "software", label: "Software", to: "/software" },
] as const;
