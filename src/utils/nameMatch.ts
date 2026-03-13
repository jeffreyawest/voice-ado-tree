import type { Person } from "../graph/types";

/** Common nickname → canonical name mappings */
const NICKNAME_MAP: Record<string, string[]> = {
  robert: ["bob", "bobby", "rob", "robbie"],
  william: ["will", "bill", "billy", "willy"],
  james: ["jim", "jimmy", "jamie"],
  john: ["jack", "johnny"],
  richard: ["rick", "dick", "rich"],
  frederick: ["fred", "freddy"],
  edward: ["ed", "eddie", "ted", "teddy"],
  thomas: ["tom", "tommy"],
  charles: ["charlie", "chuck"],
  michael: ["mike", "mikey"],
  joseph: ["joe", "joey"],
  samuel: ["sam", "sammy"],
  daniel: ["dan", "danny"],
  benjamin: ["ben", "benny"],
  elizabeth: ["liz", "lizzy", "beth", "betty"],
  margaret: ["maggie", "meg", "peggy"],
  katherine: ["kate", "kathy", "katie", "cathy", "catherine"],
  jennifer: ["jen", "jenny"],
  rebecca: ["becca", "becky"],
  susan: ["sue", "susie"],
  patricia: ["pat", "patty"],
  alexander: ["alex"],
  matthew: ["matt"],
  nicholas: ["nick"],
  anthony: ["tony"],
  andrew: ["andy", "drew"],
  christopher: ["chris"],
  timothy: ["tim"],
  jonathan: ["jon"],
  stephanie: ["steph"],
  victoria: ["vicky", "tori"],
};

/** Build reverse map: nickname → canonical */
const REVERSE_MAP: Record<string, string> = {};
for (const [canonical, nicks] of Object.entries(NICKNAME_MAP)) {
  for (const nick of nicks) {
    REVERSE_MAP[nick] = canonical;
  }
}

function canonical(name: string): string {
  const lower = name.toLowerCase().trim();
  return REVERSE_MAP[lower] ?? lower;
}

/** Find a person by name using fuzzy nickname matching */
export function findPersonByName(persons: Person[], name: string): Person | undefined {
  const target = canonical(name);
  return persons.find((p) => canonical(p.name) === target || p.name.toLowerCase() === name.toLowerCase());
}
