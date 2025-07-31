// ---------- Types ----------
interface CardData {
  id: number;
  title: string;
  description: string;
  domain: string;
  x: number;
  y: number;
}

interface Position {
  x: number;
  y: number;
}

interface DomainStat {
  name: string;
  count: number;
}
