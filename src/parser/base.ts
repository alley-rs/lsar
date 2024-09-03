import type { NOT_LIVE } from ".";

export default abstract class LiveStreamParser {
  protected roomID: number;
  protected baseURL: string;

  constructor(roomID: number, baseURL: string) {
    this.roomID = roomID;
    this.baseURL = baseURL;
  }

  abstract parse(): Promise<ParsedResult | typeof NOT_LIVE | Error>;

  protected get roomURL(): string {
    return this.baseURL + this.roomID.toString();
  }
}
