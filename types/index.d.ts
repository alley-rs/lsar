type Platform = "douyu" | "huya" | "bilibili" | "douyin";

interface ParsedResult {
  platform: Platform;
  title: string;
  anchor: string;
  roomID: number;
  category: string;
  links: string[];
}

interface HistoryItem extends Omit<ParsedResult, "links" | "title" | "roomID"> {
  id: number;
  last_play_time: Date;
  last_title: string;
  room_id: number;
}
