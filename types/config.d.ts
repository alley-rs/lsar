interface Player {
  path: string;
  args: string[];
}

interface Config {
  player: Player;
  platform: { bilibili: { cookie: string } };
}
